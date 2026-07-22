<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\OrderReturn;
use App\Models\OrderReturnItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PosSetting;
use App\Models\InventoryAdjustment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReturnController extends Controller
{
    /**
     * Get all returns
     */
    public function index(Request $request): JsonResponse
    {
        $query = OrderReturn::with(['order', 'items.orderItem.menuItem', 'approvedBy']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $returns = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['data' => $returns]);
    }

    /**
     * Create a new return request
     */
    public function create(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'items' => 'required|array',
            'items.*.order_item_id' => 'required|exists:order_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'reason' => 'required|string',
            'refund_method' => 'required|in:cash,card,room_charge,original_payment'
        ]);

        $order = Order::findOrFail($request->order_id);

        if ($order->status !== 'completed') {
            return response()->json([
                'message' => 'Can only return items from completed orders'
            ], 400);
        }

        // Calculate total refund amount
        $totalAmount = 0;
        $returnItems = [];

        foreach ($request->items as $item) {
            $orderItem = OrderItem::findOrFail($item['order_item_id']);
            
            if ($orderItem->order_id !== $order->id) {
                return response()->json([
                    'message' => 'Item does not belong to this order'
                ], 400);
            }

            if ($item['quantity'] > $orderItem->quantity) {
                return response()->json([
                    'message' => 'Cannot return more than ordered quantity'
                ], 400);
            }

            $itemTotal = $orderItem->unit_price * $item['quantity'];
            $totalAmount += $itemTotal;

            $returnItems[] = [
                'order_item_id' => $orderItem->id,
                'quantity' => $item['quantity'],
                'unit_price' => $orderItem->unit_price,
                'total_price' => $itemTotal
            ];
        }

        // Check auto-approval threshold
        $settings = PosSetting::first();
        $autoApprove = $settings && $totalAmount <= $settings->auto_approve_return_threshold;

        DB::transaction(function () use ($order, $request, $totalAmount, $returnItems, $autoApprove) {
            $return = OrderReturn::create([
                'return_number' => $this->generateReturnNumber(),
                'order_id' => $order->id,
                'user_id' => Auth::id(),
                'status' => $autoApprove ? 'approved' : 'pending',
                'total_amount' => $totalAmount,
                'refund_method' => $request->refund_method,
                'reason' => $request->reason,
                'approved_at' => $autoApprove ? now() : null,
                'approved_by' => $autoApprove ? Auth::id() : null
            ]);

            foreach ($returnItems as $item) {
                OrderReturnItem::create([
                    'return_id' => $return->id,
                    'order_item_id' => $item['order_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price']
                ]);
            }

            // If auto-approved, process the refund
            if ($autoApprove) {
                $this->processRefund($return);
            }
        });

        return response()->json([
            'message' => 'Return request created successfully',
            'data' => OrderReturn::with(['items.orderItem.menuItem'])->latest()->first()
        ], 201);
    }

    /**
     * Get a specific return
     */
    public function show(OrderReturn $return): JsonResponse
    {
        $return->load(['order', 'items.orderItem.menuItem', 'approvedBy']);

        return response()->json(['data' => $return]);
    }

    /**
     * Approve a return request
     */
    public function approve(OrderReturn $return): JsonResponse
    {
        if ($return->status !== 'pending') {
            return response()->json([
                'message' => 'Return is not in pending status'
            ], 400);
        }

        DB::transaction(function () use ($return) {
            $return->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => Auth::id()
            ]);

            $this->processRefund($return);
        });

        return response()->json([
            'message' => 'Return approved successfully',
            'data' => $return->load('items.orderItem.menuItem')
        ]);
    }

    /**
     * Reject a return request
     */
    public function reject(Request $request, OrderReturn $return): JsonResponse
    {
        if ($return->status !== 'pending') {
            return response()->json([
                'message' => 'Return is not in pending status'
            ], 400);
        }

        $request->validate([
            'reason' => 'required|string'
        ]);

        $return->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejection_reason' => $request->reason
        ]);

        return response()->json([
            'message' => 'Return rejected successfully',
            'data' => $return
        ]);
    }

    /**
     * Generate unique return number
     */
    private function generateReturnNumber(): string
    {
        $date = now()->format('Ymd');
        $lastReturn = OrderReturn::where('return_number', 'like', "RET-{$date}%")
            ->orderBy('return_number', 'desc')
            ->first();

        if ($lastReturn) {
            $lastNumber = (int) substr($lastReturn->return_number, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return "RET-{$date}-{$newNumber}";
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
     * Process refund for approved return
     */
    private function processRefund(OrderReturn $return): void
    {
        // Update order status if fully refunded
        $order = $return->order;
        $totalRefunded = OrderReturn::where('order_id', $order->id)
            ->where('status', 'approved')
            ->sum('total_amount');

        if ($totalRefunded >= $order->total) {
            $order->update([
                'status' => 'refunded',
                'refunded_at' => now(),
                'refund_reason' => 'Full refund processed'
            ]);
        }

        // Restore inventory for returned items
        foreach ($return->items as $returnItem) {
            $orderItem = $returnItem->orderItem;
            if (!$orderItem) continue;

            $menuItem = $orderItem->menuItem;
            if (!$menuItem) continue;

            foreach ($menuItem->inventory as $inventoryItem) {
                $inventory = $inventoryItem->inventory;
                if (!$inventory) continue;

                $quantityToRestore = $inventoryItem->quantity * $returnItem->quantity;
                
                $inventory->current_stock += $quantityToRestore;
                $inventory->save();

                // Create inventory adjustment record
                InventoryAdjustment::create([
                    'inventory_id' => $inventory->id,
                    'user_id' => Auth::id(),
                    'adjustment_type' => 'return',
                    'quantity' => $quantityToRestore,
                    'previous_stock' => $inventory->current_stock - $quantityToRestore,
                    'new_stock' => $inventory->current_stock,
                    'reason' => "Return #{$return->return_number} - {$menuItem->name}",
                    'return_id' => $return->id
                ]);
            }
        }
    }
}
