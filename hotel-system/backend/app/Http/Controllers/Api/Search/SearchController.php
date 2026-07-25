<?php

namespace App\Http\Controllers\Api\Search;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * GET /api/search?q=
     *
     * Global search across guests, reservations, and rooms.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'required|string|min:2',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $query = $validated['q'];
        $limit = (int) ($validated['limit'] ?? 10);

        // Search guests
        $guests = Guest::search($query)
            ->withCount('reservations')
            ->limit($limit)
            ->get()
            ->map(function ($guest) {
                return [
                    'type' => 'guest',
                    'id' => $guest->id,
                    'title' => $guest->full_name,
                    'subtitle' => $guest->email ?? $guest->phone,
                    'url' => "/dashboard/guests/{$guest->id}",
                    'meta' => [
                        'reservations_count' => $guest->reservations_count,
                        'vip_status' => $guest->vip_status,
                    ],
                ];
            });

        // Search reservations
        $reservations = Reservation::search($query)
            ->with(['guest', 'room.roomType'])
            ->limit($limit)
            ->get()
            ->map(function ($reservation) {
                return [
                    'type' => 'reservation',
                    'id' => $reservation->id,
                    'title' => "Reservation #{$reservation->reservation_number}",
                    'subtitle' => $reservation->guest ? $reservation->guest->full_name : 'Unknown',
                    'url' => "/dashboard/reservations/{$reservation->id}",
                    'meta' => [
                        'status' => $reservation->status,
                        'check_in_date' => $reservation->check_in_date?->format('M d, Y'),
                        'check_out_date' => $reservation->check_out_date?->format('M d, Y'),
                        'room_number' => $reservation->room?->room_number,
                    ],
                ];
            });

        // Search rooms
        $rooms = Room::search($query)
            ->with('roomType')
            ->where('is_active', true)
            ->limit($limit)
            ->get()
            ->map(function ($room) {
                return [
                    'type' => 'room',
                    'id' => $room->id,
                    'title' => "Room {$room->room_number}",
                    'subtitle' => $room->roomType ? $room->roomType->name : 'Unknown Type',
                    'url' => "/dashboard/rooms",
                    'meta' => [
                        'status' => $room->status,
                        'floor' => $room->floor,
                        'room_type' => $room->roomType?->name,
                    ],
                ];
            });

        return response()->json([
            'data' => [
                'guests' => $guests,
                'reservations' => $reservations,
                'rooms' => $rooms,
            ],
            'summary' => [
                'total_results' => $guests->count() + $reservations->count() + $rooms->count(),
                'guests_count' => $guests->count(),
                'reservations_count' => $reservations->count(),
                'rooms_count' => $rooms->count(),
            ],
        ]);
    }
}
