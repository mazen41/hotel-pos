<?php

namespace App\Services\Reservations;

use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    public function create(array $data): Reservation
    {
        return DB::transaction(function () use ($data): Reservation {
            $data = $this->preparePayload($data);
            $this->ensureRoomMatchesType($data['room_id'], $data['room_type_id']);
            $this->ensureRoomIsAvailable($data['room_id'], $data['check_in_date'], $data['check_out_date']);

            $reservation = Reservation::create($data);
            $this->syncGuestStayTotals($reservation->guest_id);

            return $reservation->load(['guest', 'room.roomType', 'roomType']);
        });
    }

    public function update(Reservation $reservation, array $data): Reservation
    {
        return DB::transaction(function () use ($reservation, $data): Reservation {
            // Merge incoming partial data over existing reservation values
            $data = array_merge($reservation->only([
                'reservation_number', 'guest_id', 'room_id', 'room_type_id', 'source', 'check_in_date', 'check_out_date',
                'adults', 'children', 'status', 'payment_status', 'taxes', 'fees', 'paid_amount', 'special_requests',
                'internal_notes', 'external_reservation_id', 'channel_manager_reference', 'synced_at',
            ]), $data);

            // If room_id changed but room_type_id was not explicitly provided,
            // auto-resolve room_type_id from the new room so the type check passes.
            if (isset($data['room_id']) && (int) $data['room_id'] !== (int) $reservation->room_id && !isset($data['room_type_id'])) {
                $newRoom = Room::find($data['room_id']);
                if ($newRoom) {
                    $data['room_type_id'] = $newRoom->room_type_id;
                }
            }

            $data = $this->preparePayload($data, $reservation);
            $this->ensureRoomMatchesType($data['room_id'], $data['room_type_id']);
            $this->ensureRoomIsAvailable($data['room_id'], $data['check_in_date'], $data['check_out_date'], $reservation->id);

            if ($data['status'] === 'cancelled' && $reservation->status !== 'cancelled') {
                $data['cancelled_at'] = now();
            }

            $reservation->update($data);
            $this->syncGuestStayTotals($reservation->guest_id);

            return $reservation->fresh()->load(['guest', 'room.roomType', 'roomType']);
        });
    }

    public function ensureRoomIsAvailable(int $roomId, string $checkInDate, string $checkOutDate, ?int $ignoreReservationId = null): void
    {
        $isBooked = Reservation::query()
            ->active()
            ->where('room_id', $roomId)
            ->when($ignoreReservationId, fn ($query) => $query->whereKeyNot($ignoreReservationId))
            ->overlapping($checkInDate, $checkOutDate)
            ->exists();

        if ($isBooked) {
            throw ValidationException::withMessages([
                'room_id' => 'This room is already booked for the selected dates.',
            ]);
        }
    }

    public function calculateTotals(int $roomTypeId, string $checkInDate, string $checkOutDate, float $taxes = 0, float $fees = 0, float $paidAmount = 0): array
    {
        $roomType = RoomType::query()->find($roomTypeId);
        $rate = (float) ($roomType?->base_price ?? 0);
        $nights = $this->calculateNights($checkInDate, $checkOutDate);
        $subtotal = round($rate * $nights, 2);
        $totalAmount = round($subtotal + $taxes + $fees, 2);
        $balanceDue = max(round($totalAmount - $paidAmount, 2), 0);

        return compact('nights', 'subtotal', 'taxes', 'fees', 'totalAmount', 'paidAmount', 'balanceDue');
    }

    private function preparePayload(array $data, ?Reservation $reservation = null): array
    {
        $data['reservation_number'] = $data['reservation_number'] ?? $reservation?->reservation_number ?? $this->generateReservationNumber();
        $data['status'] = $data['status'] ?? 'pending';
        $data['payment_status'] = $data['payment_status'] ?? 'unpaid';
        $data['source'] = $data['source'] ?? 'direct';
        $data['adults'] = (int) ($data['adults'] ?? 1);
        $data['children'] = (int) ($data['children'] ?? 0);
        $data['taxes'] = (float) ($data['taxes'] ?? 0);
        $data['fees'] = (float) ($data['fees'] ?? 0);
        $data['paid_amount'] = (float) ($data['paid_amount'] ?? 0);

        $totals = $this->calculateTotals((int) $data['room_type_id'], $data['check_in_date'], $data['check_out_date'], $data['taxes'], $data['fees'], $data['paid_amount']);
        $data['nights'] = $totals['nights'];
        $data['subtotal'] = $totals['subtotal'];
        $data['taxes'] = $totals['taxes'];
        $data['fees'] = $totals['fees'];
        $data['total_amount'] = $totals['totalAmount'];
        $data['paid_amount'] = $totals['paidAmount'];
        $data['balance_due'] = $totals['balanceDue'];

        if ($data['paid_amount'] <= 0 && $data['payment_status'] === 'paid') {
            $data['paid_amount'] = $data['total_amount'];
            $data['balance_due'] = 0;
        }

        return Arr::only($data, (new Reservation())->getFillable());
    }

    private function calculateNights(string $checkInDate, string $checkOutDate): int
    {
        return max(1, (int) Carbon::parse($checkInDate)->startOfDay()->diffInDays(Carbon::parse($checkOutDate)->startOfDay()));
    }

    private function generateReservationNumber(): string
    {
        do {
            $number = 'RES-' . now()->format('Ymd') . '-' . str_pad((string) random_int(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (Reservation::where('reservation_number', $number)->exists());

        return $number;
    }

    private function ensureRoomMatchesType(int $roomId, int $roomTypeId): void
    {
        $matches = Room::query()
            ->whereKey($roomId)
            ->where('room_type_id', $roomTypeId)
            ->where('is_active', true)
            ->whereNotIn('status', ['maintenance', 'out_of_order'])
            ->exists();

        if (! $matches) {
            throw ValidationException::withMessages([
                'room_id' => 'Selected room does not match the selected room type or is unavailable for reservations.',
            ]);
        }
    }

    private function syncGuestStayTotals(int $guestId): void
    {
        $totals = Reservation::query()
            ->where('guest_id', $guestId)
            ->where('status', 'checked_out')
            ->selectRaw('COUNT(*) as stays, COALESCE(SUM(total_amount), 0) as spent')
            ->first();

        DB::table('guests')->where('id', $guestId)->update([
            'total_stays' => (int) ($totals->stays ?? 0),
            'total_spent' => (float) ($totals->spent ?? 0),
            'updated_at' => now(),
        ]);
    }
}
