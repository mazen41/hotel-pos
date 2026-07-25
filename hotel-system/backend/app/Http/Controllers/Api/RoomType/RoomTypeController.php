<?php

namespace App\Http\Controllers\Api\RoomType;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoomType\StoreRoomTypeRequest;
use App\Http\Requests\RoomType\UpdateRoomTypeRequest;
use App\Http\Resources\RoomTypeResource;
use App\Models\RoomType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomTypeController extends Controller
{
    /**
     * GET /api/room-types
     *
     * List all room types.
     */
    public function index(Request $request): JsonResponse
    {
        $query = RoomType::query();

        // Filter by active status if requested
        if ($request->has('active')) {
            $query->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Sort
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $roomTypes = $query->get();

        return response()->json([
            'data' => RoomTypeResource::collection($roomTypes),
        ]);
    }

    /**
     * POST /api/room-types
     *
     * Create a new room type.
     */
    public function store(StoreRoomTypeRequest $request): JsonResponse
    {
        $roomType = RoomType::create($request->validated());

        return response()->json([
            'message' => 'Room type created successfully.',
            'data' => new RoomTypeResource($roomType),
        ], 201);
    }

    /**
     * GET /api/room-types/{id}
     *
     * Show a single room type.
     */
    public function show(RoomType $roomType): JsonResponse
    {
        return response()->json([
            'data' => new RoomTypeResource($roomType),
        ]);
    }

    /**
     * PUT/PATCH /api/room-types/{id}
     *
     * Update a room type.
     */
    public function update(UpdateRoomTypeRequest $request, RoomType $roomType): JsonResponse
    {
        $roomType->update($request->validated());

        return response()->json([
            'message' => 'Room type updated successfully.',
            'data' => new RoomTypeResource($roomType->fresh()),
        ]);
    }

    /**
     * DELETE /api/room-types/{id}
     *
     * Delete a room type (soft delete).
     */
    public function destroy(RoomType $roomType): JsonResponse
    {
        $roomType->delete();

        return response()->json([
            'message' => 'Room type deleted successfully.',
        ]);
    }
}
