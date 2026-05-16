<?php

namespace CampusTeamUp\Tests;

class SkillsTest extends BaseTestCase
{
    public function testGetAllSkills(): void
    {
        // Skills are already seeded by schema.sql
        $request = $this->createRequest('GET', '/api/skills');
        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertGreaterThanOrEqual(10, count($payload));
        $this->assertEquals('C++', $payload[0]['name']);
    }

    public function testUpdateUserSkills(): void
    {
        // Use seeded skill IDs: React (1), TypeScript (2)
        $skillsData = [
            'skills' => [
                ['skill_id' => 1, 'proficiency_level' => 'advanced'],
                ['skill_id' => 2, 'proficiency_level' => 'intermediate']
            ]
        ];

        $request = $this->createRequest('PUT', '/api/profile/skills', [
            'User-Id' => '1',
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode($skillsData));

        $response = $this->app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());

        // Verify in DB
        $stmt = $this->pdo->prepare("SELECT * FROM user_skills WHERE user_id = 1 ORDER BY skill_id ASC");
        $stmt->execute();
        $userSkills = $stmt->fetchAll();

        $this->assertCount(2, $userSkills);
        $this->assertEquals(1, $userSkills[0]['skill_id']);
        $this->assertEquals('advanced', $userSkills[0]['proficiency_level']);
    }

    public function testUpdateUserSkillsReplacesExisting(): void
    {
        // Setup: user already has a skill (React)
        $this->pdo->exec("INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES (1, 1, 'beginner')");

        $skillsData = [
            'skills' => [
                ['skill_id' => 2, 'proficiency_level' => 'advanced']
            ]
        ];

        $request = $this->createRequest('PUT', '/api/profile/skills', [
            'User-Id' => '1',
            'Content-Type' => 'application/json'
        ]);
        $request->getBody()->write(json_encode($skillsData));

        $this->app->handle($request);

        // Verify in DB - should only have TypeScript (2), React (1) should be gone
        $stmt = $this->pdo->prepare("SELECT * FROM user_skills WHERE user_id = 1");
        $stmt->execute();
        $userSkills = $stmt->fetchAll();

        $this->assertCount(1, $userSkills);
        $this->assertEquals(2, $userSkills[0]['skill_id']);
    }
}
