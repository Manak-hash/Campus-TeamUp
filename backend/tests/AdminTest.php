<?php

namespace CampusTeamUp\Tests;

use CampusTeamUp\Tests\BaseTestCase;

class AdminTest extends BaseTestCase
{
    public function testAdminRequiresAdminRole()
    {
        // Login as regular student user
        $this->loginAs(2); // Assuming user ID 2 is a student

        $response = $this->get('/api/admin/users');
        $this->assertEquals(403, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('error', $data);
        $this->assertStringContainsString('Admin access required', $data['error']);
    }

    public function testAdminCanAccessEndpoints()
    {
        // Login as admin user (user ID 1)
        $this->loginAs(1);

        // Test stats endpoint
        $response = $this->get('/api/admin/stats');
        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('total_users', $data);
        $this->assertArrayHasKey('total_projects', $data);
        $this->assertArrayHasKey('total_applications', $data);
        $this->assertArrayHasKey('open_projects', $data);
    }

    public function testGetUsersPaginated()
    {
        $this->loginAs(1);

        $response = $this->get('/api/admin/users?page=1&limit=10');
        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('users', $data);
        $this->assertArrayHasKey('pagination', $data);
        $this->assertArrayHasKey('total', $data['pagination']);
        $this->assertArrayHasKey('page', $data['pagination']);
        $this->assertArrayHasKey('limit', $data['pagination']);

        // Check that each user has required fields
        foreach ($data['users'] as $user) {
            $this->assertArrayHasKey('id', $user);
            $this->assertArrayHasKey('email', $user);
            $this->assertArrayHasKey('name', $user);
            $this->assertArrayHasKey('role', $user);
            $this->assertArrayHasKey('created_at', $user);
            $this->assertArrayHasKey('owned_projects_count', $user);
            $this->assertArrayHasKey('teams_count', $user);
        }
    }

    public function testGetProjectsPaginated()
    {
        $this->loginAs(1);

        $response = $this->get('/api/admin/projects?page=1&limit=10');
        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('projects', $data);
        $this->assertArrayHasKey('pagination', $data);

        // Check that each project has required fields
        foreach ($data['projects'] as $project) {
            $this->assertArrayHasKey('id', $project);
            $this->assertArrayHasKey('title', $project);
            $this->assertArrayHasKey('owner_name', $project);
            $this->assertArrayHasKey('status', $project);
            $this->assertArrayHasKey('member_count', $project);
            $this->assertArrayHasKey('pending_applications', $project);
        }
    }

    public function testUpdateUserRole()
    {
        $this->loginAs(1);

        // First, get a user to update (user ID 3)
        $response = $this->get('/api/admin/users');
        $data = json_decode($response->getBody(), true);
        $targetUserId = null;

        foreach ($data['users'] as $user) {
            if ($user['id'] != 1) { // Not the admin themselves
                $targetUserId = $user['id'];
                break;
            }
        }

        $this->assertNotNull($targetUserId, 'No suitable user found for role update test');

        // Promote user to admin
        $response = $this->put('/api/admin/users/' . $targetUserId . '/role', [
            'role' => 'admin'
        ]);
        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('message', $data);
        $this->assertEquals('admin', $data['new_role']);

        // Demote back to student
        $response = $this->put('/api/admin/users/' . $targetUserId . '/role', [
            'role' => 'student'
        ]);
        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertEquals('student', $data['new_role']);
    }

    public function testCannotUpdateOwnRole()
    {
        $this->loginAs(1);

        $response = $this->put('/api/admin/users/1/role', [
            'role' => 'student'
        ]);

        $this->assertEquals(400, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('error', $data);
        $this->assertStringContainsString('own role', $data['error']);
    }

    public function testInvalidRoleRejected()
    {
        $this->loginAs(1);

        $response = $this->put('/api/admin/users/2/role', [
            'role' => 'superadmin'
        ]);

        $this->assertEquals(400, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('error', $data);
    }

    public function testDeleteUser()
    {
        $this->loginAs(1);

        // Create a test user to delete
        $registerResponse = $this->post('/api/register', [
            'email' => 'testuser' . time() . '@test.com',
            'password' => 'password123',
            'name' => 'Test User',
            'department' => 'Computer Science',
            'academic_level' => 'Junior'
        ]);

        $this->assertEquals(201, $registerResponse->getStatusCode());

        // Get the user ID from the register response
        $userData = json_decode($registerResponse->getBody(), true);
        $userId = $userData['user']['id'];

        // Now delete this user
        $response = $this->delete('/api/admin/users/' . $userId);
        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('message', $data);
        $this->assertStringContainsString('deleted successfully', $data['message']);

        // Verify user is actually deleted
        $getResponse = $this->get('/api/admin/users');
        $getData = json_decode($getResponse->getBody(), true);

        $found = false;
        foreach ($getData['users'] as $user) {
            if ($user['id'] === $userId) {
                $found = true;
                break;
            }
        }
        $this->assertFalse($found, 'User should have been deleted');
    }

    public function testCannotDeleteSelf()
    {
        $this->loginAs(1);

        $response = $this->delete('/api/admin/users/1');
        $this->assertEquals(400, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('error', $data);
        $this->assertStringContainsString('own account', $data['error']);
    }

    public function testDeleteProject()
    {
        $this->loginAs(1);

        // Create a test project
        $createResponse = $this->post('/api/projects', [
            'title' => 'Test Project for Deletion ' . time(),
            'description' => 'This project will be deleted by admin',
            'category' => 'web-development',
            'max_members' => 5
        ]);

        $this->assertEquals(201, $createResponse->getStatusCode());

        $projectData = json_decode($createResponse->getBody(), true);
        $projectId = $projectData['project']['id'];

        // Delete the project as admin
        $response = $this->delete('/api/admin/projects/' . $projectId);
        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('message', $data);
        $this->assertStringContainsString('deleted successfully', $data['message']);

        // Verify project is actually deleted
        $getResponse = $this->get('/api/admin/projects');
        $getData = json_decode($getResponse->getBody(), true);

        $found = false;
        foreach ($getData['projects'] as $project) {
            if ($project['id'] === $projectId) {
                $found = true;
                break;
            }
        }
        $this->assertFalse($found, 'Project should have been deleted');
    }

    public function testStatsEndpoint()
    {
        $this->loginAs(1);

        $response = $this->get('/api/admin/stats');
        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getBody(), true);

        // Check all required stats are present
        $this->assertArrayHasKey('total_users', $data);
        $this->assertArrayHasKey('total_admins', $data);
        $this->assertArrayHasKey('total_projects', $data);
        $this->assertArrayHasKey('open_projects', $data);
        $this->assertArrayHasKey('total_applications', $data);
        $this->assertArrayHasKey('pending_applications', $data);
        $this->assertArrayHasKey('accepted_applications', $data);

        // Verify data types
        $this->assertIsInt($data['total_users']);
        $this->assertIsInt($data['total_admins']);
        $this->assertIsInt($data['total_projects']);
        $this->assertIsInt($data['open_projects']);
        $this->assertIsInt($data['total_applications']);

        // Verify logical constraints
        $this->assertGreaterThanOrEqual(0, $data['total_users']);
        $this->assertGreaterThanOrEqual(1, $data['total_admins']); // At least one admin (us)
        $this->assertLessThanOrEqual($data['total_users'], $data['total_admins']); // Admins <= total users
        $this->assertLessThanOrEqual($data['total_projects'], $data['open_projects']); // Open <= total
    }
}