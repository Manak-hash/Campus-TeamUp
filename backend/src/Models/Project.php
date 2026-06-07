<?php

namespace CampusTeamUp\Models;

class Project extends Model
{
    protected static function table(): string
    {
        return "projects";
    }

    public static function findBySlug(string $slug): ?array
    {
        $stmt = self::db()->prepare("SELECT * FROM " . static::table() . " WHERE slug = ?");
        $stmt->execute([$slug]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public static function findWithDetails(int $id): ?array
    {
        $sql = "SELECT p.*,
                u.name as owner_name, u.email as owner_email, u.avatar_url as owner_avatar,
                (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
                FROM " . static::table() . " p
                LEFT JOIN users u ON p.owner_id = u.id
                WHERE p.id = ?";
        $stmt = self::db()->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public static function updateStatusIfFull(int $projectId): void
    {
        $sql = "UPDATE " . static::table() . " p
                SET status = 'full'
                WHERE p.id = ?
                AND p.max_members <= (SELECT COUNT(*) FROM project_members WHERE project_id = p.id)";
        $stmt = self::db()->prepare($sql);
        $stmt->execute([$projectId]);
    }
}