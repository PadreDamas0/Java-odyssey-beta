<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth_check.php';

function redirect_with_message(string $path, string $type, string $message, array $extra = []): never
{
    $query = http_build_query(array_merge([$type => $message], $extra));
    header('Location: ' . $path . ($query ? '?' . $query : ''));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . app_url('register.php'));
    exit;
}

$username = trim($_POST['username'] ?? '');
$email = strtolower(trim($_POST['email'] ?? ''));
$password = (string) ($_POST['password'] ?? '');
$confirmPassword = (string) ($_POST['confirm_password'] ?? '');

if ($username === '' || $email === '' || trim($password) === '' || trim($confirmPassword) === '') {
    redirect_with_message(app_url('register.php'), 'error', 'Please fill in all fields.', [
        'username' => $username,
        'email' => $email,
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_with_message(app_url('register.php'), 'error', 'Please enter a valid email address.', [
        'username' => $username,
        'email' => $email,
    ]);
}

if (strlen($password) < 6) {
    redirect_with_message(app_url('register.php'), 'error', 'Password must be at least 6 characters long.', [
        'username' => $username,
        'email' => $email,
    ]);
}

if ($password !== $confirmPassword) {
    redirect_with_message(app_url('register.php'), 'error', 'Passwords do not match.', [
        'username' => $username,
        'email' => $email,
    ]);
}

if (strlen($username) > 50) {
    redirect_with_message(app_url('register.php'), 'error', 'Username must be 50 characters or fewer.', [
        'username' => $username,
        'email' => $email,
    ]);
}

try {
    if (find_user_by_email($email)) {
        redirect_with_message(app_url('register.php'), 'error', 'That email is already registered.', [
            'username' => $username,
            'email' => $email,
        ]);
    }

    $userId = create_user($username, $email, password_hash($password, PASSWORD_DEFAULT));
    ensure_player_progress($userId);
    ensure_leaderboard_entry($userId);

    redirect_with_message(app_url('login.php'), 'success', 'Registration successful. You can log in now.');
} catch (Throwable $exception) {
    log_app_exception($exception);
    redirect_with_message(app_url('register.php'), 'error', 'Unable to create your account right now.', [
        'username' => $username,
        'email' => $email,
    ]);
}
