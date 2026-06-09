<?php

namespace CampusTeamUp\Controllers;

use CampusTeamUp\Models\Project;
use CampusTeamUp\Models\Application;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class ApplicationController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = \CampusTeamUp\Models\Model::db();
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

            // Notify the project owner that someone applied
            $applicantStmt = $this->db->prepare("SELECT name FROM users WHERE id = ?");
            $applicantStmt->execute([$userId]);
            $applicantName = $applicantStmt->fetchColumn();

            $ownerNotifMsg = $applicantName . " applied to join your project \"" . $project['title'] . "\".";
            $ownerNotifStmt = $this->db->prepare("
                INSERT INTO notifications (user_id, type, message, link, is_read)
                VALUES (?, 'application_received', ?, ?, 0)
            ");
            $ownerNotifStmt->execute([$project['owner_id'], $ownerNotifMsg, '/projects/' . $project['slug']]);

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
        $stmt = $this->db->prepare("
            SELECT a.*, p.title as project_title, p.slug as project_slug, p.owner_id, p.max_members, p.status as project_status 
            FROM applications a 
            JOIN projects p ON a.project_id = p.id 
            WHERE a.id = ?
        ");
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

            // Create notification for applicant about decision
            $notifType = $status === 'accepted' ? 'application_accepted' : 'application_rejected';
            $notificationMsg = "Your application for the project \"" . $app['project_title'] . "\" has been " . $status . ".";
            $notifStmt = $this->db->prepare("
                INSERT INTO notifications (user_id, type, message, link, is_read) 
                VALUES (?, ?, ?, ?, 0)
            ");
            $notifLink = '/projects/' . $app['project_slug'];
            $notifStmt->execute([$app['applicant_id'], $notifType, $notificationMsg, $notifLink]);

            $this->db->commit();

            $response->getBody()->write(json_encode(['message' => 'Application reviewed successfully']));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Failed to review application: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function cancel(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user')['id'];
        $applicationId = (int)$args['id'];

        $stmt = $this->db->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$applicationId]);
        $app = $stmt->fetch();

        if (!$app) {
            $response->getBody()->write(json_encode(['error' => 'Application not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        if ($app['applicant_id'] != $userId) {
            $response->getBody()->write(json_encode(['error' => 'Forbidden - you can only cancel your own applications']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        if ($app['status'] !== 'pending') {
            $response->getBody()->write(json_encode(['error' => 'Only pending applications can be cancelled']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $deleteStmt = $this->db->prepare("DELETE FROM applications WHERE id = ?");
            $deleteStmt->execute([$applicationId]);

            $response->getBody()->write(json_encode(['message' => 'Application cancelled successfully']));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'Failed to cancel application: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function mine(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user')['id'];
        $params = $request->getQueryParams();
        $statusFilter = $params['status'] ?? null;

        $sql = "
            SELECT a.id, a.message, a.status, a.created_at, a.updated_at, a.project_id,
                   p.title as project_title, p.slug as project_slug, p.category as project_category, p.status as current_status,
                   u.name as owner_name
            FROM applications a
            JOIN projects p ON a.project_id = p.id
            JOIN users u ON p.owner_id = u.id
            WHERE a.applicant_id = ?
        ";
        $queryParams = [$userId];

        if ($statusFilter) {
            $sql .= " AND a.status = ?";
            $queryParams[] = $statusFilter;
        }

        $sql .= " ORDER BY a.created_at DESC, a.id DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($queryParams);
        $applications = $stmt->fetchAll();

        foreach ($applications as &$app) {
            $app['project'] = [
                'id' => (int)$app['project_id'],
                'title' => $app['project_title'],
                'slug' => $app['project_slug'],
                'category' => $app['project_category'],
                'current_status' => $app['current_status'],
                'owner_name' => $app['owner_name']
            ];
            
            // Retain flat mappings for backwards compatibility in frontend
            $app['project_title'] = $app['project_title'];
            $app['project_slug'] = $app['project_slug'];
            $app['project_category'] = $app['project_category'];
            $app['project_status'] = $app['current_status'];
        }

        $response->getBody()->write(json_encode($applications));
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
}
