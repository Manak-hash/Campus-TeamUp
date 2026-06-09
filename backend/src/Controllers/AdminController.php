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

    /**
     * GET /api/admin/users
     * Returns paginated list of all users with role, created_at, project count
     */
    public function getUsers(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 10);
        $offset = ($page - 1) * $limit;

        // Get total count
        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM users");
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        // Get users with project counts
        $stmt = $this->db->prepare("
            SELECT
                u.id,
                u.email,
                u.name,
                u.role,
                u.department,
                u.academic_level,
                u.created_at,
                u.avatar_url,
                (SELECT COUNT(*) FROM projects WHERE owner_id = u.id) as owned_projects_count,
                (SELECT COUNT(*) FROM project_members WHERE user_id = u.id) as teams_count
            FROM users u
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        $users = $stmt->fetchAll();

        // Format avatar URLs
        foreach ($users as &$user) {
            $user['avatar_url'] = $user['avatar_url'] ?
                $this->formatAvatarUrl($request, $user['avatar_url']) : null;
        }

        $response->getBody()->write(json_encode([
            'users' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => (int)ceil($total / $limit)
            ]
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/admin/users/:id/role
     * Promote or demote user role (student ↔ admin)
     */
    public function updateUserRole(Request $request, Response $response, array $args): Response
    {
        $userId = (int)$args['id'];
        $data = $request->getParsedBody();
        $newRole = $data['role'] ?? null;

        if (!$newRole || !in_array($newRole, ['student', 'admin'])) {
            $response->getBody()->write(json_encode(['error' => 'Invalid role. Must be "student" or "admin".']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        // Prevent admin from demoting themselves
        $currentUserId = $request->getAttribute('user')['id'];
        if ($userId === $currentUserId) {
            $response->getBody()->write(json_encode(['error' => 'Cannot change your own role.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        // Check if user exists
        $checkStmt = $this->db->prepare("SELECT id, role FROM users WHERE id = ?");
        $checkStmt->execute([$userId]);
        $user = $checkStmt->fetch();

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'User not found.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        // Update role
        $stmt = $this->db->prepare("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$newRole, $userId]);

        $response->getBody()->write(json_encode([
            'message' => 'User role updated successfully',
            'user_id' => $userId,
            'old_role' => $user['role'],
            'new_role' => $newRole
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/admin/users/:id
     * Delete user account and all related data
     */
    public function deleteUser(Request $request, Response $response, array $args): Response
    {
        $userId = (int)$args['id'];
        $currentUserId = $request->getAttribute('user')['id'];

        // Prevent admin from deleting themselves
        if ($userId === $currentUserId) {
            $response->getBody()->write(json_encode(['error' => 'Cannot delete your own account.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        // Check if user exists
        $checkStmt = $this->db->prepare("SELECT id, name FROM users WHERE id = ?");
        $checkStmt->execute([$userId]);
        $user = $checkStmt->fetch();

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'User not found.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        try {
            $this->db->beginTransaction();

            // Delete related data (cascade will handle most, but let's be explicit)
            // User skills
            $this->db->prepare("DELETE FROM user_skills WHERE user_id = ?")->execute([$userId]);

            // Project memberships
            $this->db->prepare("DELETE FROM project_members WHERE user_id = ?")->execute([$userId]);

            // Applications
            $this->db->prepare("DELETE FROM applications WHERE applicant_id = ?")->execute([$userId]);

            // Bookmarks
            $this->db->prepare("DELETE FROM bookmarks WHERE user_id = ?")->execute([$userId]);

            // Notifications
            $this->db->prepare("DELETE FROM notifications WHERE user_id = ?")->execute([$userId]);

            // Delete user's projects (and their related data)
            $userProjects = $this->db->prepare("SELECT id FROM projects WHERE owner_id = ?");
            $userProjects->execute([$userId]);
            $projectIds = $userProjects->fetchAll(PDO::FETCH_COLUMN);

            foreach ($projectIds as $projectId) {
                // Delete project related data
                $this->db->prepare("DELETE FROM project_skills WHERE project_id = ?")->execute([$projectId]);
                $this->db->prepare("DELETE FROM project_members WHERE project_id = ?")->execute([$projectId]);
                $this->db->prepare("DELETE FROM applications WHERE project_id = ?")->execute([$projectId]);
                $this->db->prepare("DELETE FROM bookmarks WHERE project_id = ?")->execute([$projectId]);

                // Delete the project
                $this->db->prepare("DELETE FROM projects WHERE id = ?")->execute([$projectId]);
            }

            // Finally delete the user
            $this->db->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);

            $this->db->commit();

            $response->getBody()->write(json_encode([
                'message' => 'User and all related data deleted successfully',
                'deleted_user_id' => $userId,
                'deleted_user_name' => $user['name']
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Failed to delete user: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    /**
     * GET /api/admin/projects
     * Returns paginated list of all projects with owner info and status
     */
    public function getProjects(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 10);
        $offset = ($page - 1) * $limit;

        // Get total count
        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM projects");
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        // Get projects with owner info
        $stmt = $this->db->prepare("
            SELECT
                p.id,
                p.title,
                p.slug,
                p.category,
                p.status,
                p.max_members,
                p.created_at,
                p.deadline,
                o.id as owner_id,
                o.name as owner_name,
                o.email as owner_email,
                (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
                (SELECT COUNT(*) FROM applications WHERE project_id = p.id AND status = 'pending') as pending_applications
            FROM projects p
            LEFT JOIN users o ON p.owner_id = o.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        $projects = $stmt->fetchAll();

        $response->getBody()->write(json_encode([
            'projects' => $projects,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => (int)ceil($total / $limit)
            ]
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/admin/projects/:id
     * Remove project and all associated applications/members
     */
    public function deleteProject(Request $request, Response $response, array $args): Response
    {
        $projectId = (int)$args['id'];

        // Check if project exists
        $checkStmt = $this->db->prepare("SELECT id, title FROM projects WHERE id = ?");
        $checkStmt->execute([$projectId]);
        $project = $checkStmt->fetch();

        if (!$project) {
            $response->getBody()->write(json_encode(['error' => 'Project not found.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        try {
            $this->db->beginTransaction();

            // Delete project related data
            $this->db->prepare("DELETE FROM project_skills WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM project_members WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM applications WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM bookmarks WHERE project_id = ?")->execute([$projectId]);

            // Create notifications for affected applicants
            $notifStmt = $this->db->prepare("
                INSERT INTO notifications (user_id, type, message, link)
                SELECT
                    applicant_id,
                    'project_deleted',
                    'Project "' . $project['title'] . '" you applied to has been deleted by an admin.',
                    '/explore'
                FROM applications
                WHERE project_id = ? AND status != 'cancelled'
            ");
            $notifStmt->execute([$projectId]);

            // Delete the project
            $this->db->prepare("DELETE FROM projects WHERE id = ?")->execute([$projectId]);

            $this->db->commit();

            $response->getBody()->write(json_encode([
                'message' => 'Project and all associated data deleted successfully',
                'deleted_project_id' => $projectId,
                'deleted_project_title' => $project['title']
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Failed to delete project: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    /**
     * GET /api/admin/stats
     * Returns platform statistics
     */
    public function getStats(Request $request, Response $response): Response
    {
        // Total users
        $usersStmt = $this->db->prepare("SELECT COUNT(*) FROM users");
        $usersStmt->execute();
        $totalUsers = (int)$usersStmt->fetchColumn();

        // Total projects
        $projectsStmt = $this->db->prepare("SELECT COUNT(*) FROM projects");
        $projectsStmt->execute();
        $totalProjects = (int)$projectsStmt->fetchColumn();

        // Total applications
        $applicationsStmt = $this->db->prepare("SELECT COUNT(*) FROM applications");
        $applicationsStmt->execute();
        $totalApplications = (int)$applicationsStmt->fetchColumn();

        // Open projects count
        $openProjectsStmt = $this->db->prepare("SELECT COUNT(*) FROM projects WHERE status = 'open'");
        $openProjectsStmt->execute();
        $openProjects = (int)$openProjectsStmt->fetchColumn();

        // Additional useful stats
        $pendingApplicationsStmt = $this->db->prepare("SELECT COUNT(*) FROM applications WHERE status = 'pending'");
        $pendingApplicationsStmt->execute();
        $pendingApplications = (int)$pendingApplicationsStmt->fetchColumn();

        $acceptedApplicationsStmt = $this->db->prepare("SELECT COUNT(*) FROM applications WHERE status = 'accepted'");
        $acceptedApplicationsStmt->execute();
        $acceptedApplications = (int)$acceptedApplicationsStmt->fetchColumn();

        $totalAdminsStmt = $this->db->prepare("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        $totalAdminsStmt->execute();
        $totalAdmins = (int)$totalAdminsStmt->fetchColumn();

        $response->getBody()->write(json_encode([
            'total_users' => $totalUsers,
            'total_admins' => $totalAdmins,
            'total_projects' => $totalProjects,
            'open_projects' => $openProjects,
            'total_applications' => $totalApplications,
            'pending_applications' => $pendingApplications,
            'accepted_applications' => $acceptedApplications,
            'projects_per_user' => $totalUsers > 0 ? round($totalProjects / $totalUsers, 2) : 0,
            'applications_per_project' => $totalProjects > 0 ? round($totalApplications / $totalProjects, 2) : 0
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Helper method to format avatar URLs
     */
    private function formatAvatarUrl(Request $request, ?string $avatarUrl): ?string
    {
        if (!$avatarUrl) {
            return null;
        }

        // If it's already a full URL, return as is
        if (filter_var($avatarUrl, FILTER_VALIDATE_URL)) {
            return $avatarUrl;
        }

        // Otherwise, construct the full URL
        $scheme = $request->getUri()->getScheme();
        $host = $request->getUri()->getHost();
        $port = $request->getUri()->getPort();

        $baseUrl = $scheme . '://' . $host;
        if ($port && ($port !== 80 && $port !== 443)) {
            $baseUrl .= ':' . $port;
        }

        return $baseUrl . $avatarUrl;
    }
}