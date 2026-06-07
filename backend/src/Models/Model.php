<?php

namespace CampusTeamUp\Models;

use PDO;

abstract class Model
{
    abstract protected static function table(): string;

    protected static function db(): PDO
    {
        return (require __DIR__ . '/../../config/database.php')();
    }

    public static function findById(int $id): ?array
    {
        $stmt = self::db()->prepare("SELECT * FROM " . static::table() . " WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public static function findAll(array $conditions = [], array $params = []): array
    {
        $sql = "SELECT * FROM " . static::table();
        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }
        $stmt = self::db()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function insert(array $data): int
    {
        $columns = implode(", ", array_keys($data));
        $placeholders = implode(", ", array_fill(0, count($data), "?"));
        $sql = "INSERT INTO " . static::table() . " ($columns) VALUES ($placeholders)";
        $stmt = self::db()->prepare($sql);
        $stmt->execute(array_values($data));
        return (int) self::db()->lastInsertId();
    }

    public static function update(array $data, string $where, array $whereParams = []): bool
    {
        $setParts = [];
        foreach (array_keys($data) as $column) {
            $setParts[] = "$column = ?";
        }
        $sql = "UPDATE " . static::table() . " SET " . implode(", ", $setParts) . " WHERE $where";
        $stmt = self::db()->prepare($sql);
        return $stmt->execute([...array_values($data), ...$whereParams]);
    }

    public static function delete(string $where, array $params = []): bool
    {
        $sql = "DELETE FROM " . static::table() . " WHERE $where";
        $stmt = self::db()->prepare($sql);
        return $stmt->execute($params);
    }
}