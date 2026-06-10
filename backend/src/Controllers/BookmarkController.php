<?php

namespace CampusTeamUp\Controllers;

use CampusTeamUp\Models\Project;
use CampusTeamUp\Models\Bookmark;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class BookmarkController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = \CampusTeamUp\Models\Model::db();
    }

    /**
     * POST /api/projects/{id}/bookmark
     * Save a project (auth required, ignore duplicate)
     */
    public function bookmark(Request $request, Response $response, array $args): Response
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

        // Check if duplicate
        $stmt = $this->db->prepare("SELECT id FROM bookmarks WHERE user_id = ? AND project_id = ?");
        $stmt->execute([$userId, $projectId]);
        $exists = $stmt->fetch();

        if ($exists) {
            // Ignore duplicate, return 200 success
            $response->getBody()->write(json_encode(['message' => 'Project bookmarked successfully']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }

        // Create bookmark
        $stmt = $this->db->prepare("INSERT INTO bookmarks (user_id, project_id) VALUES (?, ?)");
        $stmt->execute([$userId, $projectId]);

        $response->getBody()->write(json_encode(['message' => 'Project bookmarked successfully']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    /**
     * DELETE /api/projects/{id}/bookmark
     * Unsave a project (auth required)
     */
    public function unbookmark(Request $request, Response $response, array $args): Response
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

        // Delete bookmark
        $stmt = $this->db->prepare("DELETE FROM bookmarks WHERE user_id = ? AND project_id = ?");
        $stmt->execute([$userId, $projectId]);

        $response->getBody()->write(json_encode(['message' => 'Project unsaved successfully']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    /**
     * GET /api/bookmarks
     * Return all bookmarked projects for authenticated user with full project info
     */
    public function index(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user')['id'];

        $stmt = $this->db->prepare("
            SELECT b.id as bookmark_id, b.user_id, b.project_id, b.created_at as bookmarked_at,
                   p.*, u.name as owner_name, u.avatar_url as owner_avatar,
                   (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
            FROM bookmarks b
            JOIN projects p ON b.project_id = p.id
            LEFT JOIN users u ON p.owner_id = u.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        $bookmarks = [];
        foreach ($rows as $row) {
            $projectId = (int)$row['project_id'];

            // Fetch skills for each project
            $skillStmt = $this->db->prepare("
                SELECT s.id, s.name, ps.importance
                FROM skills s
                JOIN project_skills ps ON s.id = ps.skill_id
                WHERE ps.project_id = ?
            ");
            $skillStmt->execute([$projectId]);
            $skills = $skillStmt->fetchAll();

            $project = [
                'id' => $projectId,
                'title' => $row['title'],
                'slug' => $row['slug'],
                'description' => $row['description'],
                'category' => $row['category'],
                'owner_id' => (int)$row['owner_id'],
                'max_members' => (int)$row['max_members'],
                'deadline' => $row['deadline'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'member_count' => (int)$row['member_count'],
                'owner_name' => $row['owner_name'],
                'owner_avatar' => $this->formatAvatarUrl($request, $row['owner_avatar']),
                'skills' => $skills,
                'skill_match_score' => $this->calculateSkillMatchScore($projectId, $userId),
                'is_bookmarked' => true
            ];

            $bookmarks[] = [
                'id' => (int)$row['bookmark_id'],
                'user_id' => (int)$row['user_id'],
                'project_id' => $projectId,
                'created_at' => $row['bookmarked_at'],
                'project' => $project
            ];
        }

        $response->getBody()->write(json_encode(['data' => $bookmarks]));
        return $response->withHeader('Content-Type', 'application/json');
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

        $stmt = $this->db->prepare("SELECT skill_id FROM project_skills WHERE project_id = ? AND importance = 'required'");
        $stmt->execute([$projectId]);
        $requiredSkills = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($requiredSkills)) {
            return null;
        }

        $stmt = $this->db->prepare("SELECT skill_id FROM user_skills WHERE user_id = ?");
        $stmt->execute([$userId]);
        $userSkills = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($userSkills)) {
            return 0;
        }

        $matchingSkills = array_intersect($requiredSkills, $userSkills);
        $score = (int)round((count($matchingSkills) / count($requiredSkills)) * 100);

        return $score;
    }
}
