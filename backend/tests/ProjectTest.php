<?php

namespace CampusTeamUp\Tests;

class ProjectTest extends BaseTestCase
{
    protected function seed(): void
    {
        parent::seed();
        
        // Seed another user for applicant
        $stmt = $this->pdo->prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([2, 'applicant@example.com', password_hash('password', PASSWORD_DEFAULT), 'Applicant User', 'student']);
        
        // Seed a project owned by user 1
        $stmt = $this->pdo->prepare("INSERT INTO projects (id, title, slug, description, category, owner_id, max_members, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([1, 'Project One', 'project-one', 'Description of project one', 'web-development', 1, 2, 'open']);

        // Add owner to members
        $stmt = $this->pdo->prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)");
        $stmt->execute([1, 1, 'owner']);
    }

    public function testGetProjects(): void
    {
        $request = $this->createRequest('GET', '/api/projects');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertArrayHasKey('projects', $payload);
        $this->assertCount(1, $payload['projects']);
        $this->assertEquals('Project One', $payload['projects'][0]['title']);
    }

    public function testGetProjectBySlug(): void
    {
        $request = $this->createRequest('GET', '/api/projects/project-one');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('Project One', $payload['title']);
        $this->assertArrayHasKey('members', $payload);
        $this->assertCount(1, $payload['members']);
        $this->assertEquals('Test User', $payload['members'][0]['name']);
    }

    public function testApplyToProjectSuccess(): void
    {
        $this->loginAs(2); // Login as applicant
        $request = $this->createRequest('POST', '/api/projects/1/apply', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['message' => 'I want to join!']));

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertEquals('Application submitted successfully', $payload['message']);

        // Verify in DB
        $stmt = $this->pdo->prepare("SELECT * FROM applications WHERE project_id = 1 AND applicant_id = 2");
        $stmt->execute();
        $app = $stmt->fetch();
        $this->assertNotFalse($app);
        $this->assertEquals('pending', $app['status']);
        $this->assertEquals('I want to join!', $app['message']);
    }

    public function testApplyToOwnProjectReturns400(): void
    {
        $this->loginAs(1); // Login as owner
        $request = $this->createRequest('POST', '/api/projects/1/apply', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['message' => 'Try to apply to myself']));

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('You cannot apply to your own project', $payload['error']);
    }

    public function testGetApplicationsOnlyForOwner(): void
    {
        // Setup: user 2 applies
        $stmt = $this->pdo->prepare("INSERT INTO applications (project_id, applicant_id, message, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([1, 2, 'Message text', 'pending']);

        // Case 1: Non-owner gets 403
        $this->loginAs(2);
        $request1 = $this->createRequest('GET', '/api/projects/1/applications');
        $response1 = $this->app->handle($request1);
        $this->assertEquals(403, $response1->getStatusCode());

        // Case 2: Owner gets list
        $this->loginAs(1);
        $request2 = $this->createRequest('GET', '/api/projects/1/applications');
        $response2 = $this->app->handle($request2);
        $payload2 = json_decode((string) $response2->getBody(), true);

        $this->assertEquals(200, $response2->getStatusCode());
        $this->assertCount(1, $payload2);
        $this->assertEquals('Applicant User', $payload2[0]['applicant_name']);
    }

    public function testReviewApplicationAccepts(): void
    {
        // Setup: user 2 applies
        $stmt = $this->pdo->prepare("INSERT INTO applications (id, project_id, applicant_id, message, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([10, 1, 2, 'Message text', 'pending']);

        $this->loginAs(1); // Owner
        $request = $this->createRequest('PUT', '/api/applications/10', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['status' => 'accepted']));

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());

        // Verify application status updated to accepted
        $stmt = $this->pdo->prepare("SELECT status FROM applications WHERE id = 10");
        $stmt->execute();
        $this->assertEquals('accepted', $stmt->fetchColumn());

        // Verify added to project members
        $stmt = $this->pdo->prepare("SELECT role FROM project_members WHERE project_id = 1 AND user_id = 2");
        $stmt->execute();
        $this->assertEquals('member', $stmt->fetchColumn());

        // Verify project is now full (capacity was 2, now has 1 owner + 1 member = 2)
        $stmt = $this->pdo->prepare("SELECT status FROM projects WHERE id = 1");
        $stmt->execute();
        $this->assertEquals('full', $stmt->fetchColumn());
    }
}
