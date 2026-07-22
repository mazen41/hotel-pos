<?php

namespace App\Http\Controllers\Api\Room;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoomResource;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoomAvailabilityController extends Controller
{
    /**
     * GET /api/rooms/availability
     *
     * Returns rooms that are free for the requested date range.
     *
     * Query params:
     *   check_in      date  required  Y-m-d
     *   check_out     date  required  Y-m-d  (must be after check_in)
     *   room_type_id  int   optional  filter by type
     *   adults        int   optional  filter by min adult capacity
     *   children      int   optional  filter by min children capacity
     */
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'check_in'     => ['required', 'date', 'after_or_equal:today'],
            'check_out'    => ['required', 'date', 'after:check_in'],
            'room_type_id' => ['sometimes', 'integer', 'exists:room_types,id'],
            'adults'       => ['sometimes', 'integer', 'min:1'],
            'children'     => ['sometimes', 'integer', 'min:0'],
        ]);

        $checkIn  = $request->check_in;
        $checkOut = $request->check_out;

        // ── Find rooms that have NO overlapping confirmed/active reservation ──
        // Overlap condition: existing.check_in_date < requested.check_out
        //                AND existing.check_out_date > requested.check_in
        $bookedRoomIds = DB::table('reservations')
            ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
            ->whereNull('deleted_at')
            ->where('check_in_date', '<', $checkOut)
            ->where('check_out_date', '>', $checkIn)
            ->pluck('room_id');

        $query = Room::with('roomType')
            ->where('is_active', true)
            ->where('status', 'available')
            ->whereNotIn('id', $bookedRoomIds);

        // Optional filters
        if ($request->filled('room_type_id')) {
            $query->where('room_type_id', $request->room_type_id);
        }

        if ($request->filled('adults')) {
            $query->whereHas('roomType', function ($q) use ($request) {
                $q->where('max_adults', '>=', (int) $request->adults);
            });
        }

        if ($request->filled('children')) {
            $query->whereHas('roomType', function ($q) use ($request) {
                $q->where('max_children', '>=', (int) $request->children);
            });
        }

        $rooms = $query->orderBy('room_number')->get();

        $nights = (int) now()->parse($checkIn)->diffInDays(now()->parse($checkOut));

        return response()->json([
            'data' => RoomResource::collection($rooms),
            'meta' => [
                'check_in'       => $checkIn,
                'check_out'      => $checkOut,
                'nights'         => $nights,
                'available_count'=> $rooms->count(),
            ],
        ]);
    }
}
