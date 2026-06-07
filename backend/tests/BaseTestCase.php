<?php

namespace CampusTeamUp\Tests;

use PHPUnit\Framework\TestCase;
use PDO;
use DI\ContainerBuilder;
use Slim\App;
use Slim\Factory\AppFactory;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Psr7\Factory\RequestFactory;

class BaseTestCase extends TestCase
{
    protected ?PDO $pdo = null;
    protected ?App $app = null;

    protected function setUp(): void
    {
        parent::setUp();

        // Clear session
        $_SESSION = [];

        // Initialize in-memory database
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        // Run migrations
        $schema = file_get_contents(__DIR__ . '/../database/schema.sql');
        $this->pdo->exec($schema);

        // Seed basic data if needed
        $this->seed();

        // Create container
        $containerBuilder = new ContainerBuilder();
        $containerBuilder->addDefinitions([
            PDO::class => $this->pdo,
        ]);
        $container = $containerBuilder->build();

        // Initialize Slim App
        AppFactory::setContainer($container);
        $this->app = AppFactory::create();
        
        // Add body parsing middleware
        $this->app->addBodyParsingMiddleware();
        
        // Register routes
        $routes = require __DIR__ . '/../routes/routes.php';
        $routes($this->app);
    }

    protected function loginAs(int $userId): void
    {
        $_SESSION['user_id'] = $userId;
    }

    protected function seed(): void
    {
        // Add a test user with explicit ID 1
        $stmt = $this->pdo->prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([1, 'test@example.com', password_hash('password', PASSWORD_DEFAULT), 'Test User', 'student']);
    }

    protected function createRequest(
        string $method,
        string $path,
        array $headers = ['HTTP_ACCEPT' => 'application/json'],
        array $cookies = [],
        array $serverParams = []
    ): Request {
        $uri = "http://localhost$path";
        $handle = new RequestFactory();
        $request = $handle->createRequest($method, $uri);

        foreach ($headers as $name => $value) {
            $request = $request->withHeader($name, $value);
        }

        return $request;
    }
}
