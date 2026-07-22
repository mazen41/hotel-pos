<?php
define('LARAVEL_START', microtime(true));
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Login and get token
$user = App\Models\User::where('email','admin@hotel.com')->first();
$token = $user->createToken('debug')->plainTextToken;
echo "Token: " . $token . "\n\n";

// Simulate the /api/users request
$request = Illuminate\Http\Request::create('/api/users', 'GET');
$request->headers->set('Authorization', 'Bearer ' . $token);
$request->headers->set('Accept', 'application/json');

$kernel = $app->make('Illuminate\Contracts\Http\Kernel');
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Body: " . $response->getContent() . "\n";

$kernel->terminate($request, $response);
