<?php

namespace CampusTeamUp\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class UserController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getProfile(Request $request, Response $response): Response
    {
        $userId = $request->getHeaderLine('User-Id');
        if (!$userId) {
            $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $stmt = $this->db->prepare("SELECT id, email, name, role, department, academic_level, bio, avatar_url FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'User not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        // Fetch skills
        $stmt = $this->db->prepare("
            SELECT s.id, s.name, us.proficiency_level 
            FROM skills s
            JOIN user_skills us ON s.id = us.skill_id
            WHERE us.user_id = ?
        ");
        $stmt->execute([$userId]);
        $user['skills'] = $stmt->fetchAll();

        $response->getBody()->write(json_encode($user));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getPublicProfile(Request $request, Response $response, array $args): Response
    {
        $userId = $args['id'];

        $stmt = $this->db->prepare("SELECT id, email, name, role, department, academic_level, bio, avatar_url FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'User not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        // Fetch skills
        $stmt = $this->db->prepare("
            SELECT s.id, s.name, us.proficiency_level 
            FROM skills s
            JOIN user_skills us ON s.id = us.skill_id
            WHERE us.user_id = ?
        ");
        $stmt->execute([$userId]);
        $user['skills'] = $stmt->fetchAll();

        $response->getBody()->write(json_encode($user));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function updateProfile(Request $request, Response $response): Response
    {
        $userId = $request->getHeaderLine('User-Id');
        if (!$userId) {
            $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $data = $request->getParsedBody();
        
        $stmt = $this->db->prepare("
            UPDATE users 
            SET name = ?, bio = ?, department = ?, academic_level = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        
        $stmt->execute([
            $data['name'] ?? null,
            $data['bio'] ?? null,
            $data['department'] ?? null,
            $data['academic_level'] ?? null,
            $userId
        ]);

        $response->getBody()->write(json_encode(['message' => 'Profile updated successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getSkills(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT * FROM skills ORDER BY name ASC");
        $skills = $stmt->fetchAll();

        $response->getBody()->write(json_encode($skills));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function updateSkills(Request $request, Response $response): Response
    {
        $userId = $request->getHeaderLine('User-Id');
        if (!$userId) {
            $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $data = $request->getParsedBody();
        $skills = $data['skills'] ?? [];

        try {
            $this->db->beginTransaction();

            // Delete existing skills
            $stmt = $this->db->prepare("DELETE FROM user_skills WHERE user_id = ?");
            $stmt->execute([$userId]);

            // Insert new skills
            $stmt = $this->db->prepare("
                INSERT INTO user_skills (user_id, skill_id, proficiency_level) 
                VALUES (?, ?, ?)
            ");

            foreach ($skills as $skill) {
                $stmt->execute([
                    $userId,
                    $skill['skill_id'],
                    $skill['proficiency_level'] ?? 'beginner'
                ]);
            }

            $this->db->commit();
        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Failed to update skills: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }

        $response->getBody()->write(json_encode(['message' => 'Skills updated successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function uploadAvatar(Request $request, Response $response): Response
    {
        $userId = $request->getHeaderLine('User-Id');
        if (!$userId) {
            $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $uploadedFiles = $request->getUploadedFiles();
        $avatar = $uploadedFiles['avatar'] ?? null;

        if (!$avatar || $avatar->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write(json_encode(['error' => 'Failed to upload avatar']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
        }

        // Validate type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($avatar->getClientMediaType(), $allowedTypes)) {
            $response->getBody()->write(json_encode(['error' => 'Invalid file type. Only image/jpeg, image/png, image/webp allowed.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
        }

        // Validate size (2MB)
        if ($avatar->getSize() > 2 * 1024 * 1024) {
            $response->getBody()->write(json_encode(['error' => 'File too large. Max file size: 2MB']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
        }

        // Storage setup
        $uploadDir = __DIR__ . '/../../public/uploads/avatars';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Delete old avatar if exists
        $stmt = $this->db->prepare("SELECT avatar_url FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        if ($user && $user['avatar_url']) {
            $oldFile = __DIR__ . '/../../public' . $user['avatar_url'];
            if (file_exists($oldFile) && is_file($oldFile)) {
                unlink($oldFile);
            }
        }

        // Generate unique name
        $extension = pathinfo($avatar->getClientFilename(), PATHINFO_EXTENSION);
        $filename = uniqid('avatar_', true) . '.' . $extension;
        $relative_path = '/uploads/avatars/' . $filename;
        
        $avatar->moveTo($uploadDir . DIRECTORY_SEPARATOR . $filename);

        // Update DB
        $stmt = $this->db->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
        $stmt->execute([$relative_path, $userId]);

        $response->getBody()->write(json_encode([
            'message' => 'Avatar uploaded successfully',
            'avatar_url' => $relative_path
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
