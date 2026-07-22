<?php

namespace App\Http\Requests\Reservation;

use App\Models\Reservation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'group_id' => ['nullable', 'integer', 'exists:reservations,id'],
            'guest_id' => ['required', 'integer', 'exists:guests,id'],
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'room_type_id' => ['required', 'integer', 'exists:room_types,id'],
            'source' => ['sometimes', 'string', 'max:80'],
            'check_in_date' => ['required', 'date', 'after_or_equal:today'],
            'check_out_date' => ['required', 'date', 'after:check_in_date'],
            'adults' => ['required', 'integer', 'min:1'],
            'children' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(Reservation::STATUSES)],
            'payment_status' => ['sometimes', Rule::in(Reservation::PAYMENT_STATUSES)],
            'taxes' => ['sometimes', 'numeric', 'min:0'],
            'fees' => ['sometimes', 'numeric', 'min:0'],
            'paid_amount' => ['sometimes', 'numeric', 'min:0'],
            'special_requests' => ['nullable', 'string', 'max:5000'],
            'internal_notes' => ['nullable', 'string', 'max:5000'],
            'external_reservation_id' => ['nullable', 'string', 'max:255'],
            'channel_manager_reference' => ['nullable', 'string', 'max:255'],
            'synced_at' => ['nullable', 'date'],
        ];
    }
}
