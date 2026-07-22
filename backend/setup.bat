@echo off
echo ============================================
echo  Hotel SaaS Backend — Install ^& Setup
echo ============================================

cd /d D:\hotel-system\backend

echo.
echo [1/4] Installing Composer dependencies (including Sanctum)...
composer install --no-interaction --prefer-dist

echo.
echo [2/4] Generating application key...
php artisan key:generate --force

echo.
echo [3/4] Running database migrations...
php artisan migrate --force

echo.
echo [4/4] Publishing Sanctum config...
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --force

echo.
echo ============================================
echo  Done! Start server with: php artisan serve
echo ============================================
pause
