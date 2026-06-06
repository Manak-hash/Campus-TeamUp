<?php

namespace CampusTeamUp\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;

class AuthMiddleware
{
    private $db;

    public function __construct()
    {
        $this->db = (require __DIR__ . '/../../config/database.php')();
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorizedResponse();
        }

        $userId = $_SESSION['user_id'];
        $stmt = $this->db->prepare("SELECT id, name, email, role, department, academic_level, bio, avatar_url FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            // User ID in session but not in DB (possibly deleted)
            $_SESSION = [];
            session_destroy();
            return $this->unauthorizedResponse();
        }

        $request = $request->withAttribute('user', $user);
        return $handler->handle($request);
    }

    private function unauthorizedResponse(): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode(['error' => 'Unauthorized. Please login.']));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}
