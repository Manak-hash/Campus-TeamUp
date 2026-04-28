<?php

use Slim\Factory\AppFactory;
use CampusTeamUp\Middleware\CorsMiddleware;
use Dotenv\Dotenv;

// Autoload dependencies
require __DIR__ . '/../vendor/autoload.php';

// Load env
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
            $_SERVER[trim($name)] = trim($value);
        }
    }
}

// Create app
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
