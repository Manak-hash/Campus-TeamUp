<?php

namespace CampusTeamUp\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PingController
{
    public function __invoke(Request $request, Response $response): Response
    {
        $data = [
            'status' => 'ok',
            'message' => 'Campus TeamUp API is running',
            'timestamp' => date('Y-m-d H:i:s')
        ];

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
