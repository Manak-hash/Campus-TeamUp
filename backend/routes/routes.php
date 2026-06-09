<?php

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use CampusTeamUp\Controllers\PingController;
use CampusTeamUp\Controllers\UserController;
use CampusTeamUp\Controllers\ProjectController;
use CampusTeamUp\Controllers\ApplicationController;
use CampusTeamUp\Controllers\NotificationController;
use CampusTeamUp\Controllers\AdminController;

return function (App $app) {
    // API routes
    $app->group('/api', function (RouteCollectorProxy $group) {
        // Auth routes
        $group->post('/register', \CampusTeamUp\Controllers\AuthController::class . ':register');
        $group->post('/login', \CampusTeamUp\Controllers\AuthController::class . ':login');

        // Protected Auth routes
        $group->post('/logout', \CampusTeamUp\Controllers\AuthController::class . ':logout')->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->get('/me', \CampusTeamUp\Controllers\AuthController::class . ':me')->add(new \CampusTeamUp\Middleware\AuthMiddleware());

        // Profile routes (protected)
        $group->get('/profile', [UserController::class, 'getProfile'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->put('/profile', [UserController::class, 'updateProfile'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->get('/users/{id}', [UserController::class, 'getPublicProfile']);

        // Skills routes (protected)
        $group->get('/skills', [UserController::class, 'getSkills']);
        $group->post('/skills', [UserController::class, 'createSkill'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->put('/profile/skills', [UserController::class, 'updateSkills'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());

        // Avatar route (protected)
        $group->post('/profile/avatar', [UserController::class, 'uploadAvatar'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());

        // Project routes
        $group->get('/projects', [ProjectController::class, 'index']);
        $group->get('/projects/my-owned', [ProjectController::class, 'getMyOwned'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->get('/projects/my-teams', [ProjectController::class, 'getMyTeams'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->get('/projects/{id}', [ProjectController::class, 'show']);
        $group->post('/projects', [ProjectController::class, 'create'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->put('/projects/{id}', [ProjectController::class, 'update'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->delete('/projects/{id}', [ProjectController::class, 'delete'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());

        // Application routes
        $group->post('/projects/{id}/apply', [ApplicationController::class, 'apply'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->get('/projects/{id}/applications', [ApplicationController::class, 'getApplications'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->get('/applications/mine', [ApplicationController::class, 'mine'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->put('/applications/{id}/status', [ApplicationController::class, 'reviewApplication'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->delete('/applications/{id}', [ApplicationController::class, 'cancel'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());

        // Notification routes (protected) — order matters: /read-all before /{id}/read
        $group->get('/notifications', [NotificationController::class, 'index'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->put('/notifications/read-all', [NotificationController::class, 'markAllRead'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->put('/notifications/{id}/read', [NotificationController::class, 'markRead'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());

        // Admin routes (admin-only) — all protected by AdminMiddleware
        $group->get('/admin/users', [AdminController::class, 'getUsers'])->add(new \CampusTeamUp\Middleware\AdminMiddleware());
        $group->put('/admin/users/{id}/role', [AdminController::class, 'updateUserRole'])->add(new \CampusTeamUp\Middleware\AdminMiddleware());
        $group->delete('/admin/users/{id}', [AdminController::class, 'deleteUser'])->add(new \CampusTeamUp\Middleware\AdminMiddleware());
        $group->get('/admin/projects', [AdminController::class, 'getProjects'])->add(new \CampusTeamUp\Middleware\AdminMiddleware());
        $group->delete('/admin/projects/{id}', [AdminController::class, 'deleteProject'])->add(new \CampusTeamUp\Middleware\AdminMiddleware());
        $group->get('/admin/stats', [AdminController::class, 'getStats'])->add(new \CampusTeamUp\Middleware\AdminMiddleware());
    });

    // Health check endpoint
    $app->get('/api/ping', PingController::class);
};
