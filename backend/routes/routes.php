<?php

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use CampusTeamUp\Controllers\PingController;
use CampusTeamUp\Controllers\UserController;
use CampusTeamUp\Controllers\ProjectController;

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
        $group->put('/profile/skills', [UserController::class, 'updateSkills'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());

        // Avatar route (protected)
        $group->post('/profile/avatar', [UserController::class, 'uploadAvatar'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());

        // Project routes
        $group->get('/projects', [ProjectController::class, 'index']);
        $group->get('/projects/{id}', [ProjectController::class, 'show']);
        $group->post('/projects', [ProjectController::class, 'create'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->put('/projects/{id}', [ProjectController::class, 'update'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->delete('/projects/{id}', [ProjectController::class, 'delete'])->add(new \CampusTeamUp\Middleware\AuthMiddleware());
    });

    // Health check endpoint
    $app->get('/api/ping', PingController::class);
};
