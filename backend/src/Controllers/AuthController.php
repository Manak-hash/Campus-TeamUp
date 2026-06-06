<?php

namespace CampusTeamUp\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class AuthController
{
    private $db;

    public function __construct()
    {
        $this->db = (require __DIR__ . '/../../config/database.php')();
    }

    public function register(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $name = trim($body['name'] ?? '');
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        // Basic validation
        if (empty($name) || empty($email) || empty($password)) {
            return $this->jsonResponse($response, ['error' => 'Name, email, and password are required'], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->jsonResponse($response, ['error' => 'Invalid email format'], 400);
        }

        if (strlen($password) < 6) {
            return $this->jsonResponse($response, ['error' => 'Password must be at least 6 characters long'], 400);
        }

        // Check for duplicate email
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            return $this->jsonResponse($response, ['error' => 'Email already registered'], 409);
        }

        // Hash password and insert user
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->db->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$name, $email, $passwordHash]);

        $userId = $this->db->lastInsertId();
        $_SESSION['user_id'] = $userId;

        $userData = [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => 'student'
        ];

        return $this->jsonResponse($response, ['message' => 'User registered successfully', 'user' => $userData], 201);
    }

    public function login(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (empty($email) || empty($password)) {
            return $this->jsonResponse($response, ['error' => 'Email and password are required'], 400);
        }

        $stmt = $this->db->prepare("SELECT id, name, email, password_hash, role FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return $this->jsonResponse($response, ['error' => 'Invalid credentials'], 401);
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];

        unset($user['password_hash']);

        return $this->jsonResponse($response, ['message' => 'Login successful', 'user' => $user], 200);
    }

    public function logout(Request $request, Response $response): Response
    {
        $_SESSION = [];
        session_destroy();

        return $this->jsonResponse($response, ['message' => 'Logged out successfully'], 200);
    }

    public function me(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        return $this->jsonResponse($response, ['user' => $user], 200);
    }

    private function jsonResponse(Response $response, array $data, int $status): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
