<?php

// Simple session for development
session_start();

use Slim\Factory\AppFactory;
use CampusTeamUp\Middleware\CorsMiddleware;
use Dotenv\Dotenv;

// Increase limits for file uploads
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '10M');
ini_set('max_execution_time', '300');
ini_set('max_input_time', '300');

// Autoload dependencies
require __DIR__ . '/../vendor/autoload.php';

// Load env
if (file_exists(__DIR__ . '/../.env')) {
    try {
        $dotenv = Dotenv::createMutable(__DIR__ . '/..');
        $dotenv->load();
    } catch (Exception $e) {
        error_log("Dotenv loading failed: " . $e->getMessage());
    }
}

// Create app
$app = AppFactory::create();

// Register settings (middleware / error handling)
$settings = require __DIR__ . '/../config/settings.php';
$settings($app);

// Add CORS middleware globally for all routes
$app->add(new CorsMiddleware());

// Register routes
$routes = require __DIR__ . '/../routes/routes.php';
$routes($app);

// Run app
$app->run();
