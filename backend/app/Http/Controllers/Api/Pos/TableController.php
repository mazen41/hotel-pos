<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\Table;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TableController extends Controller
{
    /**
     * Get all tables
     */
    public function index(Request $request): JsonResponse
    {
        $query = Table::with('activeOrder');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $tables = $query->orderBy('number')->get();

        return response()->json(['data' => $tables]);
    }

    /**
     * Get a specific table
     */
    public function show(Table $table): JsonResponse
    {
        $table->load('activeOrder.orderItems.menuItem', 'activeOrder.payments.paymentMethod');

        return response()->json(['data' => $table]);
    }

    /**
     * Create a new table
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'number' => 'required|string|unique:tables,number',
            'name' => 'nullable|string',
            'capacity' => 'nullable|integer|min:1',
            'location' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        $table = Table::create([
            'number' => $request->number,
            'name' => $request->name,
            'capacity' => $request->capacity ?? 4,
            'status' => 'available',
            'location' => $request->location,
            'notes' => $request->notes
        ]);

        return response()->json([
            'message' => 'Table created successfully',
            'data' => $table
        ], 201);
    }

    /**
     * Update table details
     */
    public function update(Request $request, Table $table): JsonResponse
    {
        $request->validate([
            'number' => 'sometimes|string|unique:tables,number,' . $table->id,
            'name' => 'nullable|string',
            'capacity' => 'nullable|integer|min:1',
            'status' => 'sometimes|in:available,occupied,pending_payment,reserved,needs_cleaning',
            'location' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        $table->update($request->only([
            'number', 'name', 'capacity', 'status', 'location', 'notes'
        ]));

        return response()->json([
            'message' => 'Table updated successfully',
            'data' => $table->load('activeOrder')
        ]);
    }

    /**
     * Delete a table
     */
    public function destroy(Table $table): JsonResponse
    {
        if ($table->status === 'occupied' || $table->status === 'pending_payment') {
            return response()->json([
                'message' => 'Cannot delete tables that are occupied or have pending payments'
            ], 400);
        }

        $table->delete();

        return response()->json([
            'message' => 'Table deleted successfully'
        ]);
    }

    /**
     * Update table status
     */
    public function updateStatus(Request $request, Table $table): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:available,occupied,pending_payment,reserved,needs_cleaning'
        ]);

        $table->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Table status updated successfully',
            'data' => $table
        ]);
    }

    /**
     * Get or create order for table
     */
    public function getOrCreateOrder(Table $table): JsonResponse
    {
        $order = $table->activeOrder;

        if (!$order) {
            $currentShift = \App\Models\CashShift::where('user_id', Auth::id())
                ->where('status', 'open')
                ->first();

            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'user_id' => Auth::id(),
                'cash_shift_id' => $currentShift?->id,
                'table_id' => $table->id,
                'table_number' => $table->number,
                'order_type' => 'dine_in',
                'status' => 'pending',
                'subtotal' => 0,
                'tax_amount' => 0,
                'service_charge' => 0,
                'discount_amount' => 0,
                'total' => 0,
                'paid_amount' => 0,
                'change_amount' => 0,
            ]);

            $table->update(['status' => 'occupied']);
        }

        return response()->json([
            'data' => $order->load('orderItems.menuItem', 'payments.paymentMethod', 'table')
        ]);
    }

    /**
     * Complete order for table
     */
    public function completeOrder(Table $table): JsonResponse
    {
        $order = $table->activeOrder;

        if (!$order) {
            return response()->json([
                'message' => 'No active order for this table'
            ], 400);
        }

        // Complete the order using the OrderController
        $orderController = new OrderController();
        $response = $orderController->complete($order);

        // If order completed successfully, update table status
        if ($response->getStatusCode() === 200) {
            $table->update(['status' => 'available']);
        }

        return $response;
    }

    /**
     * Generate unique order number
     */
    private function generateOrderNumber(): string
    {
        return 'ORD-' . str_pad(Order::max('id') + 1, 6, '0', STR_PAD_LEFT);
    }
}
