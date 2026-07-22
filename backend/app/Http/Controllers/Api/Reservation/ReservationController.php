<?php

namespace App\Http\Controllers\Api\Reservation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\SearchReservationRequest;
use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Requests\Reservation\UpdateReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\Reservations\ReservationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function __construct(private readonly ReservationService $reservations)
    {
    }

    /**
     * GET /api/reservations
     */
    public function index(Request $request): JsonResponse
    {
        $query = Reservation::query()->with(['guest', 'room.roomType', 'roomType', 'ratePlan', 'group']);

        $this->applyFilters($query, $request);

        $sortField = $request->get('sort', 'check_in_date');
        $sortDirection = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['reservation_number', 'check_in_date', 'check_out_date', 'created_at', 'status', 'payment_status', 'source'];

        if (! in_array($sortField, $allowedSorts, true)) {
            $sortField = 'check_in_date';
        }

        $reservations = $query
            ->orderBy($sortField, $sortDirection)
            ->orderBy('reservation_number')
            ->paginate((int) $request->get('per_page', 15))
            ->withQueryString();

        return response()->json([
            'data' => ReservationResource::collection($reservations->items()),
            'meta' => [
                'current_page' => $reservations->currentPage(),
                'from' => $reservations->firstItem(),
                'last_page' => $reservations->lastPage(),
                'per_page' => $reservations->perPage(),
                'to' => $reservations->lastItem(),
                'total' => $reservations->total(),
            ],
            'links' => [
                'first' => $reservations->url(1),
                'last' => $reservations->url($reservations->lastPage()),
                'prev' => $reservations->previousPageUrl(),
                'next' => $reservations->nextPageUrl(),
            ],
        ]);
    }

    /**
     * POST /api/reservations
     */
    public function store(StoreReservationRequest $request): JsonResponse
    {
        $reservation = $this->reservations->create($request->validated());

        return response()->json([
            'message' => 'Reservation created successfully.',
            'data' => new ReservationResource($reservation),
        ], 201);
    }

    /**
     * GET /api/reservations/{id}
     */
    public function show(Reservation $reservation): JsonResponse
    {
        $reservation->load(['guest', 'room.roomType', 'roomType', 'ratePlan', 'group', 'groupMembers']);

        return response()->json([
            'data' => new ReservationResource($reservation),
        ]);
    }

    /**
     * PUT /api/reservations/{id}
     */
    public function update(UpdateReservationRequest $request, Reservation $reservation): JsonResponse
    {
        $reservation = $this->reservations->update($reservation, $request->validated());

        return response()->json([
            'message' => 'Reservation updated successfully.',
            'data' => new ReservationResource($reservation),
        ]);
    }

    /**
     * DELETE /api/reservations/{id}
     */
    public function destroy(Reservation $reservation): JsonResponse
    {
        if ($reservation->status === 'checked_in') {
            return response()->json([
                'message' => 'Checked-in reservations cannot be deleted. Update the reservation status first.',
            ], 409);
        }

        $guestId = $reservation->guest_id;
        $reservation->delete();

        return response()->json([
            'message' => 'Reservation deleted successfully.',
            'guest_id' => $guestId,
        ]);
    }

    /**
     * GET /api/reservations/search?q=
     */
    public function search(SearchReservationRequest $request): JsonResponse
    {
        $reservations = Reservation::query()
            ->with(['guest', 'room.roomType', 'roomType', 'ratePlan'])
            ->search($request->validated('q'))
            ->orderBy('check_in_date')
            ->limit((int) $request->get('per_page', 20))
            ->get();

        return response()->json([
            'data' => ReservationResource::collection($reservations),
        ]);
    }

    /**
     * POST /api/reservations/{id}/check-in
     */
    public function checkIn(Reservation $reservation): JsonResponse
    {
        if ($reservation->status !== 'confirmed') {
            return response()->json([
                'message' => 'Only confirmed reservations can be checked in.',
            ], 409);
        }

        $reservation->status = 'checked_in';
        $reservation->save();

        return response()->json([
            'message' => 'Guest checked in successfully.',
            'data' => new ReservationResource($reservation->load(['guest', 'room.roomType', 'roomType', 'ratePlan'])),
        ]);
    }

    /**
     * POST /api/reservations/{id}/check-out
     */
    public function checkOut(Reservation $reservation): JsonResponse
    {
        if ($reservation->status !== 'checked_in') {
            return response()->json([
                'message' => 'Only checked-in reservations can be checked out.',
            ], 409);
        }

        $reservation->status = 'checked_out';
        $reservation->save();

        return response()->json([
            'message' => 'Guest checked out successfully.',
            'data' => new ReservationResource($reservation->load(['guest', 'room.roomType', 'roomType', 'ratePlan'])),
        ]);
    }

    /**
     * POST /api/reservations/{id}/cancel
     */
    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        if (!in_array($reservation->status, ['pending', 'confirmed'])) {
            return response()->json([
                'message' => 'Only pending or confirmed reservations can be cancelled.',
            ], 409);
        }

        $validated = $this->validate($request, [
            'cancellation_reason' => 'required|string|max:1000',
        ]);

        $reservation->status = 'cancelled';
        $reservation->cancelled_at = now();
        $reservation->cancellation_reason = $validated['cancellation_reason'];
        $reservation->save();

        return response()->json([
            'message' => 'Reservation cancelled successfully.',
            'data' => new ReservationResource($reservation->load(['guest', 'room.roomType', 'roomType', 'ratePlan'])),
        ]);
    }

    /**
     * POST /api/reservations/{id}/no-show
     */
    public function markNoShow(Reservation $reservation): JsonResponse
    {
        if (!in_array($reservation->status, ['confirmed'])) {
            return response()->json([
                'message' => 'Only confirmed reservations can be marked as no-show.',
            ], 409);
        }

        $reservation->status = 'no_show';
        $reservation->save();

        return response()->json([
            'message' => 'Reservation marked as no-show successfully.',
            'data' => new ReservationResource($reservation->load(['guest', 'room.roomType', 'roomType', 'ratePlan'])),
        ]);
    }

    /**
     * POST /api/reservations/{id}/express-check-in
     */
    public function expressCheckIn(Reservation $reservation): JsonResponse
    {
        if ($reservation->status !== 'confirmed') {
            return response()->json([
                'message' => 'Only confirmed reservations can be checked in.',
            ], 409);
        }

        // Auto-assign room if not assigned
        if (!$reservation->room_id && $reservation->room_type_id) {
            $availableRoom = \App\Models\Room::where('room_type_id', $reservation->room_type_id)
                ->where('status', 'available')
                ->where('is_active', true)
                ->first();

            if ($availableRoom) {
                $reservation->room_id = $availableRoom->id;
                $availableRoom->status = 'occupied';
                $availableRoom->save();
            }
        }

        $reservation->status = 'checked_in';
        $reservation->save();

        return response()->json([
            'message' => 'Express check-in completed successfully.',
            'data' => new ReservationResource($reservation->load(['guest', 'room.roomType', 'roomType', 'ratePlan'])),
        ]);
    }

    /**
     * POST /api/reservations/{id}/express-check-out
     */
    public function expressCheckOut(Reservation $reservation): JsonResponse
    {
        if ($reservation->status !== 'checked_in') {
            return response()->json([
                'message' => 'Only checked-in reservations can be checked out.',
            ], 409);
        }

        $reservation->status = 'checked_out';
        $reservation->save();

        // Update room status
        if ($reservation->room_id) {
            $room = $reservation->room;
            if ($room) {
                $room->status = 'cleaning';
                $room->save();
            }
        }

        return response()->json([
            'message' => 'Express check-out completed successfully.',
            'data' => new ReservationResource($reservation->load(['guest', 'room.roomType', 'roomType', 'ratePlan'])),
        ]);
    }

    /**
     * POST /api/reservations/{id}/split
     */
    public function split(Request $request, Reservation $reservation): JsonResponse
    {
        if (in_array($reservation->status, ['checked_out', 'cancelled', 'no_show'])) {
            return response()->json([
                'message' => 'Cannot split completed or cancelled reservations.',
            ], 409);
        }

        $validated = $this->validate($request, [
            'room_id' => 'required|exists:rooms,id',
            'adults' => 'sometimes|integer|min:1',
            'children' => 'sometimes|integer|min:0',
        ]);

        // Create new reservation with same details but different room
        $newReservation = $reservation->replicate(['reservation_number', 'room_id']);
        $newReservation->reservation_number = $this->generateReservationNumber();
        $newReservation->room_id = $validated['room_id'];
        $newReservation->adults = $validated['adults'] ?? $reservation->adults;
        $newReservation->children = $validated['children'] ?? $reservation->children;
        
        // Set group_id to group them together
        if ($reservation->group_id === null) {
            // Original becomes group leader
            $reservation->group_id = $reservation->id;
            $reservation->save();
        }
        $newReservation->group_id = $reservation->group_id;
        
        $newReservation->save();

        return response()->json([
            'message' => 'Reservation split successfully.',
            'data' => new ReservationResource($newReservation->load(['guest', 'room.roomType', 'roomType', 'ratePlan'])),
        ], 201);
    }

    /**
     * POST /api/reservations/{id}/add-to-group
     */
    public function addToGroup(Request $request, Reservation $reservation): JsonResponse
    {
        $validated = $this->validate($request, [
            'group_id' => 'nullable|exists:reservations,id',
        ]);

        if ($validated['group_id'] == $reservation->id) {
            return response()->json([
                'message' => 'Cannot add reservation to its own group.',
            ], 409);
        }

        $reservation->group_id = $validated['group_id'];
        $reservation->save();

        return response()->json([
            'message' => 'Reservation added to group successfully.',
            'data' => new ReservationResource($reservation->load(['guest', 'room.roomType', 'roomType', 'ratePlan'])),
        ]);
    }

    private function generateReservationNumber(): string
    {
        do {
            $number = 'RES-' . strtoupper(substr(uniqid(), -8));
        } while (Reservation::where('reservation_number', $number)->exists());
        
        return $number;
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        $query->search($request->get('search', $request->get('q')));

        foreach (['status', 'payment_status', 'source', 'guest_id', 'room_id', 'room_type_id', 'group_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->get($field));
            }
        }

        if ($request->filled('date_from')) {
            $query->where('check_in_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('check_out_date', '<=', $request->date_to);
        }
    }
}
