<?php
declare(strict_types=1);

require_once __DIR__ . '/auth_check.php';

require_auth(true);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'GET method required.',
    ]);
    exit;
}

$metric = (string) ($_GET['metric'] ?? 'xp');
$limit = filter_var($_GET['limit'] ?? 10, FILTER_VALIDATE_INT, [
    'options' => [
        'min_range' => 1,
        'max_range' => 25,
    ],
]);

if ($limit === false) {
    $limit = 10;
}

$user = get_authenticated_user();

try {
    $leaderboard = get_leaderboard($metric, (int) $limit, (int) $user['user_id']);

    echo json_encode([
        'success' => true,
        'metric' => $leaderboard['metric'],
        'limit' => $leaderboard['limit'],
        'entries' => $leaderboard['entries'],
        'current_user' => $leaderboard['current_user'],
        'available_metrics' => ['xp', 'level', 'time_completed'],
        'refreshed_at' => date(DATE_ATOM),
    ]);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to load leaderboard right now.',
    ]);
}
