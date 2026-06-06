<?php

<<<<<<< Updated upstream
use DI\ContainerBuilder;
=======
session_start();

>>>>>>> Stashed changes
use Slim\Factory\AppFactory;
use CampusTeamUp\Middleware\CorsMiddleware;
use Dotenv\Dotenv;

// Autoload dependencies
require __DIR__ . '/../vendor/autoload.php';

// Load env
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
}

// Create container
$containerBuilder = new ContainerBuilder();

// Add definitions
$containerBuilder->addDefinitions([
    PDO::class => function () {
        $dbSetup = require __DIR__ . '/../config/database.php';
        return $dbSetup();
    },
]);

$container = $containerBuilder->build();

// Create app
AppFactory::setContainer($container);
$app = AppFactory::create();

// Register settings (middleware / error handling)
$settings = require __DIR__ . '/../config/settings.php';
$settings($app);

// Add CORS middleware
$app->add(new CorsMiddleware());

// Register routes
$routes = require __DIR__ . '/../routes/routes.php';
$routes($app);

// Run app
$app->run();
