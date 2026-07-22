<?php

namespace App\Http\Controllers\Api\Room;

use App\Http\Controllers\Controller;
use App\Http\Requests\Room\StoreRoomRequest;
use App\Http\Requests\Room\UpdateRoomRequest;
use App\Http\Resources\RoomResource;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * GET /api/rooms
     *
     * List all rooms with optional filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Room::with('roomType');

        // Filter by room type
        if ($request->has('room_type_id')) {
            $query->byRoomType((int) $request->room_type_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        // Search by room number
        if ($request->has('search')) {
            $query->search($request->search);
        }

        // Sort
        $sortField = $request->get('sort', 'room_number');
        $sortDirection = $request->get('direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $rooms = $query->get();

        return response()->json([
            'data' => RoomResource::collection($rooms),
        ]);
    }

    /**
     * POST /api/rooms
     *
     * Create a new room.
     */
    public function store(StoreRoomRequest $request): JsonResponse
    {
        $room = Room::create($request->validated());

        return response()->json([
            'message' => 'Room created successfully.',
            'data' => new RoomResource($room->load('roomType')),
        ], 201);
    }

    /**
     * GET /api/rooms/{id}
     *
     * Show a single room.
     */
    public function show(Room $room): JsonResponse
    {
        $room->load('roomType');

        return response()->json([
            'data' => new RoomResource($room),
        ]);
    }

    /**
     * PUT/PATCH /api/rooms/{id}
     *
     * Update a room.
     */
    public function update(UpdateRoomRequest $request, Room $room): JsonResponse
    {
        $room->update($request->validated());

        return response()->json([
            'message' => 'Room updated successfully.',
            'data' => new RoomResource($room->fresh()->load('roomType')),
        ]);
    }

    /**
     * DELETE /api/rooms/{id}
     *
     * Delete a room (soft delete).
     */
    public function destroy(Room $room): JsonResponse
    {
        $room->delete();

        return response()->json([
            'message' => 'Room deleted successfully.',
        ]);
    }

    /**
     * POST /api/rooms/bulk-status
     *
     * Bulk update room statuses.
     */
    public function bulkStatusUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_ids' => 'required|array',
            'room_ids.*' => 'exists:rooms,id',
            'status' => 'required|in:available,occupied,cleaning,maintenance,out_of_order,out_of_service',
        ]);

        $updated = Room::whereIn('id', $validated['room_ids'])
            ->update(['status' => $validated['status']]);

        return response()->json([
            'message' => "Updated {$updated} room(s) to {$validated['status']}.",
            'updated_count' => $updated,
        ]);
    }
}
