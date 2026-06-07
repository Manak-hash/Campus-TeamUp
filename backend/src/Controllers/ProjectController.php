<?php

namespace CampusTeamUp\Controllers;

use CampusTeamUp\Models\Project;
use CampusTeamUp\Helpers\Validator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class ProjectController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = \CampusTeamUp\Models\Model::db();
    }

    public function index(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 10);
        $offset = ($page - 1) * $limit;

        $whereConditions = ["1=1"];
        $queryParams = [];

        if (!empty($params['category'])) {
            $whereConditions[] = "category = ?";
            $queryParams[] = $params['category'];
        }

        if (!empty($params['status'])) {
            $whereConditions[] = "status = ?";
            $queryParams[] = $params['status'];
        }

        if (!empty($params['search'])) {
            $whereConditions[] = "(title LIKE ? OR description LIKE ?)";
            $searchTerm = "%{$params['search']}%";
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
        }

        if (!empty($params['skill'])) {
            $whereConditions[] = "id IN (SELECT project_id FROM project_skills WHERE skill_id = ?)";
            $queryParams[] = (int)$params['skill'];
        }

        $whereClause = implode(" AND ", $whereConditions);

        $countSql = "SELECT COUNT(*) FROM projects WHERE $whereClause";
        $stmt = $this->db->prepare($countSql);
        $stmt->execute($queryParams);
        $total = (int)$stmt->fetchColumn();

        $sql = "SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar,
                (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
                FROM projects p
                LEFT JOIN users u ON p.owner_id = u.id
                WHERE $whereClause
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([...$queryParams, $limit, $offset]);
        $projects = $stmt->fetchAll();

        foreach ($projects as &$project) {
            $skillStmt = $this->db->prepare("
                SELECT s.id, s.name, ps.importance
                FROM skills s
                JOIN project_skills ps ON s.id = ps.skill_id
                WHERE ps.project_id = ?
            ");
            $skillStmt->execute([$project['id']]);
            $project['skills'] = $skillStmt->fetchAll();
            $project['owner_avatar'] = $this->formatAvatarUrl($request, $project['owner_avatar'] ?? null);
        }

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

    public function show(Request $request, Response $response, array $args): Response
    {
        $idOrSlug = $args['id'];

        if (is_numeric($idOrSlug)) {
            $project = Project::findWithDetails((int)$idOrSlug);
        } else {
            $project = Project::findWithDetailsBySlug($idOrSlug);
        }

        if (!$project) {
            $response->getBody()->write(json_encode(['error' => 'Project not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $projectId = (int)$project['id'];
        $project['owner_avatar'] = $this->formatAvatarUrl($request, $project['owner_avatar'] ?? null);

        $skillStmt = $this->db->prepare("
            SELECT s.id, s.name, ps.importance
            FROM skills s
            JOIN project_skills ps ON s.id = ps.skill_id
            WHERE ps.project_id = ?
        ");
        $skillStmt->execute([$projectId]);
        $project['skills'] = $skillStmt->fetchAll();

        $memberStmt = $this->db->prepare("
            SELECT u.id, u.name, u.email, u.avatar_url as member_avatar, pm.role, pm.joined_at
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = ?
            ORDER BY pm.joined_at ASC
        ");
        $memberStmt->execute([$projectId]);
        $members = $memberStmt->fetchAll();

        foreach ($members as &$member) {
            $member['member_avatar'] = $this->formatAvatarUrl($request, $member['member_avatar']);
            
            // Fetch skills for this member
            $skillsStmt = $this->db->prepare("
                SELECT s.id, s.name, us.proficiency_level
                FROM skills s
                JOIN user_skills us ON s.id = us.skill_id
                WHERE us.user_id = ?
            ");
            $skillsStmt->execute([$member['id']]);
            $member['skills'] = $skillsStmt->fetchAll();
        }
        $project['members'] = $members;

        // Check if current user has an application
        $currentUserId = $_SESSION['user_id'] ?? null;
        $project['user_application_status'] = null;
        if ($currentUserId) {
            $appStmt = $this->db->prepare("SELECT status FROM applications WHERE project_id = ? AND applicant_id = ?");
            $appStmt->execute([$projectId, $currentUserId]);
            $status = $appStmt->fetchColumn();
            if ($status) {
                $project['user_application_status'] = $status;
            }
        }

        $response->getBody()->write(json_encode($project));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function create(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user')['id'];
        $data = $request->getParsedBody();

        $required = ['title', 'description', 'category', 'max_members'];
        $missing = Validator::required($required, $data);
        if (!empty($missing)) {
            $response->getBody()->write(json_encode(['error' => 'Missing required fields', 'fields' => $missing]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        if (!Validator::minLength($data['title'], 5)) {
            $response->getBody()->write(json_encode(['error' => 'Title must be at least 5 characters']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        if ($data['max_members'] < 2 || $data['max_members'] > 10) {
            $response->getBody()->write(json_encode(['error' => 'Max members must be between 2 and 10']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $slug = $this->generateSlug($data['title']);

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO projects (title, slug, description, category, owner_id, max_members, deadline, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
            ");
            $stmt->execute([
                $data['title'],
                $slug,
                $data['description'],
                $data['category'],
                $userId,
                (int)$data['max_members'],
                $data['deadline'] ?? null
            ]);

            $projectId = (int)$this->db->lastInsertId();

            if (!empty($data['skills'])) {
                $skillStmt = $this->db->prepare("
                    INSERT INTO project_skills (project_id, skill_id, importance)
                    VALUES (?, ?, ?)
                ");
                foreach ($data['skills'] as $skill) {
                    $skillStmt->execute([
                        $projectId,
                        (int)$skill['skill_id'],
                        $skill['importance'] ?? 'required'
                    ]);
                }
            }

            $memberStmt = $this->db->prepare("
                INSERT INTO project_members (project_id, user_id, role)
                VALUES (?, ?, 'owner')
            ");
            $memberStmt->execute([$projectId, $userId]);

            $this->db->commit();

            $project = Project::findWithDetails($projectId);
            $response->getBody()->write(json_encode(['message' => 'Project created successfully', 'project' => $project]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);

        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Failed to create project: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user')['id'];
        $userRole = $request->getAttribute('user')['role'];
        $projectId = (int)$args['id'];
        $data = $request->getParsedBody();

        $project = Project::findById($projectId);
        if (!$project) {
            $response->getBody()->write(json_encode(['error' => 'Project not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        if ($project['owner_id'] != $userId && $userRole !== 'admin') {
            $response->getBody()->write(json_encode(['error' => 'Forbidden - only project owner can update']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        try {
            $this->db->beginTransaction();

            $updateData = [];
            $params = [];

            if (isset($data['title'])) {
                $updateData[] = "title = ?";
                $params[] = $data['title'];
            }
            if (isset($data['description'])) {
                $updateData[] = "description = ?";
                $params[] = $data['description'];
            }
            if (isset($data['category'])) {
                $updateData[] = "category = ?";
                $params[] = $data['category'];
            }
            if (isset($data['max_members'])) {
                $updateData[] = "max_members = ?";
                $params[] = (int)$data['max_members'];
            }
            if (isset($data['deadline'])) {
                $updateData[] = "deadline = ?";
                $params[] = $data['deadline'];
            }
            if (isset($data['status'])) {
                $updateData[] = "status = ?";
                $params[] = $data['status'];
            }

            if (!empty($updateData)) {
                $updateData[] = "updated_at = CURRENT_TIMESTAMP";
                $sql = "UPDATE projects SET " . implode(", ", $updateData) . " WHERE id = ?";
                $params[] = $projectId;
                $stmt = $this->db->prepare($sql);
                $stmt->execute($params);
            }

            if (isset($data['skills'])) {
                $this->db->prepare("DELETE FROM project_skills WHERE project_id = ?")->execute([$projectId]);

                $skillStmt = $this->db->prepare("
                    INSERT INTO project_skills (project_id, skill_id, importance)
                    VALUES (?, ?, ?)
                ");
                foreach ($data['skills'] as $skill) {
                    $skillStmt->execute([
                        $projectId,
                        (int)$skill['skill_id'],
                        $skill['importance'] ?? 'required'
                    ]);
                }
            }

            $this->db->commit();

            $updatedProject = Project::findWithDetails($projectId);
            $response->getBody()->write(json_encode(['message' => 'Project updated successfully', 'project' => $updatedProject]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Failed to update project: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user')['id'];
        $userRole = $request->getAttribute('user')['role'];
        $projectId = (int)$args['id'];

        $project = Project::findById($projectId);
        if (!$project) {
            $response->getBody()->write(json_encode(['error' => 'Project not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        if ($project['owner_id'] != $userId && $userRole !== 'admin') {
            $response->getBody()->write(json_encode(['error' => 'Forbidden - only project owner or admin can delete']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        try {
            $this->db->beginTransaction();

            $this->db->prepare("DELETE FROM project_skills WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM project_members WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM applications WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM bookmarks WHERE project_id = ?")->execute([$projectId]);
            $this->db->prepare("DELETE FROM projects WHERE id = ?")->execute([$projectId]);

            $this->db->commit();

            $response->getBody()->write(json_encode(['message' => 'Project deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Failed to delete project: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function apply(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user')['id'];
        $idOrSlug = $args['id'];

        if (is_numeric($idOrSlug)) {
            $project = Project::findWithDetails((int)$idOrSlug);
        } else {
            $project = Project::findWithDetailsBySlug($idOrSlug);
        }

        if (!$project) {
            $response->getBody()->write(json_encode(['error' => 'Project not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $projectId = (int)$project['id'];

        if ($project['owner_id'] == $userId) {
            $response->getBody()->write(json_encode(['error' => 'You cannot apply to your own project']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        if ($project['status'] !== 'open') {
            $response->getBody()->write(json_encode(['error' => 'This project is not open for applications']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $data = $request->getParsedBody();
        $message = trim($data['message'] ?? '');

        try {
            $stmt = $this->db->prepare("INSERT INTO applications (project_id, applicant_id, message, status) VALUES (?, ?, ?, 'pending')");
            $stmt->execute([$projectId, $userId, $message]);

            $response->getBody()->write(json_encode(['message' => 'Application submitted successfully']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\PDOException $e) {
            if ($e->getCode() == '23000' || strpos($e->getMessage(), 'UNIQUE constraint failed') !== false) {
                $response->getBody()->write(json_encode(['error' => 'You have already applied to this project']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }
            $response->getBody()->write(json_encode(['error' => 'Failed to apply: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getApplications(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user')['id'];
        $idOrSlug = $args['id'];

        if (is_numeric($idOrSlug)) {
            $project = Project::findById((int)$idOrSlug);
        } else {
            $project = Project::findBySlug($idOrSlug);
        }

        if (!$project) {
            $response->getBody()->write(json_encode(['error' => 'Project not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        if ($project['owner_id'] != $userId) {
            $response->getBody()->write(json_encode(['error' => 'Forbidden - only the project owner can view applications']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        $stmt = $this->db->prepare("
            SELECT a.id, a.message, a.status, a.created_at, u.id as user_id, u.name as applicant_name, u.email as applicant_email, u.avatar_url as applicant_avatar
            FROM applications a
            JOIN users u ON a.applicant_id = u.id
            WHERE a.project_id = ?
            ORDER BY a.created_at DESC
        ");
        $stmt->execute([$project['id']]);
        $applications = $stmt->fetchAll();

        foreach ($applications as &$app) {
            $app['applicant_avatar'] = $this->formatAvatarUrl($request, $app['applicant_avatar']);
            
            // Fetch skills of the applicant
            $skillsStmt = $this->db->prepare("
                SELECT s.id, s.name, us.proficiency_level
                FROM skills s
                JOIN user_skills us ON s.id = us.skill_id
                WHERE us.user_id = ?
            ");
            $skillsStmt->execute([$app['user_id']]);
            $app['skills'] = $skillsStmt->fetchAll();
        }

        $response->getBody()->write(json_encode($applications));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function reviewApplication(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user')['id'];
        $applicationId = (int)$args['id'];

        // Get application details
        $stmt = $this->db->prepare("SELECT a.*, p.owner_id, p.max_members, p.status as project_status FROM applications a JOIN projects p ON a.project_id = p.id WHERE a.id = ?");
        $stmt->execute([$applicationId]);
        $app = $stmt->fetch();

        if (!$app) {
            $response->getBody()->write(json_encode(['error' => 'Application not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        if ($app['owner_id'] != $userId) {
            $response->getBody()->write(json_encode(['error' => 'Forbidden - only the project owner can review applications']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        $data = $request->getParsedBody();
        $status = $data['status'] ?? ''; // 'accepted' or 'rejected'

        if (!in_array($status, ['accepted', 'rejected'])) {
            $response->getBody()->write(json_encode(['error' => 'Invalid status. Must be accepted or rejected']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $this->db->beginTransaction();

            // Update application status
            $updateStmt = $this->db->prepare("UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $updateStmt->execute([$status, $applicationId]);

            if ($status === 'accepted') {
                // Check current members count
                $countStmt = $this->db->prepare("SELECT COUNT(*) FROM project_members WHERE project_id = ?");
                $countStmt->execute([$app['project_id']]);
                $currentMembersCount = (int)$countStmt->fetchColumn();

                if ($currentMembersCount >= $app['max_members']) {
                    $this->db->rollBack();
                    $response->getBody()->write(json_encode(['error' => 'This project is already full']));
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
                }

                // Add to project members
                $memberStmt = $this->db->prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'member')");
                $memberStmt->execute([$app['project_id'], $app['applicant_id']]);

                // Update project status if full now
                Project::updateStatusIfFull($app['project_id']);
            }

            $this->db->commit();

            $response->getBody()->write(json_encode(['message' => 'Application reviewed successfully']));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Failed to review application: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function generateSlug(string $title): string
    {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title), '-'));
        $originalSlug = $slug;
        $counter = 1;

        while (Project::findBySlug($slug)) {
            $slug = $originalSlug . '-' . $counter++;
        }

        return $slug;
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