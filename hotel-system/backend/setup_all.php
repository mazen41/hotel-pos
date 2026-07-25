<?php
/**
 * Hotel System - Full Setup Script
 * Run: php setup_all.php
 * From: D:\hotel-system\backend\
 */

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Hotel System Setup ===\n\n";

// 1. Create the database if it doesn't exist
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
    $pdo->exec('CREATE DATABASE IF NOT EXISTS hotel_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    echo "[OK] Database 'hotel_system' created/verified.\n";
} catch (Exception $e) {
    echo "[ERROR] Could not create database: " . $e->getMessage() . "\n";
    exit(1);
}

// 2. Publish spatie permission config if not present
if (!file_exists(__DIR__.'/config/permission.php')) {
    echo "[INFO] Publishing Spatie Permission config...\n";
    Artisan::call('vendor:publish', ['--provider' => 'Spatie\\Permission\\PermissionServiceProvider', '--force' => true]);
    echo Artisan::output();
}

// 3. Run migrations
echo "\n[INFO] Running migrations...\n";
Artisan::call('migrate', ['--force' => true]);
echo Artisan::output();

// 4. Run seeders
echo "[INFO] Running seeders...\n";
Artisan::call('db:seed', ['--force' => true]);
echo Artisan::output();

// 5. Clear caches
echo "[INFO] Clearing caches...\n";
Artisan::call('cache:clear');
Artisan::call('config:clear');
Artisan::call('permission:cache-reset');
echo "[OK] Caches cleared.\n";

echo "\n=== Setup Complete ===\n";
echo "Login: admin@hotel.com / password123\n";
echo "Role: Admin (all permissions granted)\n";
