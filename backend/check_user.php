<?php
define('LARAVEL_START', microtime(true));
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = App\Models\User::where('email','admin@hotel.com')->first();
if ($user) {
    echo "Found: " . $user->name . "\n";
    echo "Roles: " . $user->roles->pluck('name')->implode(', ') . "\n";
    echo "manage users: " . ($user->hasPermissionTo('manage users') ? 'YES' : 'NO') . "\n";
    echo "manage roles:  " . ($user->hasPermissionTo('manage roles')  ? 'YES' : 'NO') . "\n";
} else {
    echo "No admin user found\n";
    $all = App\Models\User::with('roles')->get();
    foreach ($all as $u) {
        echo " - " . $u->email . " | roles: " . $u->roles->pluck('name')->implode(', ') . "\n";
    }
}
