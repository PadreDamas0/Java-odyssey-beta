<?php
declare(strict_types=1);

function load_app_config(): array
{
    $configPath = __DIR__ . '/config.php';

    if (!is_file($configPath)) {
        return [];
    }

    $config = require $configPath;

    if (!is_array($config)) {
        throw new RuntimeException('php/config.php must return a configuration array.');
    }

    return $config;
}

function app_config_value(array $config, string $key, string $envKey, mixed $default): mixed
{
    if (array_key_exists($key, $config)) {
        return $config[$key];
    }

    $envValue = getenv($envKey);
    if ($envValue !== false) {
        return $envValue;
    }

    return $default;
}

function app_config_bool(mixed $value): bool
{
    if (is_bool($value)) {
        return $value;
    }

    if (is_string($value)) {
        return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
    }

    return (bool) $value;
}

$appConfig = load_app_config();

define('DB_HOST', (string) app_config_value($appConfig, 'host', 'JAVA_ODYSSEY_DB_HOST', '127.0.0.1'));
define('DB_PORT', (int) app_config_value($appConfig, 'port', 'JAVA_ODYSSEY_DB_PORT', 3306));
define('DB_NAME', (string) app_config_value($appConfig, 'name', 'JAVA_ODYSSEY_DB_NAME', 'java_odyssey'));
define('DB_USER', (string) app_config_value($appConfig, 'user', 'JAVA_ODYSSEY_DB_USER', 'root'));
define('DB_PASS', (string) app_config_value($appConfig, 'pass', 'JAVA_ODYSSEY_DB_PASS', ''));

$defaultAutoCreateDatabase = DB_USER === 'root' && in_array(DB_HOST, ['127.0.0.1', 'localhost'], true);
define(
    'DB_AUTO_CREATE_DATABASE',
    app_config_bool(app_config_value($appConfig, 'auto_create_database', 'JAVA_ODYSSEY_DB_AUTO_CREATE_DATABASE', $defaultAutoCreateDatabase))
);
define(
    'DB_AUTO_CREATE_TABLES',
    app_config_bool(app_config_value($appConfig, 'auto_create_tables', 'JAVA_ODYSSEY_DB_AUTO_CREATE_TABLES', true))
);

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

function log_app_exception(Throwable $exception): void
{
    error_log(sprintf(
        '[Java Odyssey] %s: %s in %s:%d',
        get_class($exception),
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine()
    ));
}

function assert_sql_identifier(string $identifier): string
{
    if (!preg_match('/^[A-Za-z0-9_]+$/', $identifier)) {
        throw new InvalidArgumentException('Invalid SQL identifier.');
    }

    return $identifier;
}

function ensure_table_column(PDO $db, string $table, string $column, string $definition): void
{
    $table = assert_sql_identifier($table);
    $column = assert_sql_identifier($column);

    $statement = $db->prepare(
        'SELECT COUNT(*)
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = :schema
           AND TABLE_NAME = :table_name
           AND COLUMN_NAME = :column_name'
    );
    $statement->execute([
        'schema' => DB_NAME,
        'table_name' => $table,
        'column_name' => $column,
    ]);

    if ((int) $statement->fetchColumn() > 0) {
        return;
    }

    $db->exec(sprintf('ALTER TABLE `%s` ADD COLUMN %s', $table, $definition));
}

function decode_progress_save_state(mixed $rawState): ?array
{
    if (!is_string($rawState) || trim($rawState) === '') {
        return null;
    }

    $decoded = json_decode($rawState, true);
    return is_array($decoded) ? $decoded : null;
}

