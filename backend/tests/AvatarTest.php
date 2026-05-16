<?php

namespace CampusTeamUp\Tests;

use Slim\Psr7\UploadedFile;
use Slim\Psr7\Factory\StreamFactory;

class AvatarTest extends BaseTestCase
{
    public function testUploadAvatarValidatesFileType(): void
    {
        // Create a dummy text file instead of an image
        $stream = (new StreamFactory())->createStream('fake content');
        $uploadedFile = new UploadedFile($stream, 'test.txt', 'text/plain', $stream->getSize());

        $request = $this->createRequest('POST', '/api/profile/avatar', [
            'User-Id' => '1'
        ]);
        $request = $request->withUploadedFiles(['avatar' => $uploadedFile]);

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('Only image/jpeg, image/png, image/webp allowed', $payload['error']);
    }

    public function testUploadAvatarValidatesSize(): void
    {
        // Create a large stream (3MB)
        $stream = (new StreamFactory())->createStream(str_repeat('0', 3 * 1024 * 1024));
        $uploadedFile = new UploadedFile($stream, 'test.jpg', 'image/jpeg', $stream->getSize());

        $request = $this->createRequest('POST', '/api/profile/avatar', [
            'User-Id' => '1'
        ]);
        $request = $request->withUploadedFiles(['avatar' => $uploadedFile]);

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('Max file size: 2MB', $payload['error']);
    }

    public function testUploadAvatarSuccess(): void
    {
        // Create a real temp file
        $tempFile = tempnam(sys_get_temp_dir(), 'avatar');
        file_put_contents($tempFile, 'fake image content');
        
        $stream = (new StreamFactory())->createStreamFromFile($tempFile);
        $uploadedFile = new UploadedFile($stream, 'avatar.png', 'image/png', $stream->getSize());

        $request = $this->createRequest('POST', '/api/profile/avatar', [
            'User-Id' => '1'
        ]);
        $request = $request->withUploadedFiles(['avatar' => $uploadedFile]);

        $response = $this->app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertArrayHasKey('avatar_url', $payload);
        $this->assertStringContainsString('.png', $payload['avatar_url']);

        // Verify DB update
        $stmt = $this->pdo->prepare("SELECT avatar_url FROM users WHERE id = 1");
        $stmt->execute();
        $user = $stmt->fetch();
        $this->assertNotNull($user['avatar_url']);

        // Cleanup
        if (file_exists($tempFile)) unlink($tempFile);
        $realPath = __DIR__ . '/../../public' . $payload['avatar_url'];
        if (file_exists($realPath)) unlink($realPath);
    }
}
