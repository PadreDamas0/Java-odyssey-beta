<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth_check.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function redirect_with_message(string $path, string $type, string $message, array $extra = []): never
{
    $query = http_build_query(array_merge([$type => $message], $extra));
    header('Location: ' . $path . ($query ? '?' . $query : ''));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . app_url('login.php'));
    exit;
}

$email = strtolower(trim($_POST['email'] ?? ''));
$password = (string) ($_POST['password'] ?? '');

if ($email === '' || trim($password) === '') {
    redirect_with_message(app_url('login.php'), 'error', 'Please enter both email and password.', [
        'email' => $email,
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_with_message(app_url('login.php'), 'error', 'Please enter a valid email address.', [
        'email' => $email,
    ]);
}

if (strlen($password) < 6) {
    redirect_with_message(app_url('login.php'), 'error', 'Password must be at least 6 characters long.', [
        'email' => $email,
    ]);
}

try {
    $user = find_user_by_email($email);

    if (!$user || !password_verify($password, $user['password'])) {
        redirect_with_message(app_url('login.php'), 'error', 'Invalid email or password.', [
            'email' => $email,
        ]);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['email'] = $user['email'];

    ensure_player_progress((int) $user['id']);

    header('Location: ' . app_url('game.php'));
    exit;
} catch (Throwable $exception) {
    redirect_with_message(app_url('login.php'), 'error', 'Unable to log in right now.', [
        'email' => $email,
    ]);
}