function encode_progress_save_state(?array $saveState): ?string
{
    if ($saveState === null) {
        return null;
    }

    $encoded = json_encode($saveState, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    return $encoded === false ? null : $encoded;
}

function initialize_database(): void
{
    static $initialized = false;

    if ($initialized) {
        return;
    }

    if (DB_AUTO_CREATE_DATABASE) {
        $server = create_pdo_connection();
        $server->exec(
            'CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
        );
    }

    if (!DB_AUTO_CREATE_TABLES) {
        $initialized = true;
        return;
    }

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
            xp INT NOT NULL DEFAULT 0,
            total_xp INT NOT NULL DEFAULT 0,
            phase VARCHAR(50) NOT NULL DEFAULT \'menu\',
            current_scene VARCHAR(100) DEFAULT NULL,
            current_position VARCHAR(50) DEFAULT NULL,
            savepoint_scene VARCHAR(100) DEFAULT NULL,
            savepoint_label VARCHAR(150) DEFAULT NULL,
            save_state LONGTEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_player_progress_user
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    ensure_table_column($db, 'player_progress', 'xp', '`xp` INT NOT NULL DEFAULT 0 AFTER `hp`');
    ensure_table_column($db, 'player_progress', 'total_xp', '`total_xp` INT NOT NULL DEFAULT 0 AFTER `xp`');
    ensure_table_column($db, 'player_progress', 'phase', '`phase` VARCHAR(50) NOT NULL DEFAULT \'menu\' AFTER `total_xp`');
    ensure_table_column($db, 'player_progress', 'current_scene', '`current_scene` VARCHAR(100) DEFAULT NULL AFTER `phase`');
    ensure_table_column($db, 'player_progress', 'current_position', '`current_position` VARCHAR(50) DEFAULT NULL AFTER `current_scene`');
    ensure_table_column($db, 'player_progress', 'savepoint_scene', '`savepoint_scene` VARCHAR(100) DEFAULT NULL AFTER `current_position`');
    ensure_table_column($db, 'player_progress', 'savepoint_label', '`savepoint_label` VARCHAR(150) DEFAULT NULL AFTER `savepoint_scene`');
    ensure_table_column($db, 'player_progress', 'save_state', '`save_state` LONGTEXT DEFAULT NULL AFTER `savepoint_label`');

    $db->exec(
        'CREATE TABLE IF NOT EXISTS leaderboard_entries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            username VARCHAR(50) NOT NULL,
            level INT NOT NULL DEFAULT 1,
            xp INT NOT NULL DEFAULT 0,
            time_completed INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_leaderboard_user
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    ensure_table_column($db, 'leaderboard_entries', 'username', '`username` VARCHAR(50) NOT NULL AFTER `user_id`');
    ensure_table_column($db, 'leaderboard_entries', 'level', '`level` INT NOT NULL DEFAULT 1 AFTER `username`');
    ensure_table_column($db, 'leaderboard_entries', 'xp', '`xp` INT NOT NULL DEFAULT 0 AFTER `level`');
    ensure_table_column($db, 'leaderboard_entries', 'time_completed', '`time_completed` INT DEFAULT NULL AFTER `xp`');
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
        'INSERT INTO player_progress (
            user_id, level, coins, hp, xp, total_xp, phase, current_scene, current_position, savepoint_scene, savepoint_label, save_state
         )
         VALUES (:user_id, 1, 0, 100, 0, 0, \'menu\', NULL, NULL, NULL, NULL, NULL)
         ON DUPLICATE KEY UPDATE user_id = user_id'
    );
    $statement->execute([
        'user_id' => $userId,
    ]);
}

function ensure_leaderboard_entry(int $userId): void
{
    $user = find_user_by_id($userId);
    if (!$user) {
        return;
    }

    ensure_player_progress($userId);

    $progressStatement = get_db()->prepare(
        'SELECT level, total_xp
         FROM player_progress
         WHERE user_id = :user_id
         LIMIT 1'
    );
    $progressStatement->execute([
        'user_id' => $userId,
    ]);

    $progress = $progressStatement->fetch();
    if (!$progress) {
        return;
    }

    $statement = get_db()->prepare(
        'INSERT INTO leaderboard_entries (user_id, username, level, xp, time_completed)
         VALUES (:user_id, :username, :level, :xp, NULL)
         ON DUPLICATE KEY UPDATE
            username = VALUES(username)'
    );
    $statement->execute([
        'user_id' => $userId,
        'username' => (string) $user['username'],
        'level' => (int) $progress['level'],
        'xp' => (int) $progress['total_xp'],
    ]);
}
function get_player_progress(int $userId): ?array
{
    if (!find_user_by_id($userId)) {
        return null;
    }

    ensure_player_progress($userId);
    ensure_leaderboard_entry($userId);

    $statement = get_db()->prepare(
        'SELECT
            p.id,
            p.user_id,
            p.level,
            p.coins,
            p.hp,
            p.xp,
            p.total_xp,
            p.phase,
            p.current_scene,
            p.current_position,
            p.savepoint_scene,
            p.savepoint_label,
            p.save_state,
            l.time_completed,
            p.created_at,
            p.updated_at
         FROM player_progress p
         LEFT JOIN leaderboard_entries l
            ON l.user_id = p.user_id
         WHERE p.user_id = :user_id
         LIMIT 1'
    );
    $statement->execute([
        'user_id' => $userId,
    ]);

    $progress = $statement->fetch();
    if ($progress && array_key_exists('save_state', $progress)) {
        $progress['save_state'] = decode_progress_save_state($progress['save_state']);
    }
    return $progress ?: null;
}

function save_player_progress(
    int $userId,
    int $level,
    int $coins,
    int $hp,
    int $xp,
    int $totalXp,
    ?int $timeCompleted = null,
    string $phase = 'menu',
    ?string $currentScene = null,
    ?string $currentPosition = null,
    ?string $savepointScene = null,
    ?string $savepointLabel = null,
    ?array $saveState = null
): void
{
    $user = find_user_by_id($userId);
    if (!$user) {
        return;
    }

    $db = get_db();
    $encodedSaveState = encode_progress_save_state($saveState);

    try {
        $db->beginTransaction();

        $progressStatement = $db->prepare(
            'INSERT INTO player_progress (
                user_id, level, coins, hp, xp, total_xp, phase, current_scene, current_position, savepoint_scene, savepoint_label, save_state
             )
             VALUES (
                :user_id, :level, :coins, :hp, :xp, :total_xp, :phase, :current_scene, :current_position, :savepoint_scene, :savepoint_label, :save_state
             )
             ON DUPLICATE KEY UPDATE
                level = VALUES(level),
                coins = VALUES(coins),
                hp = VALUES(hp),
                xp = VALUES(xp),
                total_xp = VALUES(total_xp),
                phase = VALUES(phase),
                current_scene = VALUES(current_scene),
                current_position = VALUES(current_position),
                savepoint_scene = VALUES(savepoint_scene),
                savepoint_label = VALUES(savepoint_label),
                save_state = VALUES(save_state)'
        );
        $progressStatement->execute([
            'user_id' => $userId,
            'level' => $level,
            'coins' => $coins,
            'hp' => $hp,
            'xp' => $xp,
            'total_xp' => $totalXp,
            'phase' => $phase,
            'current_scene' => $currentScene,
            'current_position' => $currentPosition,
            'savepoint_scene' => $savepointScene,
            'savepoint_label' => $savepointLabel,
            'save_state' => $encodedSaveState,
        ]);

        $leaderboardStatement = $db->prepare(
            'INSERT INTO leaderboard_entries (user_id, username, level, xp, time_completed)
             VALUES (:user_id, :username, :level, :xp, :time_completed)
             ON DUPLICATE KEY UPDATE
                username = VALUES(username),
                level = VALUES(level),
                xp = VALUES(xp),
                time_completed = CASE
                    WHEN VALUES(time_completed) IS NULL THEN leaderboard_entries.time_completed
                    WHEN leaderboard_entries.time_completed IS NULL THEN VALUES(time_completed)
                    ELSE LEAST(leaderboard_entries.time_completed, VALUES(time_completed))
                END'
        );
        $leaderboardStatement->execute([
            'user_id' => $userId,
            'username' => (string) $user['username'],
            'level' => $level,
            'xp' => $totalXp,
            'time_completed' => $timeCompleted,
        ]);

        $db->commit();
    } catch (Throwable $exception) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }

        throw $exception;
    }
}

