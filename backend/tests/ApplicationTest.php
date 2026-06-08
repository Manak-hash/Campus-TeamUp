<?php

namespace CampusTeamUp\Tests;

class ApplicationTest extends BaseTestCase
{
    protected function seed(): void
    {
        parent::seed();

        // Users:
        // 1: test@example.com (student, seeded by parent)
        // 2: owner@example.com (student, project owner)
        // 3: applicant1@example.com (student, applicant)
        // 4: applicant2@example.com (student, applicant)
        
        $stmt = $this->pdo->prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([2, 'owner@example.com', password_hash('password', PASSWORD_DEFAULT), 'Owner User', 'student']);
        $stmt->execute([3, 'applicant1@example.com', password_hash('password', PASSWORD_DEFAULT), 'Applicant 1', 'student']);
        $stmt->execute([4, 'applicant2@example.com', password_hash('password', PASSWORD_DEFAULT), 'Applicant 2', 'student']);

        // Seed a project owned by user 2, max members 2, status open
        $stmt = $this->pdo->prepare("INSERT INTO projects (id, title, slug, description, category, owner_id, max_members, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([10, 'Test Project', 'test-project', 'Description of project', 'web-development', 2, 2, 'open']);

        // Add owner to members (so 1 slot is taken)
        $stmt = $this->pdo->prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)");
        $stmt->execute([10, 2, 'owner']);
    }

    public function testApplySuccess(): void
    {
        $this->loginAs(3); // Login as applicant 1
        $request = $this->createRequest('POST', '/api/projects/10/apply', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['message' => 'Hello, I want to join.']));

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertEquals('Application submitted successfully', $payload['message']);

