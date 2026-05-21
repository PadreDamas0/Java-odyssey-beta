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
[$phase, $currentScene, $currentPosition, $savepointScene, $savepointLabel] = [
    trim((string) ($payload['phase'] ?? ($existingProgress['phase'] ?? 'menu'))),
    trim((string) ($payload['current_scene'] ?? ($payload['currentScene'] ?? ($existingProgress['current_scene'] ?? '')))),
    trim((string) ($payload['current_position'] ?? ($payload['currentPosition'] ?? ($existingProgress['current_position'] ?? '')))),
    trim((string) ($payload['savepoint_scene'] ?? ($payload['savepointScene'] ?? ($existingProgress['savepoint_scene'] ?? '')))),
    trim((string) ($payload['savepoint_label'] ?? ($payload['savepointLabel'] ?? ($existingProgress['savepoint_label'] ?? '')))),
];
$saveState = $payload['save_state'] ?? ($payload['saveState'] ?? ($existingProgress['save_state'] ?? null));

if ($timeCompletedRaw !== null && $timeCompletedRaw !== '') {
    $timeCompleted = filter_var($timeCompletedRaw, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1],
    ]);
}

if ($phase === '') {
    $phase = (string) ($existingProgress['phase'] ?? 'menu');
}

$currentScene = $currentScene !== '' ? $currentScene : null;
$currentPosition = $currentPosition !== '' ? $currentPosition : null;
$savepointScene = $savepointScene !== '' ? $savepointScene : ($currentScene ?: null);
$savepointLabel = $savepointLabel !== '' ? $savepointLabel : null;

if ($saveState !== null && !is_array($saveState)) {
    $saveState = null;
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
        $timeCompleted === null ? null : (int) $timeCompleted,
        $phase,
        $currentScene,
        $currentPosition,
        $savepointScene,
        $savepointLabel,
        $saveState
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
