<?php

namespace CampusTeamUp\Tests;

class PingTest extends BaseTestCase
{
    public function testPingEndpointReturnsOk(): void
    {
        $request = $this->createRequest('GET', '/api/ping');
        $response = $this->app->handle($request);

        $payload = (string) $response->getBody();
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('Campus TeamUp API is running', $payload);
    }
}
