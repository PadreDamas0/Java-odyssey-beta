<?php
declare(strict_types=1);

require_once __DIR__ . '/php/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

const ADMIN_USERNAME = 'adminEACC';
const ADMIN_PASSWORD_HASH = '$2y$10$js.X/sjc8eVXNvFaqKD6Huwipi5HIi2bp5OVnaNsowkEASeyp38JG';

function admin_h(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function admin_url(): string
{
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/adminpanel';
    return preg_replace('/adminpanel\.php$/', 'adminpanel', $scriptName) ?: '/adminpanel';
}

function admin_is_authenticated(): bool
{
    return !empty($_SESSION['java_odyssey_admin']);
}

function admin_csrf_token(): string
{
    if (empty($_SESSION['java_odyssey_admin_csrf'])) {
        $_SESSION['java_odyssey_admin_csrf'] = bin2hex(random_bytes(32));
    }

    return (string) $_SESSION['java_odyssey_admin_csrf'];
}

function admin_require_csrf(): void
{
    $token = (string) ($_POST['csrf_token'] ?? '');
    if ($token === '' || !hash_equals(admin_csrf_token(), $token)) {
        throw new RuntimeException('Security check failed. Please refresh the admin page and try again.');
    }
}

function admin_flash(string $type, string $message): void
{
    $_SESSION['java_odyssey_admin_flash'] = [
        'type' => $type,
        'message' => $message,
    ];
}

function admin_take_flash(): ?array
{
    $flash = $_SESSION['java_odyssey_admin_flash'] ?? null;
    unset($_SESSION['java_odyssey_admin_flash']);

    return is_array($flash) ? $flash : null;
}

function admin_redirect(): never
{
    header('Location: ' . admin_url());
    exit;
}

function admin_int(string $key, int $default, int $min, int $max): int
{
    $value = filter_var($_POST[$key] ?? $default, FILTER_VALIDATE_INT);
    if ($value === false) {
        return $default;
    }

    return max($min, min($max, (int) $value));
}

function admin_nullable_int(string $key, int $min, int $max): ?int
{
    $raw = trim((string) ($_POST[$key] ?? ''));
    if ($raw === '') {
        return null;
    }

    $value = filter_var($raw, FILTER_VALIDATE_INT);
    if ($value === false) {
        return null;
    }

    return max($min, min($max, (int) $value));
}

function admin_get_users(): array
{
    $statement = get_db()->query(
        'SELECT
            u.id,
            u.username,
            u.email,
            u.created_at,
            p.level,
            p.coins,
            p.hp,
            p.xp,
            p.total_xp,
            p.updated_at AS progress_updated_at,
            l.time_completed
         FROM users u
         LEFT JOIN player_progress p
            ON p.user_id = u.id
         LEFT JOIN leaderboard_entries l
            ON l.user_id = u.id
         ORDER BY u.id DESC'
    );

    return $statement->fetchAll() ?: [];
}

function admin_delete_user(int $userId): void
{
    if ($userId <= 0) {
        throw new InvalidArgumentException('Invalid user id.');
    }

    $db = get_db();
    $db->beginTransaction();

    try {
        $db->prepare('DELETE FROM leaderboard_entries WHERE user_id = :user_id')->execute(['user_id' => $userId]);
        $db->prepare('DELETE FROM player_progress WHERE user_id = :user_id')->execute(['user_id' => $userId]);
        $statement = $db->prepare('DELETE FROM users WHERE id = :id');
        $statement->execute(['id' => $userId]);

        if ($statement->rowCount() < 1) {
            throw new RuntimeException('User not found.');
        }

        $db->commit();
    } catch (Throwable $exception) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }

        throw $exception;
    }
}

