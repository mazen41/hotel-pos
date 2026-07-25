# Hotel Management SaaS — Backend API

Laravel 12 REST API with Sanctum token authentication.

## Requirements
- PHP 8.2+
- Composer
- MySQL (production) or SQLite (development)

## Setup

```bash
cd backend

# 1. Install PHP dependencies (includes Sanctum)
composer install

# 2. Copy environment file
cp .env.example .env
# For production, use the production URLs:
# FRONTEND_URL=https://hotel-system-ten-roan.vercel.app
# SANCTUM_STATEFUL_DOMAINS=hotel-system-ten-roan.vercel.app
# APP_URL=https://hotleios.xo.je
# CORS_ALLOWED_ORIGINS=https://hotel-system-ten-roan.vercel.app
# Database configuration is already set for production MySQL

# 3. Generate application key
php artisan key:generate

# 4. Run database migrations
php artisan migrate

# 5. Start development server
php artisan serve
```

The API will be available at: **http://localhost:8000**

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login & get token |
| POST | `/api/auth/logout` | Yes | Logout (revoke token) |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/dashboard/kpis` | Yes | Dashboard KPI cards |
| GET | `/api/dashboard/recent-activity` | Yes | Recent activity feed |
| GET | `/api/dashboard/occupancy-trend` | Yes | 7-day occupancy trend |

## Authentication
Uses **Laravel Sanctum** token-based authentication.

Include the token in the `Authorization` header:
```
Authorization: Bearer {your-token}
```

## Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── Auth/
│   │       │   └── AuthController.php
│   │       └── Dashboard/
│   │           └── DashboardController.php
│   └── Requests/
│       └── Auth/
│           ├── LoginRequest.php
│           └── RegisterRequest.php
├── Models/
│   └── User.php
routes/
├── api.php
└── web.php
config/
├── cors.php
└── sanctum.php
```
