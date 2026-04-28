<?php

namespace CampusTeamUp\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class CorsMiddleware
{
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        // Handle OPTIONS preflight requests early
        if ($request->getMethod() === 'OPTIONS') {
            $response = $handler->getResponse();
            return $response
                ->withStatus(204)
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                ->withHeader('Access-Control-Max-Age', '86400');
        }

        // Get allowed origins from env separated by comma
        $allowedOrigins = explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? '');
        $allowedOrigins = array_map('trim', $allowedOrigins);

        // Get the request origin
        $requestOrigin = $request->getHeaderLine('Origin');

        // Process the request
        $response = $handler->handle($request);

        // Check if the request origin is in our allowed list
        if (in_array($requestOrigin, $allowedOrigins)) {
            $response = $response->withHeader('Access-Control-Allow-Origin', $requestOrigin);
        }

        return $response
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
}
