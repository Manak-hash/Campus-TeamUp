<?php

namespace CampusTeamUp\Tests;

use PDO;

class BookmarkTest extends BaseTestCase
{
    protected function seed(): void
    {
        parent::seed();

        // Seed second user
        $stmt = $this->pdo->prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([2, 'student2@example.com', password_hash('password', PASSWORD_DEFAULT), 'Student Two', 'student']);

        // Seed projects
        $stmt = $this->pdo->prepare("INSERT INTO projects (id, title, slug, description, category, owner_id, max_members, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([1, 'Project One', 'project-one', 'Description of project one', 'web-development', 1, 2, 'open']);
        $stmt->execute([2, 'Project Two', 'project-two', 'Description of project two', 'design', 2, 2, 'open']);
    }

    public function testBookmarkProjectSuccess(): void
    {
        $this->loginAs(1);

        // Bookmark Project 2
        $request = $this->createRequest('POST', '/api/projects/2/bookmark');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertEquals('Project bookmarked successfully', $payload['message']);

        // Verify database entry
        $stmt = $this->pdo->prepare("SELECT * FROM bookmarks WHERE user_id = 1 AND project_id = 2");
        $stmt->execute();
        $this->assertNotFalse($stmt->fetch());
    }

    public function testBookmarkDuplicateIgnored(): void
    {
        $this->loginAs(1);

        // Save once
        $this->pdo->prepare("INSERT INTO bookmarks (user_id, project_id) VALUES (1, 2)")->execute();

        // Attempt duplicate save
        $request = $this->createRequest('POST', '/api/projects/2/bookmark');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('Project bookmarked successfully', $payload['message']);
    }

    public function testUnbookmarkProject(): void
    {
        $this->loginAs(1);

        // Save
        $this->pdo->prepare("INSERT INTO bookmarks (user_id, project_id) VALUES (1, 2)")->execute();

        // Unsave
        $request = $this->createRequest('DELETE', '/api/projects/2/bookmark');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('Project unsaved successfully', $payload['message']);

        // Verify deleted from db
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM bookmarks WHERE user_id = 1 AND project_id = 2");
        $stmt->execute();
        $this->assertEquals(0, (int)$stmt->fetchColumn());
    }

    public function testGetBookmarks(): void
    {
        $this->loginAs(1);

        // Save projects
        $this->pdo->prepare("INSERT INTO bookmarks (user_id, project_id) VALUES (1, 2)")->execute();

        $request = $this->createRequest('GET', '/api/bookmarks');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertArrayHasKey('data', $payload);
        $this->assertCount(1, $payload['data']);
        $this->assertEquals(2, $payload['data'][0]['project_id']);
        $this->assertEquals('Project Two', $payload['data'][0]['project']['title']);
        $this->assertTrue($payload['data'][0]['project']['is_bookmarked']);
    }

    public function testProjectIsBookmarkedInDetails(): void
    {
        $this->loginAs(1);

        // Bookmark Project 2
        $this->pdo->prepare("INSERT INTO bookmarks (user_id, project_id) VALUES (1, 2)")->execute();

        // Get details
        $request = $this->createRequest('GET', '/api/projects/project-two');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertTrue($payload['is_bookmarked']);

        // Get details of unbookmarked
        $request = $this->createRequest('GET', '/api/projects/project-one');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertFalse($payload['is_bookmarked']);
    }
}
