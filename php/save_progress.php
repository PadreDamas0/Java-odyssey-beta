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

$userId = (int) $_SESSION['user_id'];
$existingProgress = get_player_progress($userId) ?? [];

$level = filter_var($payload['level'] ?? ($existingProgress['level'] ?? null), FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1],
]);
$coins = filter_var($payload['coins'] ?? ($existingProgress['coins'] ?? null), FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 0],
]);
$hp = filter_var($payload['hp'] ?? ($existingProgress['hp'] ?? null), FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 0],
]);
$xp = filter_var($payload['xp'] ?? ($existingProgress['xp'] ?? 0), FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 0],
]);
$totalXp = filter_var($payload['total_xp'] ?? ($payload['totalXp'] ?? ($existingProgress['total_xp'] ?? $xp)), FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 0],
]);
$timeCompletedRaw = $payload['time_completed'] ?? ($payload['timeCompleted'] ?? null);
$timeCompleted = null;

if ($timeCompletedRaw !== null && $timeCompletedRaw !== '') {
    $timeCompleted = filter_var($timeCompletedRaw, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1],
    ]);
}

if (
    $level === false ||
    $coins === false ||
    $hp === false ||
    $xp === false ||
    $totalXp === false ||
    $timeCompleted === false
) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid progress payload.',
    ]);
    exit;
}

try {
    save_player_progress(
        $userId,
        (int) $level,
        (int) $coins,
        (int) $hp,
        (int) $xp,
        (int) $totalXp,
        $timeCompleted === null ? null : (int) $timeCompleted
    );

    echo json_encode([
        'success' => true,
        'message' => 'Progress saved.',
    ]);
} catch (Throwable $exception) {
    log_app_exception($exception);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to save progress.',
    ]);
}
