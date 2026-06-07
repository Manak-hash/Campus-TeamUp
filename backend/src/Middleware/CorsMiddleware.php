<?php

namespace CampusTeamUp\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;

class CorsMiddleware
{
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        // Get the origin from the request
        $origin = $request->getHeaderLine('Origin');

        // Allow all origins in development
        $allowedOrigin = $origin ?: '*';

        // Handle OPTIONS preflight requests
        if ($request->getMethod() === 'OPTIONS') {
            $response = new SlimResponse();

            // Set all CORS headers for preflight
            $response = $response
                ->withHeader('Access-Control-Allow-Origin', $allowedOrigin)
                ->withHeader('Access-Control-Allow-Credentials', 'true')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
                ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Id')
                ->withHeader('Access-Control-Max-Age', '86400');

            return $response->withStatus(204);
        }

        // Process the request through the middleware chain
        $response = $handler->handle($request);

        // Add CORS headers to all responses
        return $response
            ->withHeader('Access-Control-Allow-Origin', $allowedOrigin)
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Id')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    }
}
