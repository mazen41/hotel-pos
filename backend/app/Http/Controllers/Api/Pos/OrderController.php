<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\CashShift;
use App\Models\Inventory;
use App\Models\InventoryAdjustment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OrderController extends Controller
{
    /**
     * Get all orders
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['orderItems.menuItem', 'payments.paymentMethod', 'cashShift'])
            ->where('user_id', Auth::id());

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['data' => $orders]);
    }

    /**
     * Create a new order
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'order_type' => 'required|in:dine_in,takeaway,room_service',
            'table_number' => 'nullable|string',
            'guest_name' => 'nullable|string',
            'guest_room' => 'nullable|string',
            'guest_folio_id' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        // Get current shift if available
        $currentShift = CashShift::where('user_id', Auth::id())
            ->where('status', 'open')
            ->first();

        $order = Order::create([
            'order_number' => $this->generateOrderNumber(),
            'user_id' => Auth::id(),
            'cash_shift_id' => $currentShift?->id,
            'order_type' => $request->order_type,
            'table_number' => $request->table_number,
            'guest_name' => $request->guest_name,
            'guest_room' => $request->guest_room,
            'guest_folio_id' => $request->guest_folio_id,
            'status' => 'pending',
            'subtotal' => 0,
            'tax_amount' => 0,
            'service_charge' => 0,
            'discount_amount' => 0,
            'total' => 0,
            'paid_amount' => 0,
            'change_amount' => 0,
            'notes' => $request->notes
        ]);

        return response()->json([
            'message' => 'Order created successfully',
            'data' => $order->load('orderItems.menuItem', 'payments.paymentMethod', 'cashShift')
        ], 201);
    }

    /**
     * Get a specific order
     */
    public function show(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        $order->load(['orderItems.menuItem', 'payments.paymentMethod', 'cashShift']);

        return response()->json(['data' => $order]);
    }

    /**
     * Update order details
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        $request->validate([
            'order_type' => 'sometimes|in:dine_in,takeaway,room_service',
            'table_number' => 'nullable|string',
            'guest_name' => 'nullable|string',
            'guest_room' => 'nullable|string',
            'guest_folio_id' => 'nullable|string',
            'notes' => 'nullable|string',
            'discount_amount' => 'sometimes|numeric|min:0'
        ]);

        $order->update($request->only([
            'order_type', 'table_number', 'guest_name', 'guest_room', 
            'guest_folio_id', 'notes', 'discount_amount'
        ]));

        // Recalculate totals
        $this->recalculateOrderTotals($order);

        return response()->json([
            'message' => 'Order updated successfully',
            'data' => $order->load('orderItems.menuItem', 'payments.paymentMethod', 'cashShift')
        ]);
    }

    /**
     * Delete an order
     */
    public function destroy(Order $order): JsonResponse
    {
        $this->authorize('delete', $order);

        if ($order->status === 'completed') {
            return response()->json([
                'message' => 'Cannot delete completed orders'
            ], 400);
        }

        $order->delete();

        return response()->json([
            'message' => 'Order deleted successfully'
        ]);
    }

    /**
     * Add item to order
     */
    public function addItem(Request $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0'
        ]);

        $menuItem = \App\Models\MenuItem::where('is_active', true)->findOrFail($request->menu_item_id);
        $price = $request->price ?? $menuItem->price;

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $request->menu_item_id,
            'quantity' => $request->quantity,
            'unit_price' => $price,
            'total_price' => $price * $request->quantity,
            'notes' => $request->notes
        ]);

        // Recalculate order totals
        $this->recalculateOrderTotals($order);

        return response()->json([
            'message' => 'Item added to order successfully',
            'data' => $order->fresh()->load('orderItems.menuItem', 'payments.paymentMethod', 'cashShift')
        ], 201);
    }

    /**
     * Update item in order
     */
    public function updateItem(Request $request, Order $order, OrderItem $item): JsonResponse
    {
        $this->authorize('update', $order);

        if ($item->order_id !== $order->id) {
            return response()->json([
                'message' => 'Item does not belong to this order'
            ], 400);
        }

        $request->validate([
            'quantity' => 'sometimes|integer|min:1',
            'notes' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0'
        ]);

        if ($request->has('quantity')) {
            $item->quantity = $request->quantity;
        }

        if ($request->has('price')) {
            $item->unit_price = $request->price;
        }

        if ($request->has('notes')) {
            $item->notes = $request->notes;
        }

        $item->total_price = $item->unit_price * $item->quantity;
        $item->save();

        // Recalculate order totals
        $this->recalculateOrderTotals($order);

        return response()->json([
            'message' => 'Item updated successfully',
            'data' => $order->fresh()->load('orderItems.menuItem', 'payments.paymentMethod', 'cashShift')
        ]);
    }

    /**
     * Delete item from order
     */
    public function deleteItem(Order $order, OrderItem $item): JsonResponse
    {
        $this->authorize('update', $order);

        if ($item->order_id !== $order->id) {
            return response()->json([
                'message' => 'Item does not belong to this order'
            ], 400);
        }

        $item->delete();

        // Recalculate order totals
        $this->recalculateOrderTotals($order);

        return response()->json([
            'message' => 'Item removed from order successfully',
            'data' => $order->fresh()->load('orderItems.menuItem', 'payments.paymentMethod', 'cashShift')
        ]);
    }

    /**
     * Add payment to order
     */
    public function addPayment(Request $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        $request->validate([
            'payment_method_id' => 'required|exists:payment_methods,id',
            'amount' => 'required|numeric|min:0.01',
            'reference_number' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($request->amount > ((float) $order->total - (float) $order->paid_amount)) {
            return response()->json([
                'message' => 'Payment amount exceeds remaining balance'
            ], 400);
        }

        $payment = OrderPayment::create([
            'order_id' => $order->id,
            'payment_method_id' => $request->payment_method_id,
            'amount' => $request->amount,
            'reference_number' => $request->reference_number,
            'notes' => $request->notes,
        ]);

        // Update order paid amount
        $order->paid_amount = (float) $order->paid_amount + (float) $request->amount;
        $order->change_amount = max(0, (float) $order->paid_amount - (float) $order->total);
        $order->save();

        return response()->json([
            'message' => 'Payment added successfully',
            'data' => $order->fresh()->load('orderItems.menuItem', 'payments.paymentMethod', 'cashShift')
        ], 201);
    }

    /**
     * Complete an order
     */
    public function complete(Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        if ($order->status === 'completed') {
            return response()->json([
                'message' => 'Order is already completed'
            ], 400);
        }

        // Allow completion for paid orders or pending_payment (guest checkout)
        if ($order->paid_amount < $order->total && $order->status !== 'pending_payment') {
            return response()->json([
                'message' => 'Cannot complete order with unpaid balance'
            ], 400);
        }

        DB::transaction(function () use ($order) {
            $order->update([
                'status' => 'completed',
                'completed_at' => now()
            ]);

            // Update table status to available if this order has a table
            if ($order->table_id) {
                $table = $order->table;
                if ($table) {
                    $table->update(['status' => 'available']);
                }
            }

            // Deduct inventory for menu items
            foreach ($order->orderItems as $item) {
                $this->deductInventoryForMenuItem($item);
            }
        });

        return response()->json([
            'message' => 'Order completed successfully',
            'data' => $order->fresh()->load('orderItems.menuItem', 'payments.paymentMethod', 'cashShift', 'table')
        ]);
    }

    /**
     * Cancel an order
     */
    public function cancel(Request $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        if ($order->status === 'completed') {
            return response()->json([
                'message' => 'Cannot cancel completed orders'
            ], 400);
        }

        if ($order->status === 'cancelled') {
            return response()->json([
                'message' => 'Order is already cancelled'
            ], 400);
        }

        $request->validate([
            'reason' => 'required|string'
        ]);

        $order->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $request->reason
        ]);

        return response()->json([
            'message' => 'Order cancelled successfully',
            'data' => $order
        ]);
    }

    /**
     * Generate unique order number
     */
    private function generateOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $lastOrder = Order::where('order_number', 'like', "ORD-{$date}%")
            ->orderBy('order_number', 'desc')
            ->first();

        if ($lastOrder) {
            $lastNumber = (int) substr($lastOrder->order_number, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return "ORD-{$date}-{$newNumber}";
    }

    /**
     * Recalculate order totals
     */
    private function recalculateOrderTotals(Order $order): void
    {
        $subtotal = $order->orderItems()->sum('total_price');
        
        // Get POS settings for tax and service charge
        $settings = \App\Models\PosSetting::first();

        // Respect enabled/disabled flags — zero out if disabled
        $taxRate = ($settings?->tax_enabled ?? true) ? ($settings?->tax_percentage ?? 0) : 0;
        $serviceChargeRate = ($settings?->service_charge_enabled ?? false) ? ($settings?->service_charge_percentage ?? 0) : 0;

        $taxAmount = $subtotal * ($taxRate / 100);
        $serviceCharge = $subtotal * ($serviceChargeRate / 100);
        $total = $subtotal + $taxAmount + $serviceCharge - $order->discount_amount;

        $order->update([
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'service_charge' => $serviceCharge,
            'total' => $total
        ]);
    }

    /**
     * Deduct inventory for menu item
     */
    private function deductInventoryForMenuItem(OrderItem $item): void
    {
        $menuItem = $item->menuItem;
        if (!$menuItem) return;
        if (!Schema::hasTable('menu_item_inventory')) return;

        foreach ($menuItem->inventory as $inventory) {
            if (!$inventory) continue;

            $quantityNeeded = $inventory->pivot->quantity * $item->quantity;
            
            if ($inventory->current_stock >= $quantityNeeded) {
                $inventory->current_stock -= $quantityNeeded;
                $inventory->save();

                // Create inventory adjustment record
                InventoryAdjustment::create([
                    'inventory_id' => $inventory->id,
                    'user_id' => Auth::id(),
                    'adjustment_type' => 'sale',
                    'quantity' => $quantityNeeded,
                    'previous_stock' => $inventory->current_stock + $quantityNeeded,
                    'new_stock' => $inventory->current_stock,
                    'reason' => "Order #{$item->order_id} - {$menuItem->name}",
                    'order_id' => $item->order_id
                ]);
            }
        }
    }
}
