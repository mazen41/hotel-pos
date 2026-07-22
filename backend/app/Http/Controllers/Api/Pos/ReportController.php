<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\OrderPayment;
use App\Models\CashShift;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get sales report
     */
    public function sales(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'dateRange' => 'nullable|in:daily,weekly,monthly'
        ]);

        $query = Order::where('status', 'completed');

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Handle dateRange preset
        if ($request->dateRange) {
            $query = $this->applyDateRangeFilter($query, $request->dateRange);
        }

        $orders = $query->get();

        $totalSales = $orders->sum('total');
        $totalOrders = $orders->count();
        $averageOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;
        $taxCollected = $orders->sum('tax_amount');
        $serviceChargeCollected = $orders->sum('service_charge');
        $discountsGiven = $orders->sum('discount_amount');

        // Get refunds
        $refundQuery = OrderReturn::where('status', 'approved');
        
        if ($request->has('date_from')) {
            $refundQuery->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $refundQuery->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->dateRange) {
            $date = $this->getDateForRange($request->dateRange);
            $refundQuery->whereDate('created_at', '>=', $date);
        }

        $refunds = $refundQuery->sum('total_amount');

        $netRevenue = $totalSales - $refunds;

        // Payment breakdown
        $paymentBreakdown = OrderPayment::whereIn('order_id', $orders->pluck('id'))
            ->selectRaw('payment_method, SUM(amount) as total')
            ->groupBy('payment_method')
            ->pluck('total', 'payment_method');

        // Daily breakdown
        $dailyQuery = Order::where('status', 'completed');
        
        if ($request->has('date_from')) {
            $dailyQuery->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $dailyQuery->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->dateRange) {
            $date = $this->getDateForRange($request->dateRange);
            $dailyQuery->whereDate('created_at', '>=', $date);
        }

        $dailyBreakdown = $dailyQuery->selectRaw('DATE(created_at) as date, SUM(total) as sales, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'data' => [
                'totalSales' => $totalSales,
                'totalOrders' => $totalOrders,
                'averageOrderValue' => $averageOrderValue,
                'taxCollected' => $taxCollected,
                'serviceChargeCollected' => $serviceChargeCollected,
                'discountsGiven' => $discountsGiven,
                'refundsProcessed' => $refunds,
                'netRevenue' => $netRevenue,
                'paymentBreakdown' => $paymentBreakdown,
                'dailyBreakdown' => $dailyBreakdown
            ]
        ]);
    }

    /**
     * Get revenue by category
     */
    public function revenueByCategory(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'dateRange' => 'nullable|in:daily,weekly,monthly'
        ]);

        $query = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_categories', 'menu_items.menu_category_id', '=', 'menu_categories.id')
            ->where('orders.status', 'completed');

        if ($request->has('date_from')) {
            $query->whereDate('orders.created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('orders.created_at', '<=', $request->date_to);
        }

        if ($request->dateRange) {
            $query = $this->applyDateRangeFilter($query, $request->dateRange);
        }

        $revenueByCategory = $query->selectRaw('
                menu_categories.name as category,
                SUM(order_items.total_price) as revenue,
                COUNT(DISTINCT orders.id) as orders
            ')
            ->groupBy('menu_categories.id', 'menu_categories.name')
            ->orderByDesc('revenue')
            ->get();

        $totalRevenue = $revenueByCategory->sum('revenue');

        $revenueByCategory = $revenueByCategory->map(function ($item) use ($totalRevenue) {
            $item->percentage = $totalRevenue > 0 ? ($item->revenue / $totalRevenue) * 100 : 0;
            return $item;
        });

        return response()->json(['data' => $revenueByCategory]);
    }

    /**
     * Get best sellers
     */
    public function bestSellers(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'dateRange' => 'nullable|in:daily,weekly,monthly',
            'limit' => 'nullable|integer|min:1|max:50'
        ]);

        $limit = $request->limit ?? 10;

        $query = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->where('orders.status', 'completed');

        if ($request->has('date_from')) {
            $query->whereDate('orders.created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('orders.created_at', '<=', $request->date_to);
        }

        if ($request->dateRange) {
            $query = $this->applyDateRangeFilter($query, $request->dateRange);
        }

        $bestSellers = $query->selectRaw('
                menu_items.name,
                menu_items.menu_category_id as category,
                SUM(order_items.quantity) as quantity,
                SUM(order_items.total_price) as revenue,
                AVG(order_items.unit_price) as average_price
            ')
            ->groupBy('menu_items.id', 'menu_items.name', 'menu_items.menu_category_id')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get();

        return response()->json(['data' => $bestSellers]);
    }

    /**
     * Get cashier performance
     */
    public function cashierPerformance(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'dateRange' => 'nullable|in:daily,weekly,monthly'
        ]);

        $query = Order::where('status', 'completed');

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->dateRange) {
            $query = $this->applyDateRangeFilter($query, $request->dateRange);
        }

        $cashierPerformance = $query->selectRaw('
                user_id,
                users.name as cashier,
                COUNT(*) as total_orders,
                SUM(total) as total_sales,
                AVG(total) as average_order_value
            ')
            ->join('users', 'orders.user_id', '=', 'users.id')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_sales')
            ->get();

        // Add refunds and voids for each cashier
        foreach ($cashierPerformance as $cashier) {
            $refunds = OrderReturn::where('user_id', $cashier->user_id)
                ->where('status', 'approved')
                ->when($request->has('date_from'), fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
                ->when($request->has('date_to'), fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
                ->when($request->dateRange, fn($q) => $this->applyDateRangeFilter($q, $request->dateRange))
                ->count();

            $voids = Order::where('user_id', $cashier->user_id)
                ->where('status', 'cancelled')
                ->when($request->has('date_from'), fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
                ->when($request->has('date_to'), fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
                ->when($request->dateRange, fn($q) => $this->applyDateRangeFilter($q, $request->dateRange))
                ->count();

            $cashier->refunds = $refunds;
            $cashier->voids = $voids;
        }

        return response()->json(['data' => $cashierPerformance]);
    }

    /**
     * Get refunds report
     */
    public function refunds(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'dateRange' => 'nullable|in:daily,weekly,monthly'
        ]);

        $query = OrderReturn::where('status', 'approved');

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->dateRange) {
            $query = $this->applyDateRangeFilter($query, $request->dateRange);
        }

        $totalRefunds = $query->count();
        $totalAmount = $query->sum('total_amount');

        // Refund by method
        $refundByMethod = $query->selectRaw('refund_method, SUM(total_amount) as total')
            ->groupBy('refund_method')
            ->pluck('total', 'refund_method');

        // Refund by reason
        $refundByReason = $query->selectRaw('reason, COUNT(*) as count, SUM(total_amount) as total')
            ->groupBy('reason')
            ->get();

        // Top refunded items
        $topRefundedItems = OrderReturnItem::join('order_returns', 'order_return_items.return_id', '=', 'order_returns.id')
            ->join('order_items', 'order_return_items.order_item_id', '=', 'order_items.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->where('order_returns.status', 'approved')
            ->when($request->has('date_from'), fn($q) => $q->whereDate('order_returns.created_at', '>=', $request->date_from))
            ->when($request->has('date_to'), fn($q) => $q->whereDate('order_returns.created_at', '<=', $request->date_to))
            ->when($request->dateRange, fn($q) => $this->applyDateRangeFilter($q, $request->dateRange))
            ->selectRaw('
                menu_items.name as item_name,
                SUM(order_return_items.quantity) as refund_count,
                SUM(order_return_items.total_price) as refund_amount
            ')
            ->groupBy('menu_items.id', 'menu_items.name')
            ->orderByDesc('refund_amount')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                'total_refunds' => $totalRefunds,
                'total_amount' => $totalAmount,
                'refund_by_method' => $refundByMethod,
                'refund_by_reason' => $refundByReason,
                'top_refunded_items' => $topRefundedItems
            ]
        ]);
    }

    /**
     * Get date for range preset
     */
    private function getDateForRange(string $dateRange)
    {
        switch ($dateRange) {
            case 'daily':
                return now()->subDay();
            case 'weekly':
                return now()->subWeek();
            case 'monthly':
                return now()->subMonth();
            default:
                return now();
        }
    }

    /**
     * Apply date range filter to query
     */
    private function applyDateRangeFilter($query, string $dateRange)
    {
        $date = $this->getDateForRange($dateRange);
        return $query->whereDate('created_at', '>=', $date);
    }
}
