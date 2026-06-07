<?php

namespace CampusTeamUp\Helpers;

class Validator
{
    public static function required(array $fields, array $data): array
    {
        $missing = [];
        foreach ($fields as $field) {
            if (empty($data[$field])) {
                $missing[] = $field;
            }
        }
        return $missing;
    }

    public static function email(string $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function minLength(string $value, int $min): bool
    {
        return strlen($value) >= $min;
    }

    public static function inArray(string $value, array $allowed): bool
    {
        return in_array($value, $allowed, true);
    }

    public static function url(string $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_URL) !== false;
    }
}