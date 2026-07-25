<?php
// Database migration runner script
// Run this from the backend directory

echo "Running database migrations...\n";
echo "================================\n\n";

chdir(__DIR__);
exec('php artisan migrate --force', $output, $returnCode);

echo "Migration output:\n";
foreach ($output as $line) {
    echo $line . "\n";
}

echo "\n================================\n";
echo "Migration completed with code: " . $returnCode . "\n";

if ($returnCode !== 0) {
    echo "ERROR: Migration failed!\n";
    exit(1);
}

echo "SUCCESS: All migrations ran successfully!\n";