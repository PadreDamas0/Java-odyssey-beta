<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']);
    exit;
}

$email = strtolower(trim((string) ($_POST['email'] ?? '')));
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['message' => 'Please enter a valid email address.']);
    exit;
}

try {
    $user = find_user_by_email($email);
    if ($user) {
        record_password_reset_request((int) $user['id']);
    }

    echo json_encode([
        'message' => 'If this email is registered, admin has been notified. Contact the admin for password reset.',
    ]);
} catch (Throwable $exception) {
    error_log('[Java Odyssey] Forgot password error: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Unable to process the request right now. Please try again later.']);
}
