<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\AuditLog\AuditLogController;
use App\Http\Controllers\Api\Availability\AvailabilityController as AvailabilityManagementController;
use App\Http\Controllers\Api\Billing\ChargeController;
use App\Http\Controllers\Api\Billing\FolioController;
use App\Http\Controllers\Api\Billing\PaymentController;
use App\Http\Controllers\Api\Dashboard\DashboardController;
use App\Http\Controllers\Api\Guest\GuestController;
use App\Http\Controllers\Api\Housekeeping\HousekeepingController;
use App\Http\Controllers\Api\Maintenance\MaintenanceController;
use App\Http\Controllers\Api\Notification\NotificationController;
use App\Http\Controllers\Api\RatePlan\RatePlanController;
use App\Http\Controllers\Api\Report\ReportController;
use App\Http\Controllers\Api\Reservation\ReservationController;
use App\Http\Controllers\Api\Room\RoomController;
use App\Http\Controllers\Api\Room\RoomAvailabilityController;
use App\Http\Controllers\Api\Room\RoomMapController;
use App\Http\Controllers\Api\RoomType\RoomTypeController;
use App\Http\Controllers\Api\Search\SearchController;
use App\Http\Controllers\Api\Settings\HotelSettingsController;
use App\Http\Controllers\Api\User\UserController;
use App\Http\Controllers\Api\User\RoleController;
use App\Http\Controllers\Api\Pos\MenuCategoryController;
use App\Http\Controllers\Api\Pos\MenuItemController;
use App\Http\Controllers\Api\Pos\OrderController;
use App\Http\Controllers\Api\Pos\CashShiftController;
use App\Http\Controllers\Api\Pos\ReturnController;
use App\Http\Controllers\Api\Pos\InventoryController;
use App\Http\Controllers\Api\Pos\PosSettingController;
use App\Http\Controllers\Api\Pos\PaymentMethodController;
use App\Http\Controllers\Api\Pos\ReportController as PosReportController;
use App\Http\Controllers\Api\Pos\HotelIntegrationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Hotel Management SaaS
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api (configured in bootstrap/app.php).
| Authentication uses Laravel Sanctum token-based auth.
|
*/