function admin_update_user(): void
{
    $userId = admin_int('user_id', 0, 1, PHP_INT_MAX);
    $username = trim((string) ($_POST['username'] ?? ''));
    $email = strtolower(trim((string) ($_POST['email'] ?? '')));
    $level = admin_int('level', 1, 1, 999);
    $coins = admin_int('coins', 0, 0, 999999);
    $hp = admin_int('hp', 100, 0, 9999);
    $xp = admin_int('xp', 0, 0, 999999);
    $totalXp = admin_int('total_xp', 0, 0, 9999999);
    $timeCompleted = admin_nullable_int('time_completed', 1, 999999999);

    if ($username === '' || strlen($username) > 50) {
        throw new InvalidArgumentException('Username must be 1 to 50 characters.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Please enter a valid email address.');
    }

    $db = get_db();
    $duplicate = $db->prepare('SELECT id FROM users WHERE email = :email AND id <> :id LIMIT 1');
    $duplicate->execute([
        'email' => $email,
        'id' => $userId,
    ]);

    if ($duplicate->fetch()) {
        throw new RuntimeException('That email is already used by another account.');
    }

    $db->beginTransaction();

    try {
        $userStatement = $db->prepare(
            'UPDATE users
             SET username = :username, email = :email
             WHERE id = :id'
        );
        $userStatement->execute([
            'username' => $username,
            'email' => $email,
            'id' => $userId,
        ]);

        if ($userStatement->rowCount() < 1 && !find_user_by_id($userId)) {
            throw new RuntimeException('User not found.');
        }

        $progressStatement = $db->prepare(
            'INSERT INTO player_progress (user_id, level, coins, hp, xp, total_xp)
             VALUES (:user_id, :level, :coins, :hp, :xp, :total_xp)
             ON DUPLICATE KEY UPDATE
                level = VALUES(level),
                coins = VALUES(coins),
                hp = VALUES(hp),
                xp = VALUES(xp),
                total_xp = VALUES(total_xp)'
        );
        $progressStatement->execute([
            'user_id' => $userId,
            'level' => $level,
            'coins' => $coins,
            'hp' => $hp,
            'xp' => $xp,
            'total_xp' => $totalXp,
        ]);

        $leaderboardStatement = $db->prepare(
            'INSERT INTO leaderboard_entries (user_id, username, level, xp, time_completed)
             VALUES (:user_id, :username, :level, :xp, :time_completed)
             ON DUPLICATE KEY UPDATE
                username = VALUES(username),
                level = VALUES(level),
                xp = VALUES(xp),
                time_completed = VALUES(time_completed)'
        );
        $leaderboardStatement->execute([
            'user_id' => $userId,
            'username' => $username,
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

$loginError = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');

    try {
        if ($action === 'login') {
            $username = trim((string) ($_POST['admin_username'] ?? ''));
            $password = (string) ($_POST['admin_password'] ?? '');

            if ($username === ADMIN_USERNAME && password_verify($password, ADMIN_PASSWORD_HASH)) {
                session_regenerate_id(true);
                $_SESSION['java_odyssey_admin'] = true;
                admin_csrf_token();
                admin_redirect();
            }

            $loginError = 'Invalid admin username or password.';
        } elseif ($action === 'logout') {
            admin_require_csrf();
            unset($_SESSION['java_odyssey_admin'], $_SESSION['java_odyssey_admin_csrf']);
            admin_redirect();
        } elseif (admin_is_authenticated() && $action === 'delete_user') {
            admin_require_csrf();
            admin_delete_user(admin_int('user_id', 0, 1, PHP_INT_MAX));
            admin_flash('success', 'User deleted successfully.');
            admin_redirect();
        } elseif (admin_is_authenticated() && $action === 'update_user') {
            admin_require_csrf();
            admin_update_user();
            admin_flash('success', 'User updated successfully.');
            admin_redirect();
        }
    } catch (Throwable $exception) {
        log_app_exception($exception);
        admin_flash('error', $exception->getMessage());
        admin_redirect();
    }
}

$flash = admin_take_flash();
$users = admin_is_authenticated() ? admin_get_users() : [];
$csrfToken = admin_is_authenticated() ? admin_csrf_token() : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Admin Panel | Java Odyssey</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/admin.css?v=20260416a">
</head>
<body class="admin-page">
    <main class="admin-shell">
        <?php if (!admin_is_authenticated()): ?>
            <section class="admin-login-card">
                <p class="admin-kicker">Java Odyssey</p>
                <h1>Admin Gate</h1>
                <p class="admin-muted">Team-only access for user and progress management.</p>

                <?php if ($loginError !== ''): ?>
                    <div class="admin-alert is-error"><?php echo admin_h($loginError); ?></div>
                <?php endif; ?>

                <form class="admin-login-form" method="POST" action="<?php echo admin_h(admin_url()); ?>">
                    <input type="hidden" name="action" value="login">

                    <label>
                        <span>Username</span>
                        <input name="admin_username" type="text" autocomplete="username" required autofocus>
                    </label>

                    <label>
                        <span>Password</span>
                        <input name="admin_password" type="password" autocomplete="current-password" required>
                    </label>

                    <button type="submit">Enter Admin Panel</button>
                </form>
            </section>
        <?php else: ?>
            <section class="admin-panel">
                <header class="admin-header">
                    <div>
                        <p class="admin-kicker">Java Odyssey</p>
                        <h1>Admin Panel</h1>
                        <p class="admin-muted">Manage registered players, account info, and saved progress.</p>
                    </div>
                    <form method="POST" action="<?php echo admin_h(admin_url()); ?>">
                        <input type="hidden" name="action" value="logout">
                        <input type="hidden" name="csrf_token" value="<?php echo admin_h($csrfToken); ?>">
                        <button class="admin-ghost-button" type="submit">Log Out</button>
                    </form>
                </header>

                <?php if ($flash): ?>
                    <div class="admin-alert is-<?php echo admin_h($flash['type'] ?? 'success'); ?>">
                        <?php echo admin_h($flash['message'] ?? 'Action complete.'); ?>
                    </div>
                <?php endif; ?>

                <div class="admin-summary">
                    <span>Total users</span>
                    <strong><?php echo count($users); ?></strong>
                </div>

                <div class="admin-table-wrap">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Account</th>
                                <th>Progress</th>
                                <th>Leaderboard</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (!$users): ?>
                                <tr>
                                    <td colspan="6" class="admin-empty">No users found yet.</td>
                                </tr>
                            <?php endif; ?>

                            <?php foreach ($users as $user): ?>
                                <?php
                                    $userId = (int) $user['id'];
                                    $level = (int) ($user['level'] ?? 1);
                                    $coins = (int) ($user['coins'] ?? 0);
                                    $hp = (int) ($user['hp'] ?? 100);
                                    $xp = (int) ($user['xp'] ?? 0);
                                    $totalXp = (int) ($user['total_xp'] ?? 0);
                                    $timeCompleted = $user['time_completed'] ?? '';
                                ?>
                                <tr>
                                    <td>#<?php echo $userId; ?></td>
                                    <td>
                                        <form id="edit-user-<?php echo $userId; ?>" class="admin-edit-form" method="POST" action="<?php echo admin_h(admin_url()); ?>">
                                            <input type="hidden" name="action" value="update_user">
                                            <input type="hidden" name="csrf_token" value="<?php echo admin_h($csrfToken); ?>">
                                            <input type="hidden" name="user_id" value="<?php echo $userId; ?>">

                                            <label>
                                                <span>Username</span>
                                                <input name="username" value="<?php echo admin_h($user['username']); ?>" maxlength="50" required>
                                            </label>
                                            <label>
                                                <span>Email</span>
                                                <input name="email" type="email" value="<?php echo admin_h($user['email']); ?>" required>
                                            </label>
                                        </form>
                                    </td>
                                    <td>
                                        <div class="admin-grid-fields" form="edit-user-<?php echo $userId; ?>">
                                            <label>
                                                <span>Level</span>
                                                <input form="edit-user-<?php echo $userId; ?>" name="level" type="number" min="1" max="999" value="<?php echo $level; ?>">
                                            </label>
                                            <label>
                                                <span>Coins</span>
                                                <input form="edit-user-<?php echo $userId; ?>" name="coins" type="number" min="0" max="999999" value="<?php echo $coins; ?>">
                                            </label>
                                            <label>
                                                <span>HP</span>
                                                <input form="edit-user-<?php echo $userId; ?>" name="hp" type="number" min="0" max="9999" value="<?php echo $hp; ?>">
                                            </label>
                                            <label>
                                                <span>XP</span>
                                                <input form="edit-user-<?php echo $userId; ?>" name="xp" type="number" min="0" max="999999" value="<?php echo $xp; ?>">
                                            </label>
                                            <label>
                                                <span>Total XP</span>
                                                <input form="edit-user-<?php echo $userId; ?>" name="total_xp" type="number" min="0" max="9999999" value="<?php echo $totalXp; ?>">
                                            </label>
                                        </div>
                                        <p class="admin-muted admin-small">Updated: <?php echo admin_h($user['progress_updated_at'] ?? 'Never'); ?></p>
                                    </td>
                                    <td>
                                        <label class="admin-single-field">
                                            <span>Time completed</span>
                                            <input form="edit-user-<?php echo $userId; ?>" name="time_completed" type="number" min="1" max="999999999" placeholder="None" value="<?php echo admin_h($timeCompleted); ?>">
                                        </label>
                                        <p class="admin-muted admin-small">Leaderboard XP uses Total XP.</p>
                                    </td>
                                    <td><?php echo admin_h($user['created_at']); ?></td>
                                    <td>
                                        <div class="admin-actions">
                                            <button form="edit-user-<?php echo $userId; ?>" class="admin-save-button" type="submit">Save</button>

                                            <form method="POST" action="<?php echo admin_h(admin_url()); ?>" onsubmit="return confirm('Delete this user and their progress? This cannot be undone.');">
                                                <input type="hidden" name="action" value="delete_user">
                                                <input type="hidden" name="csrf_token" value="<?php echo admin_h($csrfToken); ?>">
                                                <input type="hidden" name="user_id" value="<?php echo $userId; ?>">
                                                <button class="admin-danger-button" type="submit">Delete</button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </section>
        <?php endif; ?>
    </main>
</body>
</html>
