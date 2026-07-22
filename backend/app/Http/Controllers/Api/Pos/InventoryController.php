<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryAdjustment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * Get all inventory items
     */
    public function index(Request $request): JsonResponse
    {
        $query = Inventory::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('sku', 'like', '%' . $request->search . '%');
        }

        if ($request->has('low_stock')) {
            $query->whereColumn('current_stock', '<=', 'minimum_stock');
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $inventory = $query->orderBy('name')->get();

        return response()->json(['data' => $inventory]);
    }

    /**
     * Create a new inventory item
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:inventory,sku',
            'current_stock' => 'required|numeric|min:0',
            'minimum_stock' => 'required|numeric|min:0',
            'reorder_level' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'unit_cost' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'low_stock_alert' => 'boolean'
        ]);

        $inventory = Inventory::create([
            'name' => $request->name,
            'sku' => $request->sku,
            'current_stock' => $request->current_stock,
            'minimum_stock' => $request->minimum_stock,
            'reorder_level' => $request->reorder_level,
            'unit' => $request->unit,
            'unit_cost' => $request->unit_cost,
            'is_active' => $request->boolean('is_active', true),
            'low_stock_alert' => $request->boolean('low_stock_alert', true)
        ]);

        return response()->json([
            'message' => 'Inventory item created successfully',
            'data' => $inventory
        ], 201);
    }

    /**
     * Get a specific inventory item
     */
    public function show(Inventory $inventory): JsonResponse
    {
        $inventory->load(['adjustments' => function($query) {
            $query->orderBy('created_at', 'desc')->limit(10);
        }, 'menuItems']);

        return response()->json(['data' => $inventory]);
    }

    /**
     * Update an inventory item
     */
    public function update(Request $request, Inventory $inventory): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'nullable|string|max:100|unique:inventory,sku,' . $inventory->id,
            'current_stock' => 'sometimes|numeric|min:0',
            'minimum_stock' => 'sometimes|numeric|min:0',
            'reorder_level' => 'sometimes|numeric|min:0',
            'unit' => 'sometimes|string|max:50',
            'unit_cost' => 'sometimes|numeric|min:0',
            'is_active' => 'boolean',
            'low_stock_alert' => 'boolean'
        ]);

        $inventory->update($request->only([
            'name', 'sku', 'current_stock', 'minimum_stock', 'reorder_level',
            'unit', 'unit_cost', 'is_active', 'low_stock_alert'
        ]));

        return response()->json([
            'message' => 'Inventory item updated successfully',
            'data' => $inventory
        ]);
    }

    /**
     * Delete an inventory item
     */
    public function destroy(Inventory $inventory): JsonResponse
    {
        $inventory->delete();

        return response()->json([
            'message' => 'Inventory item deleted successfully'
        ]);
    }

    /**
     * Adjust inventory stock
     */
    public function adjust(Request $request, Inventory $inventory): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0',
            'adjustment_type' => 'required|in:add,remove,waste',
            'reason' => 'required|string'
        ]);

        $previousStock = $inventory->current_stock;
        $quantity = $request->quantity;

        DB::transaction(function () use ($inventory, $quantity, $request, $previousStock) {
            if ($request->adjustment_type === 'add') {
                $inventory->current_stock += $quantity;
            } else {
                if ($inventory->current_stock < $quantity) {
                    return response()->json([
                        'message' => 'Insufficient stock for this adjustment'
                    ], 400);
                }
                $inventory->current_stock -= $quantity;
            }

            $inventory->save();

            // Create adjustment record
            InventoryAdjustment::create([
                'inventory_id' => $inventory->id,
                'user_id' => Auth::id(),
                'adjustment_type' => $request->adjustment_type,
                'quantity' => $quantity,
                'previous_stock' => $previousStock,
                'new_stock' => $inventory->current_stock,
                'reason' => $request->reason
            ]);
        });

        return response()->json([
            'message' => 'Stock adjusted successfully',
            'data' => $inventory
        ]);
    }

    /**
     * Get adjustment history for an inventory item
     */
    public function adjustments(Inventory $inventory): JsonResponse
    {
        $adjustments = $inventory->adjustments()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['data' => $adjustments]);
    }
}