function get_leaderboard_order_clause(string $metric): string
{
    switch ($metric) {
        case 'level':
            return 'level DESC, xp DESC, CASE WHEN time_completed IS NULL THEN 1 ELSE 0 END ASC, time_completed ASC, username ASC, id ASC';
        case 'time_completed':
            return 'time_completed ASC, level DESC, xp DESC, username ASC, id ASC';
        case 'xp':
        default:
            return 'xp DESC, level DESC, CASE WHEN time_completed IS NULL THEN 1 ELSE 0 END ASC, time_completed ASC, username ASC, id ASC';
    }
}

function normalize_leaderboard_entry(array $entry, ?int $rankPosition, ?int $currentUserId = null): array
{
    $userId = (int) ($entry['user_id'] ?? 0);
    $timeCompleted = $entry['time_completed'] ?? null;

    return [
        'id' => (int) ($entry['id'] ?? 0),
        'user_id' => $userId,
        'username' => (string) ($entry['username'] ?? 'Unknown Guardian'),
        'level' => (int) ($entry['level'] ?? 1),
        'xp' => (int) ($entry['xp'] ?? 0),
        'time_completed' => $timeCompleted === null ? null : (int) $timeCompleted,
        'rank_position' => $rankPosition,
        'is_current_user' => $currentUserId !== null && $userId === $currentUserId,
    ];
}

