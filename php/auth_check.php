<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function clear_auth_session(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function app_base_path(): string
{
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    $scriptDir = $scriptDir === '.' ? '' : rtrim($scriptDir, '/');

    if (substr($scriptDir, -4) === '/php') {
        $scriptDir = substr($scriptDir, 0, -4);
    }

    return $scriptDir;
}

function app_url(string $path = ''): string
{
    $base = app_base_path();
    $suffix = ltrim($path, '/');

    if ($suffix === '') {
        return $base !== '' ? $base : '/';
    }

    return ($base !== '' ? $base : '') . '/' . $suffix;
}

function is_user_authenticated(): bool
{
    return get_authenticated_user() !== null;
}

function get_authenticated_user(): ?array
{
    static $resolved = false;
    static $authenticatedUser = null;

    if ($resolved) {
        return $authenticatedUser;
    }

    $resolved = true;

    if (!isset($_SESSION['user_id'], $_SESSION['username'], $_SESSION['email'])) {
        return null;
    }

    $user = find_user_by_id((int) $_SESSION['user_id']);
    if (!$user) {
        clear_auth_session();
        return null;
    }

    $_SESSION['username'] = $user['username'];
    $_SESSION['email'] = $user['email'];

    $authenticatedUser = [
        'user_id' => (int) $user['id'],
        'username' => (string) $user['username'],
        'email' => (string) $user['email'],
    ];

    return $authenticatedUser;
}

function require_auth(bool $jsonMode = false): void
{
    if (is_user_authenticated()) {
        return;
    }

    if ($jsonMode) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode([
            'authenticated' => false,
            'message' => 'Authentication required.',
        ]);
        exit;
    }

    header('Location: ' . app_url('login.php?error=' . urlencode('Your session expired. Please log in again.')));
    exit;
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    $mode = $_GET['mode'] ?? '';

    if ($mode === 'json') {
        header('Content-Type: application/json');

        if (!is_user_authenticated()) {
            http_response_code(401);
            echo json_encode([
                'authenticated' => false,
                'message' => 'Your session expired. Please log in again.',
            ]);
            exit;
        }

        $user = get_authenticated_user();
        $progress = get_player_progress((int) $user['user_id']);

        echo json_encode([
            'authenticated' => true,
            'user' => $user,
            'progress' => $progress,
        ]);
        exit;
    }

    require_auth(false);
    header('Location: ' . app_url('game.php'));
    exit;
}
