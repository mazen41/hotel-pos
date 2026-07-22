<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\AuditLog\AuditLogController;
use App\Http\Controllers\Api\Notification\NotificationController;
use App\Http\Controllers\Api\Pos\CashShiftController;
use App\Http\Controllers\Api\Pos\HotelIntegrationController;
use App\Http\Controllers\Api\Pos\InventoryController;
use App\Http\Controllers\Api\Pos\MenuCategoryController;
use App\Http\Controllers\Api\Pos\MenuItemController;
use App\Http\Controllers\Api\Pos\OrderController;
use App\Http\Controllers\Api\Pos\PaymentMethodController;
use App\Http\Controllers\Api\Pos\PosSettingController;
use App\Http\Controllers\Api\Pos\ReportController as PosReportController;
use App\Http\Controllers\Api\Pos\ReturnController;
use App\Http\Controllers\Api\User\RoleController;
use App\Http\Controllers\Api\User\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    Route::prefix('users')->middleware('permission:users.view')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });

    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::middleware('permission:roles.view')->group(function () {
            Route::post('/', [RoleController::class, 'store']);
            Route::get('/permissions', [RoleController::class, 'permissions']);
            Route::get('/{role}', [RoleController::class, 'show']);
            Route::put('/{role}', [RoleController::class, 'update']);
            Route::delete('/{role}', [RoleController::class, 'destroy']);
        });
    });

    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{id}/mark-read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });

    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index']);
        Route::get('/{id}', [AuditLogController::class, 'show']);
    });

    Route::prefix('menu-categories')->group(function () {
        Route::get('/', [MenuCategoryController::class, 'index']);
        Route::post('/', [MenuCategoryController::class, 'store']);
        Route::get('/{menuCategory}', [MenuCategoryController::class, 'show']);
        Route::put('/{menuCategory}', [MenuCategoryController::class, 'update']);
        Route::delete('/{menuCategory}', [MenuCategoryController::class, 'destroy']);
    });

    Route::prefix('menu-items')->group(function () {
        Route::get('/', [MenuItemController::class, 'index']);
        Route::post('/', [MenuItemController::class, 'store']);
        Route::get('/{menuItem}', [MenuItemController::class, 'show']);
        Route::put('/{menuItem}', [MenuItemController::class, 'update']);
        Route::delete('/{menuItem}', [MenuItemController::class, 'destroy']);
    });

    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']);
        Route::get('/{order}', [OrderController::class, 'show']);
        Route::put('/{order}', [OrderController::class, 'update']);
        Route::delete('/{order}', [OrderController::class, 'destroy']);
        Route::post('/{order}/items', [OrderController::class, 'addItem']);
        Route::put('/{order}/items/{item}', [OrderController::class, 'updateItem']);
        Route::delete('/{order}/items/{item}', [OrderController::class, 'deleteItem']);
        Route::post('/{order}/payments', [OrderController::class, 'addPayment']);
        Route::post('/{order}/complete', [OrderController::class, 'complete']);
        Route::post('/{order}/cancel', [OrderController::class, 'cancel']);
    });

    Route::prefix('cash-shifts')->group(function () {
        Route::get('/', [CashShiftController::class, 'index']);
        Route::get('/current', [CashShiftController::class, 'getCurrent']);
        Route::post('/open', [CashShiftController::class, 'open']);
        Route::get('/{cashShift}', [CashShiftController::class, 'show']);
        Route::post('/{cashShift}/close', [CashShiftController::class, 'close']);
    });

    Route::prefix('returns')->group(function () {
        Route::get('/', [ReturnController::class, 'index']);
        Route::post('/', [ReturnController::class, 'create']);
        Route::get('/{return}', [ReturnController::class, 'show']);
        Route::post('/{return}/approve', [ReturnController::class, 'approve']);
        Route::post('/{return}/reject', [ReturnController::class, 'reject']);
    });

    Route::prefix('inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::post('/', [InventoryController::class, 'store']);
        Route::get('/{inventory}', [InventoryController::class, 'show']);
        Route::put('/{inventory}', [InventoryController::class, 'update']);
        Route::delete('/{inventory}', [InventoryController::class, 'destroy']);
        Route::post('/{inventory}/adjust', [InventoryController::class, 'adjust']);
        Route::get('/{inventory}/adjustments', [InventoryController::class, 'adjustments']);
    });

    Route::prefix('pos-settings')->group(function () {
        Route::get('/', [PosSettingController::class, 'get']);
        Route::put('/', [PosSettingController::class, 'update']);
    });

    Route::prefix('payment-methods')->group(function () {
        Route::get('/', [PaymentMethodController::class, 'index']);
        Route::post('/', [PaymentMethodController::class, 'store']);
        Route::get('/{paymentMethod}', [PaymentMethodController::class, 'show']);
        Route::put('/{paymentMethod}', [PaymentMethodController::class, 'update']);
        Route::delete('/{paymentMethod}', [PaymentMethodController::class, 'destroy']);
    });

    Route::prefix('reports')->group(function () {
        Route::get('/sales', [PosReportController::class, 'sales']);
        Route::get('/revenue-by-category', [PosReportController::class, 'revenueByCategory']);
        Route::get('/best-sellers', [PosReportController::class, 'bestSellers']);
        Route::get('/cashier-performance', [PosReportController::class, 'cashierPerformance']);
        Route::get('/refunds', [PosReportController::class, 'refunds']);
    });

    Route::prefix('hotel-integration')->group(function () {
        Route::get('/settings', [HotelIntegrationController::class, 'getSettings']);
        Route::put('/settings', [HotelIntegrationController::class, 'updateSettings']);
        Route::get('/rooms/{roomNumber}', [HotelIntegrationController::class, 'lookupRoom']);
        Route::get('/guests/search', [HotelIntegrationController::class, 'searchGuest']);
        Route::post('/charge-to-folio', [HotelIntegrationController::class, 'chargeToFolio']);
    });
});
