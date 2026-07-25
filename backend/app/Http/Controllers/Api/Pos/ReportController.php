<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\OrderPayment;
use App\Models\OrderReturnItem;
use App\Models\CashShift;
use App\Models\User;
use App\Models\Table;
use App\Models\MenuItem;
use App\Models\MenuCategory;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    /**
     * Get metadata for filtering reports
     */
    public function metadata(): JsonResponse
    {
        $cashiers = User::select('id', 'name')->get();
        $shifts = CashShift::select('cash_shifts.id', 'cash_shifts.opened_at', 'cash_shifts.status', 'users.name as cashier_name')
            ->leftJoin('users', 'cash_shifts.user_id', '=', 'users.id')
            ->orderBy('cash_shifts.opened_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($s) {
                $date = $s->opened_at ? \Carbon\Carbon::parse($s->opened_at)->format('d/m/Y H:i') : "#{$s->id}";
                $s->label = "Shift #{$s->id} — {$date} (" . ($s->cashier_name ?? 'Cashier') . ")";
                return $s;
            });
        $tables = Table::select('id', 'number', 'status')->get();
        $items = MenuItem::select('id', 'name', 'price', 'menu_category_id')->get();
        $categories = MenuCategory::select('id', 'name')->get();
        $paymentMethods = PaymentMethod::select('id', 'name', 'code')->get();

        return response()->json([
            'data' => [
                'cashiers'        => $cashiers,
                'shifts'          => $shifts,
                'tables'          => $tables,
                'items'           => $items,
                'categories'      => $categories,
                'payment_methods' => $paymentMethods
            ]
        ]);
    }

    /**
     * Unified report generator
     */
    public function generateReport(Request $request): JsonResponse
    {
        $request->validate([
            'type'             => 'required|string',
            'date_from'        => 'nullable|date',
            'date_to'          => 'nullable|date',
            'preset'           => 'nullable|string',
            'user_id'          => 'nullable|integer',
            'cash_shift_id'    => 'nullable|integer',
            'menu_item_id'     => 'nullable|integer',
            'menu_category_id' => 'nullable|integer',
            'table_number'     => 'nullable|string',
            'payment_method_id'=> 'nullable|integer',
            'limit'            => 'nullable|integer|min:1|max:100'
        ]);

        $type = $request->type;
        $data = [];

        switch ($type) {
            case 'dashboard_summary':
            case 'sales_summary':
                $data = $this->getSalesSummary($request);
                break;
            case 'sales_daily':
                $data = $this->getSalesDaily($request);
                break;
            case 'sales_hourly':
                $data = $this->getSalesHourly($request);
                break;
            case 'sales_cashier':
                $data = $this->getSalesCashier($request);
                break;
            case 'sales_shift':
                $data = $this->getSalesShift($request);
                break;
            case 'sales_payment':
                $data = $this->getSalesPayment($request);
                break;
            case 'sales_tax':
                $data = $this->getSalesTax($request);
                break;
            case 'sales_service':
                $data = $this->getSalesServiceCharge($request);
                break;
            case 'sales_discount':
                $data = $this->getSalesDiscount($request);
                break;
            case 'sales_refund':
                $data = $this->getSalesRefund($request);
                break;
            case 'sales_void':
                $data = $this->getSalesVoid($request);
                break;
            case 'items_best':
            case 'items_worst':
                $data = $this->getItemsRanking($request);
                break;
            case 'items_sales':
                $data = $this->getItemsSales($request);
                break;
            case 'items_profit':
                $data = $this->getItemsProfit($request);
                break;
            case 'categories_sales':
                $data = $this->getCategoriesSales($request);
                break;
            case 'tables_sales':
            case 'tables_revenue':
                $data = $this->getTablesSales($request);
                break;
            case 'tables_occupancy':
                $data = $this->getTablesOccupancy($request);
                break;
            case 'shifts_summary':
                $data = $this->getShiftsSummary($request);
                break;
            case 'cashiers_summary':
                $data = $this->getCashiersSummary($request);
                break;
            default:
                return response()->json(['message' => "Report type '{$type}' is not supported."], 400);
        }

        return response()->json(['data' => $data]);
    }

    /**
     * Get sales report (Legacy Compatibility / Redirected)
     */
    public function sales(Request $request): JsonResponse
    {
        $request->merge(['type' => 'sales_summary']);
        return $this->generateReport($request);
    }

    /**
     * Get revenue by category (Legacy Compatibility / Redirected)
     */
    public function revenueByCategory(Request $request): JsonResponse
    {
        $request->merge(['type' => 'categories_sales']);
        $response = $this->generateReport($request);
        $originalData = $response->getData()->data;

        // Legacy format mapping: array of { category: string, revenue: number, percentage: number }
        $total = collect($originalData)->sum('revenue');
        $mapped = collect($originalData)->map(function ($c) use ($total) {
            return [
                'category'   => $c->category,
                'revenue'    => (float) $c->revenue,
                'percentage' => $total > 0 ? ($c->revenue / $total) * 100 : 0
            ];
        });

        return response()->json(['data' => $mapped]);
    }

    /**
     * Get best sellers (Legacy Compatibility / Redirected)
     */
    public function bestSellers(Request $request): JsonResponse
    {
        $request->merge(['type' => 'items_best']);
        $response = $this->generateReport($request);
        $originalData = $response->getData()->data;

        // Legacy mapping
        $mapped = collect($originalData)->map(function ($item) {
            return [
                'name'          => $item->name,
                'quantity'      => (int) $item->quantity,
                'revenue'       => (float) $item->revenue,
                'average_price' => $item->quantity > 0 ? (float) ($item->revenue / $item->quantity) : 0
            ];
        });

        return response()->json(['data' => $mapped]);
    }

    /**
     * Get cashier performance (Legacy Compatibility / Redirected)
     */
    public function cashierPerformance(Request $request): JsonResponse
    {
        $request->merge(['type' => 'cashiers_summary']);
        $response = $this->generateReport($request);
        $originalData = $response->getData()->data;

        // Legacy mapping
        $mapped = collect($originalData)->map(function ($c) {
            return [
                'user_id'             => $c->cashier_id,
                'cashier'             => $c->cashier,
                'total_orders'        => (int) $c->total_orders,
                'total_sales'         => (float) $c->total_sales,
                'average_order_value' => (float) $c->average_ticket,
                'refunds'             => (int) ($c->total_refunds_count ?? 0),
                'voids'               => (int) ($c->total_voids_count ?? 0)
            ];
        });

        return response()->json(['data' => $mapped]);
    }

    /**
     * Get refunds report (Legacy Compatibility / Redirected)
     */
    public function refunds(Request $request): JsonResponse
    {
        $request->merge(['type' => 'sales_refund']);
        $response = $this->generateReport($request);
        $originalData = $response->getData()->data;

        // Calculate summary
        $totalRefunds = collect($originalData)->sum('count');
        $totalAmount = collect($originalData)->sum('refunds');

        // Refund method breakdown (join payment methods if needed, or query returns directly)
        $refundByMethod = OrderReturn::where('status', 'approved');
        if ($request->filled('date_from')) $refundByMethod->whereDate('created_at', '>=', $request->date_from);
        if ($request->filled('date_to')) $refundByMethod->whereDate('created_at', '<=', $request->date_to);
        $refundByMethod = $refundByMethod->selectRaw('refund_method, SUM(total_amount) as total')
            ->groupBy('refund_method')
            ->pluck('total', 'refund_method');

        $refundByReason = OrderReturn::where('status', 'approved');
        if ($request->filled('date_from')) $refundByReason->whereDate('created_at', '>=', $request->date_from);
        if ($request->filled('date_to')) $refundByReason->whereDate('created_at', '<=', $request->date_to);
        $refundByReason = $refundByReason->selectRaw('reason, COUNT(*) as count, SUM(total_amount) as total')
            ->groupBy('reason')
            ->get();

        return response()->json([
            'data' => [
                'total_refunds'      => $totalRefunds,
                'total_amount'       => $totalAmount,
                'refund_by_method'   => $refundByMethod,
                'refund_by_reason'   => $refundByReason,
                'top_refunded_items' => []
            ]
        ]);
    }

    /* ─── Core Report Logic Helpers ────────────────────────────────────────── */

    private function getSalesSummary(Request $request): array
    {
        // ── 1. Revenue orders (non-cancelled) ─────────────────────────────────
        $ordersQuery = Order::where('status', 'completed');
        $this->applyFilters($ordersQuery, $request);

        $orders = (clone $ordersQuery)->get();

        $totalSales = (float) $orders->sum('total');
        $totalOrders = $orders->count();
        $averageOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;
        $taxCollected = (float) $orders->sum('tax_amount');
        $serviceChargeCollected = (float) $orders->sum('service_charge');
        $discountsGiven = (float) $orders->sum('discount_amount');

        // ── 2. Refunds ────────────────────────────────────────────────────────
        $refundQuery = OrderReturn::where('status', 'approved');
        $this->applyFilters($refundQuery, $request);
        $refundsProcessed = (float) (clone $refundQuery)->sum('total_amount');

        $netRevenue = $totalSales - $refundsProcessed;

        // ── 3. Payment breakdown by joining payment_methods ───────────────────
        $paymentBreakdown = OrderPayment::join('payment_methods', 'order_payments.payment_method_id', '=', 'payment_methods.id')
            ->whereIn('order_id', (clone $ordersQuery)->pluck('id'))
            ->selectRaw('payment_methods.name as name, SUM(order_payments.amount) as total')
            ->groupBy('payment_methods.id', 'payment_methods.name')
            ->pluck('total', 'name')
            ->toArray();

        // ── 4. Daily breakdown ────────────────────────────────────────────────
        $dailyBreakdown = (clone $ordersQuery)
            ->selectRaw('DATE(created_at) as date, SUM(total) as sales, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Voids / Cancelled orders summary
        $voidsQuery = Order::where('status', 'cancelled');
        $this->applyFilters($voidsQuery, $request);
        $voidsCount = (clone $voidsQuery)->count();
        $voidsTotal = (float) (clone $voidsQuery)->sum('total');

        return [
            'totalSales'             => $totalSales,
            'totalOrders'            => $totalOrders,
            'averageOrderValue'      => $averageOrderValue,
            'taxCollected'           => $taxCollected,
            'serviceChargeCollected' => $serviceChargeCollected,
            'discountsGiven'         => $discountsGiven,
            'refundsProcessed'       => $refundsProcessed,
            'netRevenue'             => $netRevenue,
            'paymentBreakdown'       => $paymentBreakdown,
            'dailyBreakdown'         => $dailyBreakdown,
            'voidsCount'             => $voidsCount,
            'voidsTotal'             => $voidsTotal
        ];
    }

    private function getSalesDaily(Request $request)
    {
        $query = Order::where('status', 'completed');
        $this->applyFilters($query, $request);

        return $query->selectRaw('DATE(created_at) as date, SUM(total) as sales, COUNT(*) as orders, SUM(tax_amount) as tax, SUM(service_charge) as service_charge')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getSalesHourly(Request $request)
    {
        $query = Order::where('status', 'completed');
        $this->applyFilters($query, $request);

        return $query->selectRaw('HOUR(created_at) as hour, SUM(total) as sales, COUNT(*) as orders')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();
    }

    private function getSalesCashier(Request $request)
    {
        $query = Order::where('orders.status', 'completed')
            ->join('users', 'orders.user_id', '=', 'users.id');
        $this->applyFilters($query, $request, 'orders');

        return $query->selectRaw('users.name as cashier, COUNT(orders.id) as orders, SUM(orders.total) as sales')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('sales')
            ->get();
    }

    private function getSalesShift(Request $request)
    {
        $query = Order::where('orders.status', 'completed')
            ->leftJoin('cash_shifts', 'orders.cash_shift_id', '=', 'cash_shifts.id');
        $this->applyFilters($query, $request, 'orders');

        return $query->selectRaw('COALESCE(CONCAT("Shift #", cash_shifts.id), "No Shift") as shift, COUNT(orders.id) as orders, SUM(orders.total) as sales')
            ->groupBy('orders.cash_shift_id')
            ->orderByDesc('sales')
            ->get();
    }

    private function getSalesPayment(Request $request)
    {
        $ordersQuery = Order::where('status', 'completed');
        $this->applyFilters($ordersQuery, $request);

        return OrderPayment::join('payment_methods', 'order_payments.payment_method_id', '=', 'payment_methods.id')
            ->whereIn('order_payments.order_id', (clone $ordersQuery)->pluck('id'))
            ->selectRaw('payment_methods.name as payment_method, COUNT(order_payments.id) as count, SUM(order_payments.amount) as total')
            ->groupBy('payment_methods.id', 'payment_methods.name')
            ->orderByDesc('total')
            ->get();
    }

    private function getSalesTax(Request $request)
    {
        $query = Order::where('status', 'completed');
        $this->applyFilters($query, $request);

        return $query->selectRaw('DATE(created_at) as date, COUNT(*) as orders, SUM(subtotal) as subtotal, SUM(tax_amount) as tax, SUM(total) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getSalesServiceCharge(Request $request)
    {
        $query = Order::where('status', 'completed');
        $this->applyFilters($query, $request);

        return $query->selectRaw('DATE(created_at) as date, COUNT(*) as orders, SUM(subtotal) as subtotal, SUM(service_charge) as service_charge, SUM(total) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getSalesDiscount(Request $request)
    {
        $query = Order::where('status', 'completed');
        $this->applyFilters($query, $request);

        return $query->selectRaw('DATE(created_at) as date, COUNT(*) as orders, SUM(subtotal) as subtotal, SUM(discount_amount) as discount, SUM(total) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getSalesRefund(Request $request)
    {
        $query = OrderReturn::where('status', 'approved');
        $this->applyFilters($query, $request);

        return $query->selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(total_amount) as refunds, refund_method')
            ->groupBy('date', 'refund_method')
            ->orderBy('date')
            ->get();
    }

    private function getSalesVoid(Request $request)
    {
        $query = Order::where('status', 'cancelled');
        $this->applyFilters($query, $request);

        return $query->selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(total) as voids, cancellation_reason')
            ->groupBy('date', 'cancellation_reason')
            ->orderBy('date')
            ->get();
    }

    private function getItemsRanking(Request $request)
    {
        $limit = $request->limit ?? 15;
        $orderDirection = $request->type === 'items_best' ? 'desc' : 'asc';

        $query = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_categories', 'menu_items.menu_category_id', '=', 'menu_categories.id')
            ->where('orders.status', 'completed');
        $this->applyFilters($query, $request, 'orders');

        return $query->selectRaw('
                menu_items.name,
                menu_categories.name as category,
                SUM(order_items.quantity) as quantity,
                SUM(order_items.total_price) as revenue
            ')
            ->groupBy('menu_items.id', 'menu_items.name', 'menu_categories.id', 'menu_categories.name')
            ->orderBy('quantity', $orderDirection)
            ->limit($limit)
            ->get();
    }

    private function getItemsSales(Request $request)
    {
        $query = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_categories', 'menu_items.menu_category_id', '=', 'menu_categories.id')
            ->where('orders.status', 'completed');
        $this->applyFilters($query, $request, 'orders');

        return $query->selectRaw('
                menu_items.name as name,
                menu_categories.name as category,
                SUM(order_items.quantity) as quantity,
                SUM(order_items.total_price) as revenue,
                AVG(order_items.unit_price) as avg_price
            ')
            ->groupBy('menu_items.id', 'menu_items.name', 'menu_categories.id', 'menu_categories.name')
            ->orderByDesc('revenue')
            ->get();
    }

    private function getItemsProfit(Request $request)
    {
        $query = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_categories', 'menu_items.menu_category_id', '=', 'menu_categories.id')
            ->where('orders.status', 'completed');
        $this->applyFilters($query, $request, 'orders');

        return $query->selectRaw('
                menu_items.name as name,
                menu_categories.name as category,
                SUM(order_items.quantity) as quantity,
                SUM(order_items.total_price) as revenue,
                SUM(order_items.total_price) * 0.65 as estimated_profit
            ')
            ->groupBy('menu_items.id', 'menu_items.name', 'menu_categories.id', 'menu_categories.name')
            ->orderByDesc('revenue')
            ->get();
    }

    private function getCategoriesSales(Request $request)
    {
        $query = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_categories', 'menu_items.menu_category_id', '=', 'menu_categories.id')
            ->where('orders.status', 'completed');
        $this->applyFilters($query, $request, 'orders');

        return $query->selectRaw('
                menu_categories.name as category,
                SUM(order_items.total_price) as revenue,
                SUM(order_items.quantity) as quantity,
                COUNT(DISTINCT orders.id) as orders_count
            ')
            ->groupBy('menu_categories.id', 'menu_categories.name')
            ->orderByDesc('revenue')
            ->get();
    }

    private function getTablesSales(Request $request)
    {
        $query = Order::where('status', 'completed');
        $this->applyFilters($query, $request);

        return $query->selectRaw('
                COALESCE(table_number, "Takeaway") as table_name,
                COUNT(*) as orders_count,
                SUM(total) as revenue,
                AVG(total) as average_ticket
            ')
            ->groupBy('table_number')
            ->orderByDesc('revenue')
            ->get();
    }

    private function getTablesOccupancy(Request $request)
    {
        $query = Order::where('status', 'completed');
        $this->applyFilters($query, $request);

        return $query->selectRaw('
                COALESCE(table_number, "Takeaway") as table_name,
                COUNT(*) as orders_count,
                SUM(total) as revenue
            ')
            ->groupBy('table_number')
            ->orderByDesc('orders_count')
            ->get();
    }

    private function getShiftsSummary(Request $request)
    {
        $query = CashShift::join('users', 'cash_shifts.user_id', '=', 'users.id');
        
        if ($request->filled('date_from')) {
            $query->whereDate('cash_shifts.opened_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('cash_shifts.opened_at', '<=', $request->date_to);
        }
        if ($request->filled('user_id')) {
            $query->where('cash_shifts.user_id', $request->user_id);
        }

        return $query->selectRaw('
                cash_shifts.id,
                CONCAT("Shift #", cash_shifts.id) as shift_name,
                users.name as cashier_name,
                cash_shifts.status,
                cash_shifts.opening_cash,
                cash_shifts.counted_cash,
                cash_shifts.expected_cash,
                cash_shifts.variance,
                cash_shifts.total_orders,
                cash_shifts.total_sales,
                cash_shifts.total_refunds,
                cash_shifts.opened_at,
                cash_shifts.closed_at
            ')
            ->orderBy('cash_shifts.opened_at', 'desc')
            ->get();
    }

    private function getCashiersSummary(Request $request)
    {
        $query = Order::where('orders.status', 'completed')
            ->join('users', 'orders.user_id', '=', 'users.id');
        $this->applyFilters($query, $request, 'orders');

        $results = $query->selectRaw('
                users.id as cashier_id,
                users.name as cashier,
                COUNT(orders.id) as total_orders,
                SUM(orders.total) as total_sales,
                AVG(orders.total) as average_ticket
            ')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_sales')
            ->get();

        foreach ($results as $cashier) {
            $cashier->total_refunds = (float) OrderReturn::where('user_id', $cashier->cashier_id)
                ->where('status', 'approved')
                ->when($request->filled('date_from'), fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
                ->when($request->filled('date_to'), fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
                ->sum('total_amount');

            $cashier->total_refunds_count = OrderReturn::where('user_id', $cashier->cashier_id)
                ->where('status', 'approved')
                ->when($request->filled('date_from'), fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
                ->when($request->filled('date_to'), fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
                ->count();

            $cashier->total_voids_count = Order::where('user_id', $cashier->cashier_id)
                ->where('status', 'cancelled')
                ->when($request->filled('date_from'), fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
                ->when($request->filled('date_to'), fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
                ->count();
        }

        return $results;
    }

    /**
     * Apply date preset presets + custom filters
     */
    private function applyFilters($query, Request $request, string $tablePrefix = '')
    {
        $prefix = $tablePrefix ? $tablePrefix . '.' : '';

        // Preset Date Filter
        if ($request->filled('preset') && $request->preset !== 'custom' && $request->preset !== 'all') {
            switch ($request->preset) {
                case 'today':
                    $query->whereDate($prefix . 'created_at', today());
                    break;
                case 'yesterday':
                    $query->whereDate($prefix . 'created_at', today()->subDay());
                    break;
                case 'this_week':
                    $query->whereBetween($prefix . 'created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth($prefix . 'created_at', now()->month)
                          ->whereYear($prefix . 'created_at', now()->year);
                    break;
                default:
                    // If period / range matches daily/weekly/monthly legacy
                    if ($request->preset === 'daily') {
                        $query->whereDate($prefix . 'created_at', '>=', now()->subDay());
                    } elseif ($request->preset === 'weekly') {
                        $query->whereDate($prefix . 'created_at', '>=', now()->subWeek());
                    } elseif ($request->preset === 'monthly') {
                        $query->whereDate($prefix . 'created_at', '>=', now()->subMonth());
                    }
                    break;
            }
        } else {
            // Apply custom range if preset is 'custom' or empty but dates are filled
            if ($request->filled('date_from')) {
                $query->whereDate($prefix . 'created_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate($prefix . 'created_at', '<=', $request->date_to);
            }
        }

        // Apply cashier filter
        if ($request->filled('user_id')) {
            $query->where($prefix . 'user_id', $request->user_id);
        }

        // Apply shift filter
        if ($request->filled('cash_shift_id')) {
            $query->where($prefix . 'cash_shift_id', $request->cash_shift_id);
        }

        // Apply table filter
        if ($request->filled('table_number')) {
            $query->where($prefix . 'table_number', $request->table_number);
        }

        // Apply item filter
        if ($request->filled('menu_item_id')) {
            if ($tablePrefix === 'order_items') {
                $query->where('order_items.menu_item_id', $request->menu_item_id);
            } else {
                $query->whereHas('orderItems', function ($q) use ($request) {
                    $q->where('menu_item_id', $request->menu_item_id);
                });
            }
        }

        // Apply category filter
        if ($request->filled('menu_category_id')) {
            if ($tablePrefix === 'order_items') {
                $query->whereHas('menuItem', function ($q) use ($request) {
                    $q->where('menu_category_id', $request->menu_category_id);
                });
            } else {
                $query->whereHas('orderItems.menuItem', function ($q) use ($request) {
                    $q->where('menu_category_id', $request->menu_category_id);
                });
            }
        }

        // Apply payment method filter
        if ($request->filled('payment_method_id')) {
            if ($tablePrefix === 'order_payments') {
                $query->where('order_payments.payment_method_id', $request->payment_method_id);
            } else {
                $query->whereHas('payments', function ($q) use ($request) {
                    $q->where('payment_method_id', $request->payment_method_id);
                });
            }
        }

        return $query;
    }
}
