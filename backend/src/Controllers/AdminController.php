<?php

namespace CampusTeamUp\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class AdminController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = \CampusTeamUp\Models\Model::db();
    }

    public function getStats(Request $request, Response $response): Response
    {
        // 1. Total users
        $stmt = $this->db->query("SELECT COUNT(*) FROM users");
        $totalUsers = (int)$stmt->fetchColumn();

        // 2. Total projects
        $stmt = $this->db->query("SELECT COUNT(*) FROM projects");
        $totalProjects = (int)$stmt->fetchColumn();

        // 3. Total applications
        $stmt = $this->db->query("SELECT COUNT(*) FROM applications");
        $totalApplications = (int)$stmt->fetchColumn();

        // 4. Open projects
        $stmt = $this->db->query("SELECT COUNT(*) FROM projects WHERE status = 'open'");
        $openProjects = (int)$stmt->fetchColumn();

        // Recent users
        $stmt = $this->db->prepare("
            SELECT id, email, name, role, department, academic_level, bio, avatar_url, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $stmt->execute();
        $recentUsers = $stmt->fetchAll();
        foreach ($recentUsers as &$user) {
            $user['avatar_url'] = $this->formatAvatarUrl($request, $user['avatar_url'] ?? null);
        }

        // Recent projects
        $stmt = $this->db->prepare("
            SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar,
                   (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
            FROM projects p
            LEFT JOIN users u ON p.owner_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 5
        ");
        $stmt->execute();
        $recentProjects = $stmt->fetchAll();
        foreach ($recentProjects as &$project) {
            $project['owner_avatar'] = $this->formatAvatarUrl($request, $project['owner_avatar'] ?? null);
        }

        $stats = [
            'total_users' => $totalUsers,
            'total_projects' => $totalProjects,
            'total_applications' => $totalApplications,
            'open_projects' => $openProjects,
            'recent_users' => $recentUsers,
            'recent_projects' => $recentProjects,
        ];

        $response->getBody()->write(json_encode(['data' => $stats]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getUsers(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int)($params['page'] ?? 1);
        $limit = 10;
        $offset = ($page - 1) * $limit;

        $stmt = $this->db->query("SELECT COUNT(*) FROM users");
        $total = (int)$stmt->fetchColumn();

        $stmt = $this->db->prepare("
            SELECT id, email, name, role, department, academic_level, bio, avatar_url, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        $users = $stmt->fetchAll();

        foreach ($users as &$user) {
            $user['avatar_url'] = $this->formatAvatarUrl($request, $user['avatar_url'] ?? null);
        }

        $response->getBody()->write(json_encode([
            'data' => $users,
            'meta' => [
                'current_page' => $page,
                'last_page' => (int)ceil($total / $limit),
                'per_page' => $limit,
                'total' => $total,
            ]
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function updateUserRole(Request $request, Response $response, array $args): Response
    {
        $userId = (int)$args['id'];
        $currentUserId = $request->getAttribute('user')['id'];
        
        $data = $request->getParsedBody();
        $role = $data['role'] ?? null;

        if ($role !== 'student' && $role !== 'admin') {
            $response->getBody()->write(json_encode(['error' => 'Invalid role']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        // Forbid self-demotion
        if ($userId === (int)$currentUserId && $role !== 'admin') {
            $response->getBody()->write(json_encode(['error' => 'You cannot demote yourself from admin']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $stmt = $this->db->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            $response->getBody()->write(json_encode(['error' => 'User not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $stmt = $this->db->prepare("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$role, $userId]);

        $stmt = $this->db->prepare("SELECT id, email, name, role, department, academic_level, bio, avatar_url, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        $user['avatar_url'] = $this->formatAvatarUrl($request, $user['avatar_url'] ?? null);

        $response->getBody()->write(json_encode(['data' => $user]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function deleteUser(Request $request, Response $response, array $args): Response
    {
        $userId = (int)$args['id'];
        $currentUserId = $request->getAttribute('user')['id'];

        if ($userId === (int)$currentUserId) {
            $response->getBody()->write(json_encode(['error' => 'You cannot delete your own admin account']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $stmt = $this->db->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            $response->getBody()->write(json_encode(['error' => 'User not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        try {
            $this->db->beginTransaction();

            // Clear skills associated with user
            $this->db->prepare("DELETE FROM user_skills WHERE user_id = ?")->execute([$userId]);

            // Clear notifications
            $this->db->prepare("DELETE FROM notifications WHERE user_id = ?")->execute([$userId]);

            // Clear bookmarks
            $this->db->prepare("DELETE FROM bookmarks WHERE user_id = ?")->execute([$userId]);

            // Clean up projects they owned and all project associations (skills, members, applications, bookmarks)
            $projectsStmt = $this->db->prepare("SELECT id FROM projects WHERE owner_id = ?");
            $projectsStmt->execute([$userId]);
            $ownedProjects = $projectsStmt->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($ownedProjects)) {
                $inQuery = implode(',', array_fill(0, count($ownedProjects), '?'));
                
                $this->db->prepare("DELETE FROM project_skills WHERE project_id IN ($inQuery)")->execute($ownedProjects);
                $this->db->prepare("DELETE FROM project_members WHERE project_id IN ($inQuery)")->execute($ownedProjects);
                $this->db->prepare("DELETE FROM applications WHERE project_id IN ($inQuery)")->execute($ownedProjects);
                $this->db->prepare("DELETE FROM bookmarks WHERE project_id IN ($inQuery)")->execute($ownedProjects);
                $this->db->prepare("DELETE FROM projects WHERE owner_id = ?")->execute([$userId]);
            }

            // Remove memberships in projects owned by others
            $this->db->prepare("DELETE FROM project_members WHERE user_id = ?")->execute([$userId]);

            // Remove applications to projects owned by others
            $this->db->prepare("DELETE FROM applications WHERE applicant_id = ?")->execute([$userId]);

            // Finally delete the user
            $this->db->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);

            $this->db->commit();

            $response->getBody()->write(json_encode(['data' => null, 'message' => 'User deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Failed to delete user: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getProjects(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int)($params['page'] ?? 1);
        $limit = 10;
        $offset = ($page - 1) * $limit;

        $stmt = $this->db->query("SELECT COUNT(*) FROM projects");
        $total = (int)$stmt->fetchColumn();

        $sql = "SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar,
                       (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
                FROM projects p
                LEFT JOIN users u ON p.owner_id = u.id
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$limit, $offset]);
        $projects = $stmt->fetchAll();

        foreach ($projects as &$project) {
            $project['owner_avatar'] = $this->formatAvatarUrl($request, $project['owner_avatar'] ?? null);
        }

        $response->getBody()->write(json_encode([
            'data' => $projects,
            'meta' => [
                'current_page' => $page,
                'last_page' => (int)ceil($total / $limit),
                'per_page' => $limit,
                'total' => $total,
            ]
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function deleteProject(Request $request, Response $response, array $args): Response
    {
        $projectId = (int)$args['id'];

        $stmt = $this->db->prepare("SELECT id, title FROM projects WHERE id = ?");
        $stmt->execute([$projectId]);
        $project = $stmt->fetch();
        if (!$project) {
            $response->getBody()->write(json_encode(['error' => 'Project not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        try {
            $this->db->beginTransaction();

            // Create notifications for affected applicants
            $notifStmt = $this->db->prepare("
                INSERT INTO notifications (user_id, type, message, link)
                SELECT
                    applicant_id,
                    'project_deleted',
                    'Project \"' || ? || '\" you applied to has been deleted by an admin.',
                    '/explore'
                FROM applications
                WHERE project_id = ? AND status != 'cancelled'
            ");
            $notifStmt->execute([$project['title'], $projectId]);

            $this->db->prepare("DELETE FROM project_skills WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM project_members WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM applications WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM bookmarks WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM projects WHERE id = ?")->execute([$projectId]);

            $this->db->commit();

            $response->getBody()->write(json_encode(['data' => null, 'message' => 'Project deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Failed to delete project: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function formatAvatarUrl(Request $request, ?string $avatarUrl): ?string
    {
        if (!$avatarUrl) {
            return null;
        }
        if (strpos($avatarUrl, 'http://') === 0 || strpos($avatarUrl, 'https://') === 0) {
            return $avatarUrl;
        }
        $uri = $request->getUri();
        $baseUrl = $uri->getScheme() . '://' . $uri->getHost();
        $port = $uri->getPort();
        if ($port && (($uri->getScheme() === 'http' && $port !== 80) || ($uri->getScheme() === 'https' && $port !== 443))) {
            $baseUrl .= ':' . $port;
        }
        return $baseUrl . $avatarUrl;
    }
}