// ─── Public Routes ────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ─── Protected Routes (Sanctum) ───────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });

    // Global Search
    Route::get('/search', [SearchController::class, 'index']);

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('/kpis',             [DashboardController::class, 'kpis']);
        Route::get('/recent-activity',  [DashboardController::class, 'recentActivity']);
        Route::get('/occupancy-trend',  [DashboardController::class, 'occupancyTrend']);
    });

    // Settings
    Route::prefix('settings')->middleware('permission:manage settings')->group(function () {
        Route::get('/hotel',  [HotelSettingsController::class, 'show']);
        Route::post('/hotel', [HotelSettingsController::class, 'update']);
    });

    // Room Types
    Route::prefix('room-types')->group(function () {
        Route::get('/',             [RoomTypeController::class, 'index']);
        Route::post('/',            [RoomTypeController::class, 'store']);
        Route::get('/{roomType}',   [RoomTypeController::class, 'show']);
        Route::put('/{roomType}',   [RoomTypeController::class, 'update']);
        Route::delete('/{roomType}',[RoomTypeController::class, 'destroy']);
    });

    // Guests
    Route::prefix('guests')->group(function () {
        Route::get('/search',  [GuestController::class, 'search']); // must be before /{guest}
        Route::get('/',        [GuestController::class, 'index']);
        Route::post('/',       [GuestController::class, 'store']);
        Route::get('/{guest}', [GuestController::class, 'show']);
        Route::put('/{guest}', [GuestController::class, 'update']);
        Route::delete('/{guest}', [GuestController::class, 'destroy']);
    });

    // Reservations
    Route::prefix('reservations')->group(function () {
        Route::get('/search',       [ReservationController::class, 'search']); // must be before /{reservation}
        Route::get('/',             [ReservationController::class, 'index']);
        Route::post('/',            [ReservationController::class, 'store']);
        Route::get('/{reservation}',    [ReservationController::class, 'show']);
        Route::put('/{reservation}',    [ReservationController::class, 'update']);
        Route::delete('/{reservation}', [ReservationController::class, 'destroy']);
        Route::post('/{reservation}/check-in',          [ReservationController::class, 'checkIn']);
        Route::post('/{reservation}/check-out',         [ReservationController::class, 'checkOut']);
        Route::post('/{reservation}/cancel',            [ReservationController::class, 'cancel']);
        Route::post('/{reservation}/no-show',           [ReservationController::class, 'markNoShow']);
        Route::post('/{reservation}/express-check-in',  [ReservationController::class, 'expressCheckIn']);
        Route::post('/{reservation}/express-check-out', [ReservationController::class, 'expressCheckOut']);
        Route::post('/{reservation}/split',             [ReservationController::class, 'split']);
        Route::post('/{reservation}/add-to-group',      [ReservationController::class, 'addToGroup']);
    });

    // Rate Plans
    Route::prefix('rate-plans')->group(function () {
        // Open to all authenticated users
        Route::get('/search',       [RatePlanController::class, 'search']); // must be before /{ratePlan}
        Route::get('/',             [RatePlanController::class, 'index']);
        Route::get('/{ratePlan}',   [RatePlanController::class, 'show']);

        // Require 'manage rate plans' permission
        Route::middleware('permission:manage rate plans')->group(function () {
            Route::post('/',                                [RatePlanController::class, 'store']);
            Route::put('/{ratePlan}',                       [RatePlanController::class, 'update']);
            Route::delete('/{ratePlan}',                    [RatePlanController::class, 'destroy']);
            Route::post('/{ratePlan}/activate',             [RatePlanController::class, 'activate']);
            Route::post('/{ratePlan}/deactivate',           [RatePlanController::class, 'deactivate']);
            Route::post('/{ratePlan}/duplicate',            [RatePlanController::class, 'duplicate']);
            Route::post('/{ratePlan}/sync-to-channel',      [RatePlanController::class, 'syncToChannel']);
            Route::post('/{ratePlan}/sync-from-channel',    [RatePlanController::class, 'syncFromChannel']);
        });
    });

    // Rooms
    Route::prefix('rooms')->group(function () {
        Route::get('/availability', RoomAvailabilityController::class);  // must be before /{room}
        Route::get('/map',          [RoomMapController::class, 'index']);
        Route::get('/',             [RoomController::class, 'index']);
        Route::post('/',            [RoomController::class, 'store']);
        Route::post('/bulk-status', [RoomController::class, 'bulkStatusUpdate']);
        Route::get('/{room}',       [RoomController::class, 'show']);
        Route::put('/{room}',       [RoomController::class, 'update']);
        Route::delete('/{room}',    [RoomController::class, 'destroy']);
        Route::put('/{room}/quick-status', [RoomMapController::class, 'quickStatus']);
    });

    // Availability Management
    Route::prefix('availability')->group(function () {
        Route::get('/calendar',       [AvailabilityManagementController::class, 'calendar']);
        Route::get('/daily',          [AvailabilityManagementController::class, 'daily']);
        Route::get('/search',         [AvailabilityManagementController::class, 'search']);
        Route::put('/{id}/status',    [AvailabilityManagementController::class, 'updateStatus']);
        Route::post('/stop-sell',     [AvailabilityManagementController::class, 'setStopSell']);
        Route::post('/blocks',        [AvailabilityManagementController::class, 'createBlock']);
        Route::get('/blocks',         [AvailabilityManagementController::class, 'getBlocks']);
        Route::delete('/blocks/{id}', [AvailabilityManagementController::class, 'deleteBlock']);
    });

    // Housekeeping
    Route::prefix('housekeeping')->group(function () {
        Route::get('/board',    [HousekeepingController::class, 'board']);
        Route::get('/summary',  [HousekeepingController::class, 'summary']);
        Route::get('/',         [HousekeepingController::class, 'index']);
        Route::post('/',        [HousekeepingController::class, 'store']);
        Route::post('/bulk',    [HousekeepingController::class, 'bulkCreate']);
        Route::get('/{id}',     [HousekeepingController::class, 'show']);
        Route::put('/{id}',     [HousekeepingController::class, 'update']);
        Route::delete('/{id}',  [HousekeepingController::class, 'destroy']);
        Route::post('/{id}/assign', [HousekeepingController::class, 'assign']);
    });

    // Maintenance
    Route::prefix('maintenance')->group(function () {
        Route::get('/board',    [MaintenanceController::class, 'board']);
        Route::get('/',         [MaintenanceController::class, 'index']);
        Route::post('/',        [MaintenanceController::class, 'store']);
        Route::get('/{id}',     [MaintenanceController::class, 'show']);
        Route::put('/{id}',     [MaintenanceController::class, 'update']);
        Route::delete('/{id}',  [MaintenanceController::class, 'destroy']);
        Route::post('/{id}/assign',           [MaintenanceController::class, 'assign']);
        Route::post('/{id}/mark-in-progress', [MaintenanceController::class, 'markAsInProgress']);
        Route::post('/{id}/mark-completed',   [MaintenanceController::class, 'markAsCompleted']);
        Route::post('/{id}/cancel',           [MaintenanceController::class, 'cancel']);
    });

    // Billing Module
    Route::prefix('billing')->group(function () {
        // Folios
        Route::prefix('folios')->group(function () {
            Route::get('/',         [FolioController::class, 'index']);
            Route::post('/',        [FolioController::class, 'store']);
            Route::get('/{folio}',  [FolioController::class, 'show']);
            Route::put('/{folio}',  [FolioController::class, 'update']);
            Route::delete('/{folio}', [FolioController::class, 'destroy']);
            Route::post('/{folio}/close',   [FolioController::class, 'close']);
            Route::post('/{folio}/reopen',  [FolioController::class, 'reopen']);
        });

        // Charges
        Route::prefix('charges')->group(function () {
            Route::get('/',           [ChargeController::class, 'index']);
            Route::post('/',          [ChargeController::class, 'store']);
            Route::get('/{charge}',   [ChargeController::class, 'show']);
            Route::put('/{charge}',   [ChargeController::class, 'update']);
            Route::delete('/{charge}',[ChargeController::class, 'destroy']);
        });

        // Payments
        Route::prefix('payments')->group(function () {
            Route::get('/',             [PaymentController::class, 'index']);
            Route::post('/',            [PaymentController::class, 'store']);
            Route::get('/{payment}',    [PaymentController::class, 'show']);
            Route::put('/{payment}',    [PaymentController::class, 'update']);
            Route::delete('/{payment}', [PaymentController::class, 'destroy']);
            Route::post('/{payment}/refund', [PaymentController::class, 'refund']);
        });
    });

    // Users & Roles
    Route::prefix('users')->middleware('permission:manage users')->group(function () {
        Route::get('/',        [UserController::class, 'index']);
        Route::post('/',       [UserController::class, 'store']);
        Route::get('/{user}',  [UserController::class, 'show']);
        Route::put('/{user}',  [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });

    // Roles — GET index is open to any authenticated user (needed for dropdowns in user management).
    // Write operations remain restricted to 'manage roles' permission.
    Route::prefix('roles')->group(function () {
        Route::get('/',        [RoleController::class, 'index']);

        Route::middleware('permission:manage roles')->group(function () {
            Route::post('/',             [RoleController::class, 'store']);
            Route::get('/permissions',   [RoleController::class, 'permissions']);
            Route::get('/{role}',        [RoleController::class, 'show']);
            Route::put('/{role}',        [RoleController::class, 'update']);
            Route::delete('/{role}',     [RoleController::class, 'destroy']);
        });
    });

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/occupancy',        [ReportController::class, 'occupancy']);
        Route::get('/revenue',          [ReportController::class, 'revenue']);
        Route::get('/adr',              [ReportController::class, 'adr']);
        Route::get('/revpar',           [ReportController::class, 'revpar']);
        Route::get('/arrivals',         [ReportController::class, 'arrivals']);
        Route::get('/departures',       [ReportController::class, 'departures']);
        Route::get('/guests',           [ReportController::class, 'guests']);
        Route::get('/housekeeping',     [ReportController::class, 'housekeeping']);
        Route::get('/financial-summary',[ReportController::class, 'financialSummary']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/',                     [NotificationController::class, 'index']);
        Route::get('/unread-count',         [NotificationController::class, 'unreadCount']);
        Route::post('/{id}/mark-read',      [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read',       [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{id}',              [NotificationController::class, 'destroy']);
    });

    // Audit Logs (Admin only)
    Route::prefix('audit-logs')->group(function () {
        Route::get('/',      [AuditLogController::class, 'index']);
        Route::get('/{id}',  [AuditLogController::class, 'show']);
    });

    // ─── POS Routes ───────────────────────────────────────────────────────────────
    
    // Menu Categories
    Route::prefix('menu-categories')->group(function () {
        Route::get('/',                    [MenuCategoryController::class, 'index']);
        Route::post('/',                   [MenuCategoryController::class, 'store']);
        Route::get('/{menuCategory}',     [MenuCategoryController::class, 'show']);
        Route::put('/{menuCategory}',     [MenuCategoryController::class, 'update']);
        Route::delete('/{menuCategory}',  [MenuCategoryController::class, 'destroy']);
    });

    // Menu Items
    Route::prefix('menu-items')->group(function () {
        Route::get('/',                    [MenuItemController::class, 'index']);
        Route::post('/',                   [MenuItemController::class, 'store']);
        Route::get('/{menuItem}',         [MenuItemController::class, 'show']);
        Route::put('/{menuItem}',         [MenuItemController::class, 'update']);
        Route::delete('/{menuItem}',      [MenuItemController::class, 'destroy']);
    });

    // Orders
    Route::prefix('orders')->group(function () {
        Route::get('/',                    [OrderController::class, 'index']);
        Route::post('/',                   [OrderController::class, 'store']);
        Route::get('/{order}',            [OrderController::class, 'show']);
        Route::put('/{order}',            [OrderController::class, 'update']);
        Route::delete('/{order}',         [OrderController::class, 'destroy']);
        Route::post('/{order}/items',     [OrderController::class, 'addItem']);
        Route::put('/{order}/items/{item}',[OrderController::class, 'updateItem']);
        Route::delete('/{order}/items/{item}',[OrderController::class, 'deleteItem']);
        Route::post('/{order}/payments', [OrderController::class, 'addPayment']);
        Route::post('/{order}/complete', [OrderController::class, 'complete']);
        Route::post('/{order}/cancel',   [OrderController::class, 'cancel']);
    });

    // Cash Shifts
    Route::prefix('cash-shifts')->group(function () {
        Route::get('/',                    [CashShiftController::class, 'index']);
        Route::get('/current',           [CashShiftController::class, 'getCurrent']);
        Route::post('/open',             [CashShiftController::class, 'open']);
        Route::get('/{cashShift}',       [CashShiftController::class, 'show']);
        Route::post('/{cashShift}/close',[CashShiftController::class, 'close']);
    });

    // Returns
    Route::prefix('returns')->group(function () {
        Route::get('/',                    [ReturnController::class, 'index']);
        Route::post('/',                   [ReturnController::class, 'create']);
        Route::get('/{return}',          [ReturnController::class, 'show']);
        Route::post('/{return}/approve', [ReturnController::class, 'approve']);
        Route::post('/{return}/reject',  [ReturnController::class, 'reject']);
    });

    // Inventory
    Route::prefix('inventory')->group(function () {
        Route::get('/',                    [InventoryController::class, 'index']);
        Route::post('/',                   [InventoryController::class, 'store']);
        Route::get('/{inventory}',       [InventoryController::class, 'show']);
        Route::put('/{inventory}',       [InventoryController::class, 'update']);
        Route::delete('/{inventory}',    [InventoryController::class, 'destroy']);
        Route::post('/{inventory}/adjust',[InventoryController::class, 'adjust']);
        Route::get('/{inventory}/adjustments',[InventoryController::class, 'adjustments']);
    });

    // POS Settings
    Route::prefix('pos-settings')->group(function () {
        Route::get('/',                    [PosSettingController::class, 'get']);
        Route::put('/',                   [PosSettingController::class, 'update']);
    });

    // Payment Methods
    Route::prefix('payment-methods')->group(function () {
        Route::get('/',                    [PaymentMethodController::class, 'index']);
        Route::post('/',                   [PaymentMethodController::class, 'store']);
        Route::get('/{paymentMethod}',  [PaymentMethodController::class, 'show']);
        Route::put('/{paymentMethod}',  [PaymentMethodController::class, 'update']);
        Route::delete('/{paymentMethod}',[PaymentMethodController::class, 'destroy']);
    });

    // POS Reports
    Route::prefix('reports')->group(function () {
        Route::get('/sales',              [PosReportController::class, 'sales']);
        Route::get('/revenue-by-category',[PosReportController::class, 'revenueByCategory']);
        Route::get('/best-sellers',       [PosReportController::class, 'bestSellers']);
        Route::get('/cashier-performance',[PosReportController::class, 'cashierPerformance']);
        Route::get('/refunds',           [PosReportController::class, 'refunds']);
    });

    // Hotel Integration
    Route::prefix('hotel-integration')->group(function () {
        Route::get('/settings',          [HotelIntegrationController::class, 'getSettings']);
        Route::put('/settings',          [HotelIntegrationController::class, 'updateSettings']);
        Route::get('/guests/search',     [HotelIntegrationController::class, 'searchGuest']);
        Route::post('/charge-to-folio', [HotelIntegrationController::class, 'chargeToFolio']);
    });
});
