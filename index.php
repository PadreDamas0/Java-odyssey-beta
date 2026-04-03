<?php
declare(strict_types=1);

require_once __DIR__ . '/php/auth_check.php';

if (is_user_authenticated()) {
    header('Location: game.php');
    exit;
}

header('Location: login.php');
exit;
