<?php

namespace CampusTeamUp\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class NotificationController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = \CampusTeamUp\Models\Model::db();
    }

    /**
     * GET /api/notifications
     * Returns all notifications for the authenticated user, newest first.
     */
    public function index(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user')['id'];

        $stmt = $this->db->prepare("
            SELECT id, type, message, link, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        $notifications = $stmt->fetchAll();

        foreach ($notifications as &$n) {
            $n['is_read'] = (bool)$n['is_read'];
        }

        $response->getBody()->write(json_encode($notifications));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/notifications/unread-count
     * Returns the count of unread notifications (for navbar badge).
     */
    public function unreadCount(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user')['id'];

        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0
        ");
        $stmt->execute([$userId]);
        $count = (int)$stmt->fetchColumn();

        $response->getBody()->write(json_encode(['count' => $count]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/notifications/:id/read
     * Mark a single notification as read.
     */
    public function markRead(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user')['id'];
        $notificationId = (int)$args['id'];

        // Only mark as read if belongs to the user
        $stmt = $this->db->prepare("
            UPDATE notifications SET is_read = 1
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$notificationId, $userId]);

        if ($stmt->rowCount() === 0) {
            $response->getBody()->write(json_encode(['error' => 'Notification not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode(['message' => 'Notification marked as read']));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/notifications/read-all
     * Mark all notifications as read for the authenticated user.
     */
    public function markAllRead(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user')['id'];

        $stmt = $this->db->prepare("
            UPDATE notifications SET is_read = 1
            WHERE user_id = ? AND is_read = 0
        ");
        $stmt->execute([$userId]);

        $response->getBody()->write(json_encode([
            'message' => 'All notifications marked as read',
            'updated' => $stmt->rowCount()
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
