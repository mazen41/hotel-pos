<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\CashShift;
use App\Models\Order;
use App\Models\OrderReturn;
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

        if ($currentShift) {
            $currentShift->setAttribute('summary', $this->getShiftSummary($currentShift));
        }

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

        if ($shift) {
            $shift->setAttribute('summary', $this->getShiftSummary($shift));
        }

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

        $cashShift->setAttribute('summary', $this->getShiftSummary($cashShift));

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

        // Validate no active or unpaid orders remain
        $activeOrders = Order::where('cash_shift_id', $cashShift->id)
            ->whereIn('status', ['pending', 'processing', 'pending_payment'])
            ->get();

        if ($activeOrders->count() > 0) {
            return response()->json([
                'message'      => 'Cannot close shift: ' . $activeOrders->count() . ' active or unpaid order(s) still open. Please complete or cancel all orders before closing the shift.',
                'active_orders' => $activeOrders->pluck('order_number'),
            ], 400);
        }

        // Validate no pending returns remain unresolved for orders that belong to this shift
        $pendingReturns = OrderReturn::whereHas('order', function ($query) use ($cashShift) {
            $query->where('cash_shift_id', $cashShift->id);
        })
            ->where('status', 'pending')
            ->get();

        if ($pendingReturns->count() > 0) {
            return response()->json([
                'message' => 'Cannot close shift: ' . $pendingReturns->count() . ' return(s) still pending approval. Please approve or reject them before closing the shift.',
                'pending_returns' => $pendingReturns->pluck('return_number'),
            ], 400);
        }

        // Calculate all summary metrics using helper
        $summary = $this->getShiftSummary($cashShift);

        $variance = (float) $request->counted_cash - $summary['expected_cash'];

        $cashShift->update([
            'status'            => 'closed',
            'counted_cash'      => $request->counted_cash,
            'expected_cash'     => $summary['expected_cash'],
            'variance'          => $variance,
            'closed_at'         => now(),
            'closing_notes'     => $request->notes,
            'total_orders'      => $summary['total_orders'],
            'total_sales'       => $summary['total_sales'],
            'total_refunds'     => $summary['total_refunds'],
            'payment_breakdown' => $summary['payment_breakdown'],
        ]);

        $freshShift = $cashShift->fresh();
        $freshShift->setAttribute('summary', $this->getShiftSummary($freshShift));

        return response()->json([
            'message' => 'Cash shift closed successfully',
            'data'    => $freshShift,
        ]);
    }

    /**
     * Calculate comprehensive summary metrics for a cash shift.
     *
     * All values are derived directly from the database records belonging
     * to this shift — no manual input from the cashier.
     *
     * Expected Cash formula:
     *   Opening Cash + Cash Sales − Cash Refunds − Cash collected for Voided/Cancelled Orders
     */
    private function getShiftSummary(CashShift $cashShift): array
    {
        // ── 1. Revenue orders (non-cancelled) ─────────────────────────────────
        $orders = Order::with('payments.paymentMethod')
            ->where('cash_shift_id', $cashShift->id)
            ->where('status', '!=', 'cancelled')
            ->get();

        $totalOrders        = $orders->count();
        $grossSales         = (float) $orders->sum('subtotal');         // pre-tax/service
        $totalTax           = (float) $orders->sum('tax_amount');
        $totalServiceCharge = (float) $orders->sum('service_charge');
        $totalDiscounts     = (float) $orders->sum('discount_amount');
        $totalSales         = (float) $orders->sum('total');             // final billed total

        // ── 2. Payment breakdown by method ────────────────────────────────────
        $paymentBreakdown = $this->calculatePaymentBreakdown($orders);
        $cashSales  = (float) ($paymentBreakdown['cash']  ?? 0);
        $cardSales  = (float) ($paymentBreakdown['visa/card'] ?? 0);

        // ── 3. Approved refunds linked to this shift ──────────────────────────
        $refunds = OrderReturn::where(function ($query) use ($cashShift) {
                $query->where('cash_shift_id', $cashShift->id)
                      ->orWhereHas('order', function ($q) use ($cashShift) {
                          $q->where('cash_shift_id', $cashShift->id);
                      });
            })
            ->where('status', 'approved')
            ->get();

        $totalRefunds = (float) $refunds->sum('total_amount');
        $cashRefunds  = (float) $refunds->where('refund_method', 'cash')->sum('total_amount');

        // ── 4. Cancelled / voided orders belonging to this shift ──────────────
        $cancelledOrders = Order::with('payments.paymentMethod')
            ->where('cash_shift_id', $cashShift->id)
            ->where('status', 'cancelled')
            ->get();

        $deletedOrdersCount = $cancelledOrders->count();
        $deletedOrdersTotal = (float) $cancelledOrders->sum('total');

        // Cash that was actually collected for cancelled orders
        // (must be physically returned to the customer from the drawer)
        $cancelledBreakdown = $this->calculatePaymentBreakdown($cancelledOrders);
        $cashVoids = (float) ($cancelledBreakdown['cash'] ?? 0);

        // ── 5. Expected cash in drawer ────────────────────────────────────────
        // Opening Cash + Cash Sales − Cash Refunds − Cash collected for Voided Orders
        $expectedCash = (float) $cashShift->opening_cash + $cashSales - $cashRefunds - $cashVoids;

        return [
            // Counts
            'total_orders'          => $totalOrders,

            // Sales breakdown
            'gross_sales'           => $grossSales,
            'total_tax'             => $totalTax,
            'total_service_charge'  => $totalServiceCharge,
            'total_discounts'       => $totalDiscounts,
            'total_sales'           => $totalSales,

            // Payment methods
            'cash_sales'            => $cashSales,
            'card_sales'            => $cardSales,
            'payment_breakdown'     => $paymentBreakdown,

            // Refunds
            'total_refunds'         => $totalRefunds,
            'cash_refunds'          => $cashRefunds,

            // Voids / cancellations
            'deleted_orders_count'  => $deletedOrdersCount,
            'deleted_orders_total'  => $deletedOrdersTotal,
            'cash_voids'            => $cashVoids,

            // Cash reconciliation
            'opening_cash'          => (float) $cashShift->opening_cash,
            'expected_cash'         => $expectedCash,
        ];
    }

    /**
     * Calculate payment totals keyed by lowercase payment method name.
     * Works on any collection of orders that have their payments eager-loaded.
     */
    private function calculatePaymentBreakdown($orders): array
    {
        $breakdown = [];

        foreach ($orders as $order) {
            foreach ($order->payments as $payment) {
                $method = strtolower(optional($payment->paymentMethod)->name ?? 'unknown');

                $breakdown[$method] = ($breakdown[$method] ?? 0) + (float) $payment->amount;
            }
        }

        return $breakdown;
    }
}
