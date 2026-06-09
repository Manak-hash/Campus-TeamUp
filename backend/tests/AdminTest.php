<?php

namespace CampusTeamUp\Tests;

class AdminTest extends BaseTestCase
{
    protected function seed(): void
    {
        // Add Admin (ID 1)
        $stmt = $this->pdo->prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([1, 'admin@example.com', password_hash('password', PASSWORD_DEFAULT), 'Admin User', 'admin']);

        // Add Student 1 (ID 2)
        $stmt = $this->pdo->prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([2, 'student@example.com', password_hash('password', PASSWORD_DEFAULT), 'Student User 1', 'student']);

        // Add Student 2 (ID 3)
        $stmt = $this->pdo->prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([3, 'student2@example.com', password_hash('password', PASSWORD_DEFAULT), 'Student User 2', 'student']);

        // Add Projects
        $stmt = $this->pdo->prepare("INSERT INTO projects (id, title, slug, description, category, owner_id, max_members, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([1, 'Project One', 'project-one', 'Description of project one', 'web-development', 2, 2, 'open']);
        $stmt->execute([2, 'Project Two', 'project-two', 'Description of project two', 'mobile-development', 3, 2, 'open']);

        // Add Memberships
        $stmt = $this->pdo->prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)");
        $stmt->execute([1, 2, 'owner']);
        $stmt->execute([2, 3, 'owner']);
        $stmt->execute([2, 2, 'member']);

        // Add Application
        $stmt = $this->pdo->prepare("INSERT INTO applications (project_id, applicant_id, message, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([1, 3, 'Apply message', 'pending']);
    }

    public function testGetStatsAsAdmin(): void
    {
        $this->loginAs(1); // admin
        $request = $this->createRequest('GET', '/api/admin/stats');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertArrayHasKey('data', $payload);
        
        $stats = $payload['data'];
        $this->assertEquals(3, $stats['total_users']);
        $this->assertEquals(2, $stats['total_projects']);
        $this->assertEquals(1, $stats['total_applications']);
        $this->assertEquals(2, $stats['open_projects']);
        
        $this->assertCount(3, $stats['recent_users']);
        $this->assertCount(2, $stats['recent_projects']);
    }

    public function testGetStatsAsStudentForbidden(): void
    {
        $this->loginAs(2); // student
        $request = $this->createRequest('GET', '/api/admin/stats');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(403, $response->getStatusCode());
        $this->assertEquals('Forbidden. Admin access required.', $payload['error']);
    }

    public function testGetUsersAsAdmin(): void
    {
        $this->loginAs(1); // admin
        $request = $this->createRequest('GET', '/api/admin/users?page=1');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertArrayHasKey('data', $payload);
        $this->assertArrayHasKey('meta', $payload);
        
        $this->assertCount(3, $payload['data']);
        $this->assertEquals(1, $payload['meta']['current_page']);
        $this->assertEquals(3, $payload['meta']['total']);
    }

    public function testUpdateUserRole(): void
    {
        $this->loginAs(1); // admin
        $request = $this->createRequest('PUT', '/api/admin/users/2/role', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['role' => 'admin']));
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('admin', $payload['data']['role']);

        // Verify in DB
        $stmt = $this->pdo->prepare("SELECT role FROM users WHERE id = 2");
        $stmt->execute();
        $this->assertEquals('admin', $stmt->fetchColumn());
    }

    public function testUpdateUserRoleSelfDemotionForbidden(): void
    {
        $this->loginAs(1); // admin demoting himself (1)
        $request = $this->createRequest('PUT', '/api/admin/users/1/role', [
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode(['role' => 'student']));
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('You cannot demote yourself from admin', $payload['error']);
    }

    public function testDeleteUser(): void
    {
        $this->loginAs(1); // admin
        $request = $this->createRequest('DELETE', '/api/admin/users/2');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('User deleted successfully', $payload['message']);

        // Verify User 2 is deleted
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM users WHERE id = 2");
        $stmt->execute();
        $this->assertEquals(0, $stmt->fetchColumn());

        // Verify project owned by User 2 is deleted
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM projects WHERE id = 1");
        $stmt->execute();
        $this->assertEquals(0, $stmt->fetchColumn());

        // Verify membership of User 2 in Project 2 is deleted
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM project_members WHERE project_id = 2 AND user_id = 2");
        $stmt->execute();
        $this->assertEquals(0, $stmt->fetchColumn());
    }

    public function testDeleteUserSelfForbidden(): void
    {
        $this->loginAs(1); // admin deleting himself
        $request = $this->createRequest('DELETE', '/api/admin/users/1');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('You cannot delete your own admin account', $payload['error']);
    }

    public function testGetProjectsAsAdmin(): void
    {
        $this->loginAs(1); // admin
        $request = $this->createRequest('GET', '/api/admin/projects?page=1');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertCount(2, $payload['data']);
        $this->assertEquals(2, $payload['meta']['total']);
    }

    public function testDeleteProject(): void
    {
        $this->loginAs(1); // admin
        $request = $this->createRequest('DELETE', '/api/admin/projects/1');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('Project deleted successfully', $payload['message']);

        // Verify project is deleted
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM projects WHERE id = 1");
        $stmt->execute();
        $this->assertEquals(0, $stmt->fetchColumn());
    }
}
