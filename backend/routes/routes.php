<?php

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use CampusTeamUp\Controllers\PingController;
use CampusTeamUp\Controllers\UserController;

return function (App $app) {
    // Root route
    $app->get('/', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'message' => 'Campus TeamUp API is running',
            'api_base' => '/api'
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // Health check endpoint
    $app->get('/api/ping', PingController::class);

<<<<<<< Updated upstream
    $app->group('/api', function (RouteCollectorProxy $group) {
        // Profile routes
        $group->get('/profile', [UserController::class, 'getProfile']);
        $group->put('/profile', [UserController::class, 'updateProfile']);
        $group->get('/users/{id}', [UserController::class, 'getPublicProfile']);

        // Skills routes
        $group->get('/skills', [UserController::class, 'getSkills']);
        $group->put('/profile/skills', [UserController::class, 'updateSkills']);

        // Avatar route
        $group->post('/profile/avatar', [UserController::class, 'uploadAvatar']);
=======
    // API routes
    $app->group('/api', function (RouteCollectorProxy $group) {
        // Auth routes
        $group->post('/register', \CampusTeamUp\Controllers\AuthController::class . ':register');
        $group->post('/login', \CampusTeamUp\Controllers\AuthController::class . ':login');
        
        // Protected Auth routes
        $group->post('/logout', \CampusTeamUp\Controllers\AuthController::class . ':logout')->add(new \CampusTeamUp\Middleware\AuthMiddleware());
        $group->get('/me', \CampusTeamUp\Controllers\AuthController::class . ':me')->add(new \CampusTeamUp\Middleware\AuthMiddleware());

        // Future routes: /api/users /api/projects etc
>>>>>>> Stashed changes
    });
};
