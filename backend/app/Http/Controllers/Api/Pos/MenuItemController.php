<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MenuItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('pos.view');

        $query = MenuItem::query()->with('category')->orderBy('sort_order');

        if ($request->filled('menu_category_id')) {
            $query->where('menu_category_id', $request->query('menu_category_id'));
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function show(MenuItem $menuItem): JsonResponse
    {
        $this->authorize('pos.view');

        return response()->json([
            'data' => $menuItem->load('category'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('pos.manage_menu');

        $validated = $request->validate([
            'menu_category_id' => 'required|exists:menu_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|url',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'modifiers' => 'nullable|array',
            'track_inventory' => 'boolean',
            'preparation_time_minutes' => 'integer|min:0',
        ]);

        $menuItem = MenuItem::create($validated);

        return response()->json([
            'message' => 'Menu item created successfully',
            'data' => $menuItem->load('category'),
        ], 201);
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $this->authorize('pos.manage_menu');

        $validated = $request->validate([
            'menu_category_id' => 'sometimes|exists:menu_categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|url',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
            'modifiers' => 'nullable|array',
            'track_inventory' => 'sometimes|boolean',
            'preparation_time_minutes' => 'sometimes|integer|min:0',
        ]);

        $menuItem->update($validated);

        return response()->json([
            'message' => 'Menu item updated successfully',
            'data' => $menuItem->fresh()->load('category'),
        ]);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $this->authorize('pos.manage_menu');

        $menuItem->delete();

        return response()->json([
            'message' => 'Menu item deleted successfully',
        ]);
    }
}