        // Verify DB
        $stmt = $this->pdo->prepare("SELECT * FROM applications WHERE project_id = 10 AND applicant_id = 3");
        $stmt->execute();
        $app = $stmt->fetch();
        $this->assertNotFalse($app);
        $this->assertEquals('pending', $app['status']);
        $this->assertEquals('Hello, I want to join.', $app['message']);
    }

    public function testApplyCannotApplyToOwnProject(): void
    {
        $this->loginAs(2); // Login as owner
        $request = $this->createRequest('POST', '/api/projects/10/apply', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['message' => 'Apply to myself']));

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('You cannot apply to your own project', $payload['error']);
    }

    public function testApplyCannotApplyTwice(): void
    {
        $this->loginAs(3); // Login as applicant 1
        // Insert application manually
        $stmt = $this->pdo->prepare("INSERT INTO applications (project_id, applicant_id, message, status) VALUES (?, ?, ?, 'pending')");
        $stmt->execute([10, 3, 'First try']);

        $request = $this->createRequest('POST', '/api/projects/10/apply', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['message' => 'Second try']));

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('You have already applied to this project', $payload['error']);
    }

    public function testApplyCannotApplyIfFullOrClosed(): void
    {
        // 1. Test closed project
        $stmt = $this->pdo->prepare("UPDATE projects SET status = 'closed' WHERE id = 10");
        $stmt->execute();

        $this->loginAs(3);
        $request = $this->createRequest('POST', '/api/projects/10/apply', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['message' => 'Apply to closed']));
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('This project is not open for applications', $payload['error']);

        // 2. Test full project
        $stmt = $this->pdo->prepare("UPDATE projects SET status = 'full' WHERE id = 10");
        $stmt->execute();

        $response2 = $this->app->handle($request);
        $payload2 = json_decode((string) $response2->getBody(), true);

        $this->assertEquals(400, $response2->getStatusCode());
        $this->assertEquals('This project is not open for applications', $payload2['error']);
    }

    public function testReviewApplicationAcceptanceAndFullTrigger(): void
    {
        // Setup: user 3 applied
        $stmt = $this->pdo->prepare("INSERT INTO applications (id, project_id, applicant_id, message, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([100, 10, 3, 'My message', 'pending']);

        $this->loginAs(2); // Owner
        $request = $this->createRequest('PUT', '/api/applications/100/status', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['status' => 'accepted']));

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('Application reviewed successfully', $payload['message']);

        // Check DB application status
        $stmt = $this->pdo->prepare("SELECT status FROM applications WHERE id = 100");
        $stmt->execute();
        $this->assertEquals('accepted', $stmt->fetchColumn());

        // Check user 3 added to members
        $stmt = $this->pdo->prepare("SELECT role FROM project_members WHERE project_id = 10 AND user_id = 3");
        $stmt->execute();
        $this->assertEquals('member', $stmt->fetchColumn());

        // Check notification created for user 3
        $stmt = $this->pdo->prepare("SELECT * FROM notifications WHERE user_id = 3");
        $stmt->execute();
        $notif = $stmt->fetch();
        $this->assertNotFalse($notif);
        $this->assertEquals('application', $notif['type']);
        $this->assertStringContainsString('accepted', $notif['message']);
        $this->assertEquals('/projects/test-project', $notif['link']);

        // Check project status updated to full (max_members was 2, now has owner + user 3 = 2 members)
        $stmt = $this->pdo->prepare("SELECT status FROM projects WHERE id = 10");
        $stmt->execute();
        $this->assertEquals('full', $stmt->fetchColumn());
    }

    public function testReviewApplicationRejection(): void
    {
        // Setup: user 3 applied
        $stmt = $this->pdo->prepare("INSERT INTO applications (id, project_id, applicant_id, message, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([101, 10, 3, 'My message', 'pending']);

        $this->loginAs(2); // Owner
        $request = $this->createRequest('PUT', '/api/applications/101/status', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['status' => 'rejected']));

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());

        // Check DB application status
        $stmt = $this->pdo->prepare("SELECT status FROM applications WHERE id = 101");
        $stmt->execute();
        $this->assertEquals('rejected', $stmt->fetchColumn());

        // Check user 3 NOT added to members
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM project_members WHERE project_id = 10 AND user_id = 3");
        $stmt->execute();
        $this->assertEquals(0, $stmt->fetchColumn());

        // Check notification created for user 3
        $stmt = $this->pdo->prepare("SELECT * FROM notifications WHERE user_id = 3");
        $stmt->execute();
        $notif = $stmt->fetch();
        $this->assertNotFalse($notif);
        $this->assertStringContainsString('rejected', $notif['message']);
    }

    public function testReviewApplicationForbiddenForNonOwner(): void
    {
        $stmt = $this->pdo->prepare("INSERT INTO applications (id, project_id, applicant_id, message, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([102, 10, 3, 'My message', 'pending']);

        $this->loginAs(4); // Non-owner
        $request = $this->createRequest('PUT', '/api/applications/102/status', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['status' => 'accepted']));

        $response = $this->app->handle($request);
        $this->assertEquals(403, $response->getStatusCode());
    }

    public function testCancelApplication(): void
    {
        $stmt = $this->pdo->prepare("INSERT INTO applications (id, project_id, applicant_id, message, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([103, 10, 3, 'Pending application', 'pending']);
        $stmt->execute([104, 10, 4, 'Accepted application', 'accepted']);

        // 1. Cancel own pending application (success)
        $this->loginAs(3);
        $request = $this->createRequest('DELETE', '/api/applications/103');
        $response = $this->app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());

        // Verify deleted from DB
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM applications WHERE id = 103");
        $stmt->execute();
        $this->assertEquals(0, $stmt->fetchColumn());

        // 2. Cancel non-owned application (403)
        $this->loginAs(3);
        $request = $this->createRequest('DELETE', '/api/applications/104');
        $response = $this->app->handle($request);
        $this->assertEquals(403, $response->getStatusCode());

        // 3. Cancel non-pending own application (400)
        $this->loginAs(4);
        $request = $this->createRequest('DELETE', '/api/applications/104');
        $response = $this->app->handle($request);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testGetApplicationsMine(): void
    {
        $stmt = $this->pdo->prepare("INSERT INTO applications (id, project_id, applicant_id, message, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([105, 10, 3, 'My application', 'pending']);

        $this->loginAs(3);
        $request = $this->createRequest('GET', '/api/applications/mine');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertCount(1, $payload);
        $this->assertEquals('Test Project', $payload[0]['project_title']);
        $this->assertEquals('test-project', $payload[0]['project_slug']);
        $this->assertEquals('My application', $payload[0]['message']);
    }
}
