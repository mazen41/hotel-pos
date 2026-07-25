<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = App\Models\User::where('email', 'admin@hotel.com')->first();
echo "User found: " . ($u ? 'yes' : 'no') . PHP_EOL;
if ($u) {
    echo "role attribute: " . var_export($u->role ?? null, true) . PHP_EOL;
    echo "Has roles() method: " . (method_exists($u, 'roles') ? 'yes' : 'no') . PHP_EOL;
    if (method_exists($u, 'roles')) {
        try {
            echo "roles relation: " . json_encode($u->roles->pluck('name')) . PHP_EOL;
        } catch (Throwable $e) {
            echo "roles relation error: " . $e->getMessage() . PHP_EOL;
        }
    }
}
