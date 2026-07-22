<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuCategoryResource;
use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MenuCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', MenuCategory::class);
        
        $categories = MenuCategory::orderBy('sort_order')->get();
        return response()->json([
            'data' => MenuCategoryResource::collection($categories),
        ]);
    }

    public function show(MenuCategory $menuCategory): JsonResponse
    {
        $this->authorize('view', MenuCategory::class);
        
        return response()->json([
            'data' => new MenuCategoryResource($menuCategory),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', MenuCategory::class);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sort_order' => 'integer|default:0',
            'is_active' => 'boolean|default:true',
            'image_url' => 'nullable|url',
        ]);

        $category = MenuCategory::create($validated);
        
        return response()->json([
            'message' => 'Menu category created successfully',
            'data' => new MenuCategoryResource($category),
        ], 201);
    }

    public function update(Request $request, MenuCategory $menuCategory): JsonResponse
    {
        $this->authorize('update', MenuCategory::class);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'sort_order' => 'sometimes|integer',
            'is_active' => 'sometimes|boolean',
            'image_url' => 'nullable|url',
        ]);

        $menuCategory->update($validated);
        
        return response()->json([
            'message' => 'Menu category updated successfully',
            'data' => new MenuCategoryResource($menuCategory->fresh()),
        ]);
    }

    public function destroy(MenuCategory $menuCategory): JsonResponse
    {
        $this->authorize('delete', MenuCategory::class);
        
        $menuCategory->delete();
        
        return response()->json([
            'message' => 'Menu category deleted successfully',
        ]);
    }
}
