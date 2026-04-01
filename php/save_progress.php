<?php
declare(strict_types=1);

require_once __DIR__ . '/auth_check.php';

require_auth(true);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'POST method required.',
    ]);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '', true);

if (!is_array($payload)) {
    $payload = $_POST;
}

$level = filter_var($payload['level'] ?? null, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1],
]);
$coins = filter_var($payload['coins'] ?? null, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 0],
]);
$hp = filter_var($payload['hp'] ?? null, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 0],
]);

if ($level === false || $coins === false || $hp === false) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid progress payload.',
    ]);
    exit;
}

try {
    save_player_progress((int) $_SESSION['user_id'], (int) $level, (int) $coins, (int) $hp);

    echo json_encode([
        'success' => true,
        'message' => 'Progress saved.',
    ]);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to save progress.',
    ]);
}
