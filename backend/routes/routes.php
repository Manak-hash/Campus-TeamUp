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
    });
};
