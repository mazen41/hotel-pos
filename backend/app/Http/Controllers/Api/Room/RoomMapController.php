<?php

namespace App\Http\Controllers\Api\Room;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoomMapController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->date ?? Carbon::today()->toDateString();
        $floor = $request->floor;

        $query = Room::with(['roomType', 'currentReservation' => function($query) use ($date) {
            $query->where('check_in_date', '<=', $date)
                  ->where('check_out_date', '>', $date);
        }])->where('is_active', true);

        if ($floor) {
            $query->where('floor', $floor);
        }

        $rooms = $query->orderBy('floor')->orderBy('sort_order')->get();

        // Group by floor
        $roomMap = [];
        foreach ($rooms as $room) {
            $floorKey = $room->floor ?? 'Ground';
            if (!isset($roomMap[$floorKey])) {
                $roomMap[$floorKey] = [];
            }
            $roomMap[$floorKey][] = [
                'id' => $room->id,
                'room_number' => $room->room_number,
                'display_name' => $room->display_name,
                'floor' => $room->floor,
                'status' => $room->status,
                'room_type' => [
                    'id' => $room->roomType->id,
                    'name' => $room->roomType->name,
                    'base_price' => $room->roomType->base_price,
                ],
                'current_reservation' => $room->currentReservation ? [
                    'id' => $room->currentReservation->id,
                    'guest_name' => $room->currentReservation->guest->full_name ?? 'N/A',
                    'check_in_date' => $room->currentReservation->check_in_date,
                    'check_out_date' => $room->currentReservation->check_out_date,
                    'status' => $room->currentReservation->status,
                ] : null,
            ];
        }

        // Get available floors
        $floors = Room::where('is_active', true)
            ->distinct()
            ->orderBy('floor')
            ->pluck('floor')
            ->filter()
            ->values();

        // Get summary statistics
        $summary = [
            'total_rooms' => $rooms->count(),
            'available' => $rooms->where('status', 'available')->count(),
            'occupied' => $rooms->where('status', 'occupied')->count(),
            'cleaning' => $rooms->where('status', 'cleaning')->count(),
            'maintenance' => $rooms->where('status', 'maintenance')->count(),
            'out_of_order' => $rooms->where('status', 'out_of_order')->count(),
            'out_of_service' => $rooms->where('status', 'out_of_service')->count(),
        ];

        return response()->json([
            'date' => $date,
            'room_map' => $roomMap,
            'floors' => $floors,
            'summary' => $summary,
        ]);
    }

    public function quickStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:available,occupied,cleaning,maintenance,out_of_order,out_of_service',
            'notes' => 'nullable|string',
        ]);

        $room = Room::findOrFail($id);
        $room->update([
            'status' => $request->status,
            'notes' => $request->notes,
        ]);

        return response()->json([
            'message' => 'Room status updated successfully',
            'room' => $room->load('roomType'),
        ]);
    }
}