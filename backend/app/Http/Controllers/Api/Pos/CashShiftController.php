<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\CashShift;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CashShiftController extends Controller
{
    /**
     * Get all cash shifts for the authenticated user
     */
    public function index(): JsonResponse
    {
        $shifts = CashShift::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $shifts]);
    }

    /**
     * Get the current active shift for the authenticated user
     */
    public function getCurrent(): JsonResponse
    {
        $currentShift = CashShift::where('user_id', Auth::id())
            ->where('status', 'open')
            ->first();

        return response()->json(['data' => $currentShift]);
    }

    /**
     * Open a new cash shift
     */
    public function open(Request $request): JsonResponse
    {
        $request->validate([
            'opening_cash' => 'required|numeric|min:0'
        ]);

        // Check if user already has an open shift
        $existingShift = CashShift::where('user_id', Auth::id())
            ->where('status', 'open')
            ->first();

        if ($existingShift) {
            return response()->json([
                'message' => 'You already have an open shift',
                'data' => $existingShift
            ], 400);
        }

        $shift = CashShift::create([
            'user_id' => Auth::id(),
            'status' => 'open',
            'opening_cash' => $request->opening_cash,
            'expected_cash' => $request->opening_cash,
            'opened_at' => now(),
            'total_orders' => 0,
            'total_sales' => 0,
            'payment_breakdown' => []
        ]);

        return response()->json([
            'message' => 'Cash shift opened successfully',
            'data' => $shift
        ], 201);
    }

    /**
     * Get a specific cash shift
     */
    public function show(CashShift $cashShift): JsonResponse
    {
        $this->authorize('view', $cashShift);

        $cashShift->load('orders');

        return response()->json(['data' => $cashShift]);
    }

    /**
     * Close a cash shift
     */
    public function close(Request $request, CashShift $cashShift): JsonResponse
    {
        $this->authorize('update', $cashShift);

        $request->validate([
            'counted_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        if ($cashShift->status !== 'open') {
            return response()->json([
                'message' => 'This shift is already closed'
            ], 400);
        }

        // Calculate totals from orders
        $orders = Order::where('cash_shift_id', $cashShift->id)
            ->where('status', '!=', 'cancelled')
            ->get();

        $totalSales = $orders->sum('total');
        $totalOrders = $orders->count();

        // Calculate variance
        $variance = $request->counted_cash - $cashShift->opening_cash - $totalSales;

        $cashShift->update([
            'status' => 'closed',
            'counted_cash' => $request->counted_cash,
            'variance' => $variance,
            'closed_at' => now(),
            'closing_notes' => $request->notes,
            'total_orders' => $totalOrders,
            'total_sales' => $totalSales,
            'payment_breakdown' => $this->calculatePaymentBreakdown($orders)
        ]);

        return response()->json([
            'message' => 'Cash shift closed successfully',
            'data' => $cashShift
        ]);
    }

    /**
     * Calculate payment breakdown for a shift
     */
    private function calculatePaymentBreakdown($orders): array
    {
        $breakdown = [];

        foreach ($orders as $order) {
            foreach ($order->payments as $payment) {
                $method = $payment->payment_method ?? 'cash';
                if (!isset($breakdown[$method])) {
                    $breakdown[$method] = 0;
                }
                $breakdown[$method] += $payment->amount;
            }
        }

        return $breakdown;
    }
}
