@echo off
echo Configuring MySQL for Hotel Management System...
echo.

REM Copy example env file if .env doesn't exist
if not exist .env (
    copy .env.example .env
    echo Created .env file from .env.example
)

REM Configure MySQL settings
echo DB_CONNECTION=mysql > .env
echo DB_HOST=localhost >> .env
echo DB_PORT=3306 >> .env
echo DB_DATABASE=hotel_management >> .env
echo DB_USERNAME=root >> .env
echo DB_PASSWORD= >> .env

echo.
echo MySQL configuration completed!
echo Database: hotel_management
echo Host: localhost
echo User: root
echo Password: (empty)
echo.
echo Please run: php artisan key:generate
echo Then run: php artisan migrate
echo Then run: php artisan db:seed