function get_leaderboard(string $metric = 'xp', int $limit = 10, ?int $currentUserId = null): array
{
    $metric = in_array($metric, ['xp', 'level', 'time_completed'], true) ? $metric : 'xp';
    $limit = max(1, min($limit, 25));
    $orderClause = get_leaderboard_order_clause($metric);
    $whereClause = $metric === 'time_completed' ? 'WHERE time_completed IS NOT NULL' : '';

    if ($currentUserId !== null) {
        ensure_leaderboard_entry($currentUserId);
    }

    $statement = get_db()->query(
        'SELECT id, user_id, username, level, xp, time_completed, updated_at
         FROM leaderboard_entries
         ' . $whereClause . '
         ORDER BY ' . $orderClause
    );

    $allEntries = $statement->fetchAll() ?: [];
    $entries = [];

    foreach (array_slice($allEntries, 0, $limit) as $index => $entry) {
        $entries[] = normalize_leaderboard_entry($entry, $index + 1, $currentUserId);
    }

    $currentUserEntry = null;
    if ($currentUserId !== null) {
        $currentStatement = get_db()->prepare(
            'SELECT id, user_id, username, level, xp, time_completed
             FROM leaderboard_entries
             WHERE user_id = :user_id
             LIMIT 1'
        );
        $currentStatement->execute([
            'user_id' => $currentUserId,
        ]);

        $currentRow = $currentStatement->fetch();
        if ($currentRow) {
            $rankPosition = null;

            if ($metric !== 'time_completed' || $currentRow['time_completed'] !== null) {
                foreach ($allEntries as $index => $entry) {
                    if ((int) $entry['user_id'] === $currentUserId) {
                        $rankPosition = $index + 1;
                        break;
                    }
                }
            }

            $currentUserEntry = normalize_leaderboard_entry($currentRow, $rankPosition, $currentUserId);
        }
    }

    return [
        'metric' => $metric,
        'limit' => $limit,
        'entries' => $entries,
        'current_user' => $currentUserEntry,
    ];
}
