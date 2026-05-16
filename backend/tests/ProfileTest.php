<?php

namespace CampusTeamUp\Tests;

class ProfileTest extends BaseTestCase
{
    public function testGetProfileReturnsAuthenticatedUserInfo(): void
    {
        // Setup: user 1 exists (from seed)
        $request = $this->createRequest('GET', '/api/profile', [
            'User-Id' => '1',
            'Accept' => 'application/json'
        ]);
        
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('test@example.com', $payload['email']);
        $this->assertEquals('Test User', $payload['name']);
    }

    public function testGetPublicProfileReturnsUserInfo(): void
    {
        $request = $this->createRequest('GET', '/api/users/1');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('Test User', $payload['name']);
        // Email should probably be public too for now, or hidden depending on privacy
        $this->assertEquals('test@example.com', $payload['email']);
    }

    public function testUpdateProfileUpdatesDatabase(): void
    {
        $updateData = [
            'name' => 'Updated Name',
            'bio' => 'New bio here',
            'department' => 'Computer Science',
            'academic_level' => 'Senior'
        ];

        $request = $this->createRequest('PUT', '/api/profile', [
            'User-Id' => '1',
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode($updateData));

        $response = $this->app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());

        // Verify in DB
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = 1");
        $stmt->execute();
        $user = $stmt->fetch();

        $this->assertEquals('Updated Name', $user['name']);
        $this->assertEquals('New bio here', $user['bio']);
        $this->assertEquals('Computer Science', $user['department']);
        $this->assertEquals('Senior', $user['academic_level']);
    }

    public function testGetProfileWithoutUserIdReturns401(): void
    {
        $request = $this->createRequest('GET', '/api/profile');
        $response = $this->app->handle($request);

        $this->assertEquals(401, $response->getStatusCode());
    }
}
