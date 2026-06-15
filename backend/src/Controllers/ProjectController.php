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

        $currentUserId = $_SESSION['user_id'] ?? null;
        $bookmarkedProjectIds = [];
        if ($currentUserId) {
            $bookmarkStmt = $this->db->prepare("SELECT project_id FROM bookmarks WHERE user_id = ?");
            $bookmarkStmt->execute([$currentUserId]);
            $bookmarkedProjectIds = array_map('intval', $bookmarkStmt->fetchAll(PDO::FETCH_COLUMN));
        }

        foreach ($projects as &$project) {
            $projectId = (int)$project['id'];
            $skillStmt = $this->db->prepare("
                SELECT s.id, s.name, ps.importance
                FROM skills s
                JOIN project_skills ps ON s.id = ps.skill_id
                WHERE ps.project_id = ?
            ");
            $skillStmt->execute([$projectId]);
            $project['skills'] = $skillStmt->fetchAll();
            $project['owner_avatar'] = $this->formatAvatarUrl($request, $project['owner_avatar'] ?? null);
            $project['skill_match_score'] = $this->calculateSkillMatchScore($projectId, $currentUserId);
            $project['is_bookmarked'] = in_array($projectId, $bookmarkedProjectIds, true);
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

    public function getMyOwned(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user')['id'];

        $stmt = $this->db->prepare("
            SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar,
                   (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
                   (SELECT COUNT(*) FROM applications WHERE project_id = p.id AND status = 'pending') as pending_applicant_count
            FROM projects p
            LEFT JOIN users u ON p.owner_id = u.id
            WHERE p.owner_id = ?
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$userId]);
        $projects = $stmt->fetchAll();

        $bookmarkedProjectIds = [];
        $bookmarkStmt = $this->db->prepare("SELECT project_id FROM bookmarks WHERE user_id = ?");
        $bookmarkStmt->execute([$userId]);
        $bookmarkedProjectIds = array_map('intval', $bookmarkStmt->fetchAll(PDO::FETCH_COLUMN));

        foreach ($projects as &$project) {
            $projectId = (int)$project['id'];
            $skillStmt = $this->db->prepare("
                SELECT s.id, s.name, ps.importance
                FROM skills s
                JOIN project_skills ps ON s.id = ps.skill_id
                WHERE ps.project_id = ?
            ");
            $skillStmt->execute([$projectId]);
            $project['skills'] = $skillStmt->fetchAll();
            $project['owner_avatar'] = $this->formatAvatarUrl($request, $project['owner_avatar'] ?? null);
            $project['skill_match_score'] = $this->calculateSkillMatchScore($projectId, $userId);
            $project['is_bookmarked'] = in_array($projectId, $bookmarkedProjectIds, true);
        }

        $response->getBody()->write(json_encode(['projects' => $projects]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getMyTeams(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user')['id'];

        $stmt = $this->db->prepare("
            SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar,
                   (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
                   pm.role as user_role
            FROM projects p
            LEFT JOIN users u ON p.owner_id = u.id
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = ? AND pm.role != 'owner'
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$userId]);
        $projects = $stmt->fetchAll();

        $bookmarkedProjectIds = [];
        $bookmarkStmt = $this->db->prepare("SELECT project_id FROM bookmarks WHERE user_id = ?");
        $bookmarkStmt->execute([$userId]);
        $bookmarkedProjectIds = array_map('intval', $bookmarkStmt->fetchAll(PDO::FETCH_COLUMN));

        foreach ($projects as &$project) {
            $projectId = (int)$project['id'];
            $skillStmt = $this->db->prepare("
                SELECT s.id, s.name, ps.importance
                FROM skills s
                JOIN project_skills ps ON s.id = ps.skill_id
                WHERE ps.project_id = ?
            ");
            $skillStmt->execute([$projectId]);
            $project['skills'] = $skillStmt->fetchAll();
            $project['owner_avatar'] = $this->formatAvatarUrl($request, $project['owner_avatar'] ?? null);
            $project['skill_match_score'] = $this->calculateSkillMatchScore($projectId, $userId);
            $project['is_bookmarked'] = in_array($projectId, $bookmarkedProjectIds, true);
        }

        $response->getBody()->write(json_encode(['projects' => $projects]));
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

        // Count pending applications for dashboard badge
        $pendingStmt = $this->db->prepare("SELECT COUNT(*) FROM applications WHERE project_id = ? AND status = 'pending'");
        $pendingStmt->execute([$projectId]);
        $project['pending_applicant_count'] = (int)$pendingStmt->fetchColumn();

        // Calculate skill match score
        $project['skill_match_score'] = $this->calculateSkillMatchScore($projectId, $currentUserId);

        // Check if bookmarked
        $project['is_bookmarked'] = false;
        if ($currentUserId) {
            $bookmarkStmt = $this->db->prepare("SELECT COUNT(*) FROM bookmarks WHERE project_id = ? AND user_id = ?");
            $bookmarkStmt->execute([$projectId, $currentUserId]);
            $project['is_bookmarked'] = (int)$bookmarkStmt->fetchColumn() > 0;
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
        $idOrSlug = $args['id'];
        $data = $request->getParsedBody();

        // Find project by ID or slug
        if (is_numeric($idOrSlug)) {
            $project = Project::findById((int)$idOrSlug);
        } else {
            $project = Project::findBySlug($idOrSlug);
        }

        if (!$project) {
            $response->getBody()->write(json_encode(['error' => 'Project not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $projectId = (int)$project['id'];

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
        $idOrSlug = $args['id'];

        // Find project by ID or slug
        if (is_numeric($idOrSlug)) {
            $project = Project::findById((int)$idOrSlug);
        } else {
            $project = Project::findBySlug($idOrSlug);
        }

        if (!$project) {
            $response->getBody()->write(json_encode(['error' => 'Project not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $projectId = (int)$project['id'];

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

    private function calculateSkillMatchScore(int $projectId, ?int $userId): ?int
    {
        if (!$userId) {
            return null;
        }

        // Get required skills for this project
        $stmt = $this->db->prepare("SELECT skill_id FROM project_skills WHERE project_id = ? AND importance = 'required'");
        $stmt->execute([$projectId]);
        $requiredSkills = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($requiredSkills)) {
            return null;
        }

        // Get user's skills
        $stmt = $this->db->prepare("SELECT skill_id FROM user_skills WHERE user_id = ?");
        $stmt->execute([$userId]);
        $userSkills = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($userSkills)) {
            return 0;
        }

        // Calculate matching skills
        $matchingSkills = array_intersect($requiredSkills, $userSkills);
        $score = (int)round((count($matchingSkills) / count($requiredSkills)) * 100);

        return $score;
    }
}