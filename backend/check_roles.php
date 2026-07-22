<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Roles in DB:" . PHP_EOL;
$roles = Spatie\Permission\Models\Role::all();
foreach ($roles as $r) {
    echo "- ID: {$r->id}, Name: {$r->name}" . PHP_EOL;
}
if ($roles->isEmpty()) {
    echo "(none found)" . PHP_EOL;
}

echo PHP_EOL . "Permissions count: " . Spatie\Permission\Models\Permission::count() . PHP_EOL;
