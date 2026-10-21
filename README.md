# 🧾 Hotel POS System

A Hotel Point of Sale system for managing F&B orders, room charges, and hotel service billing.

## Structure

```
hotel-pos/
├── backend/      # Laravel REST API
├── frontend/     # React frontend
└── hotel-system/ # Shared config
```

## Features

- **Order Management** — table orders, room charges, takeaway
- **Billing & Receipts** — PDF invoice generation
- **Role-based Access** — cashier, manager, admin roles
- **Real-time Updates** — live order status tracking
- **Cancellation Management** — cancellation reasons and reporting

## Tech Stack

- **Backend:** Laravel (PHP), MySQL
- **Frontend:** React, Tailwind CSS
- **API:** RESTful JSON API

## Setup

```bash
# Backend
cd backend && composer install
cp .env.example .env && php artisan migrate

# Frontend
cd frontend && npm install && npm start
```
