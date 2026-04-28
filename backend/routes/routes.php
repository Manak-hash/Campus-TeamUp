<?php

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use CampusTeamUp\Controllers\PingController;

return function (App $app) {
    // Health check endpoint
    $app->get('/api/ping', PingController::class);

    // API routes will be added here 
    $app->group('/api', function (RouteCollectorProxy $group) {
        // Future routes: /api/users /api/projects etc
    });
};
