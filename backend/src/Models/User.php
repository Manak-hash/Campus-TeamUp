<?php

namespace CampusTeamUp\Models;

class User extends Model
{
    protected static function table(): string
    {
        return "users";
    }

    public static function findByEmail(string $email): ?array
    {
        $stmt = self::db()->prepare("SELECT * FROM " . static::table() . " WHERE email = ?");
        $stmt->execute([$email]);
        $result = $stmt->fetch();
        return $result ?: null;
    }
}