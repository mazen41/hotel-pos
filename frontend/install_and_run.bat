@echo off
echo Installing frontend dependencies...
cd /d D:\hotel-system\frontend
call npm install
echo.
echo Starting frontend development server...
call npm run dev
