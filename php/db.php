<?php
declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_PORT = 3306;
const DB_NAME = 'java_odyssey';
const DB_USER = 'root';
const DB_PASS = '';

function create_pdo_connection(?string $database = null): PDO
{
    $dsn = sprintf(
        'mysql:host=%s;port=%d;%scharset=utf8mb4',
        DB_HOST,
        DB_PORT,
        $database ? 'dbname=' . $database . ';' : ''
    );

    return new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function initialize_database(): void
{
    static $initialized = false;

    if ($initialized) {
        return;
    }

    $server = create_pdo_connection();
    $server->exec(
        'CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );

    $db = create_pdo_connection(DB_NAME);
    $db->exec(
        'CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $db->exec(
        'CREATE TABLE IF NOT EXISTS player_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            level INT NOT NULL DEFAULT 1,
            coins INT NOT NULL DEFAULT 0,
            hp INT NOT NULL DEFAULT 100,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_player_progress_user
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $initialized = true;
}

function get_db(): PDO
{
    static $db = null;

    if ($db instanceof PDO) {
        return $db;
    }

    initialize_database();
    $db = create_pdo_connection(DB_NAME);

    return $db;
}

function find_user_by_email(string $email): ?array
{
    $statement = get_db()->prepare(
        'SELECT id, username, email, password, created_at
         FROM users
         WHERE email = :email
         LIMIT 1'
    );
    $statement->execute([
        'email' => strtolower($email),
    ]);

    $user = $statement->fetch();
    return $user ?: null;
}

function find_user_by_id(int $userId): ?array
{
    $statement = get_db()->prepare(
        'SELECT id, username, email, created_at
         FROM users
         WHERE id = :id
         LIMIT 1'
    );
    $statement->execute([
        'id' => $userId,
    ]);

    $user = $statement->fetch();
    return $user ?: null;
}

function create_user(string $username, string $email, string $passwordHash): int
{
    $statement = get_db()->prepare(
        'INSERT INTO users (username, email, password)
         VALUES (:username, :email, :password)'
    );
    $statement->execute([
        'username' => $username,
        'email' => strtolower($email),
        'password' => $passwordHash,
    ]);

    return (int) get_db()->lastInsertId();
}

function ensure_player_progress(int $userId): void
{
    if (!find_user_by_id($userId)) {
        return;
    }

    $statement = get_db()->prepare(
        'INSERT INTO player_progress (user_id, level, coins, hp)
         VALUES (:user_id, 1, 0, 100)
         ON DUPLICATE KEY UPDATE user_id = user_id'
    );
    $statement->execute([
        'user_id' => $userId,
    ]);
}

function get_player_progress(int $userId): ?array
{
    if (!find_user_by_id($userId)) {
        return null;
    }

    ensure_player_progress($userId);

    $statement = get_db()->prepare(
        'SELECT id, user_id, level, coins, hp, created_at, updated_at
         FROM player_progress
         WHERE user_id = :user_id
         LIMIT 1'
    );
    $statement->execute([
        'user_id' => $userId,
    ]);

    $progress = $statement->fetch();
    return $progress ?: null;
}

function save_player_progress(int $userId, int $level, int $coins, int $hp): void
{
    if (!find_user_by_id($userId)) {
        return;
    }

    $statement = get_db()->prepare(
        'INSERT INTO player_progress (user_id, level, coins, hp)
         VALUES (:user_id, :level, :coins, :hp)
         ON DUPLICATE KEY UPDATE
            level = VALUES(level),
            coins = VALUES(coins),
            hp = VALUES(hp)'
    );
    $statement->execute([
        'user_id' => $userId,
        'level' => $level,
        'coins' => $coins,
        'hp' => $hp,
    ]);
}
