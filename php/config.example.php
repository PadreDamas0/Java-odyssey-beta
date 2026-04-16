<?php
declare(strict_types=1);

return [
    // Copy this file to php/config.php on the server, then fill in the
    // database values shown in the InfinityFree control panel/phpMyAdmin.
    'host' => 'sqlXXX.infinityfree.com',
    'port' => 3306,
    'name' => 'if0_XXXXXXX_java_odyssey',
    'user' => 'if0_XXXXXXX',
    'pass' => 'paste-your-database-password-here',

    // Shared hosts create databases from the hosting panel, not from PHP.
    'auto_create_database' => false,

    // Keep this true so the app can repair/create missing tables if needed.
    'auto_create_tables' => true,
];
