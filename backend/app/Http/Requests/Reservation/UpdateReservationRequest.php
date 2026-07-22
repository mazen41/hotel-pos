<?php

namespace App\Http\Requests\Reservation;

use App\Models\Reservation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_id'                   => ['sometimes', 'integer', 'exists:guests,id'],
            'room_id'                    => ['sometimes', 'integer', 'exists:rooms,id'],
            'room_type_id'               => ['sometimes', 'integer', 'exists:room_types,id'],
            'source'                     => ['sometimes', 'string', 'max:80'],
            'check_in_date'              => ['sometimes', 'date'],
            'check_out_date'             => ['sometimes', 'date', 'after:check_in_date'],
            'adults'                     => ['sometimes', 'integer', 'min:1'],
            'children'                   => ['sometimes', 'integer', 'min:0'],
            'status'                     => ['sometimes', Rule::in(Reservation::STATUSES)],
            'payment_status'             => ['sometimes', Rule::in(Reservation::PAYMENT_STATUSES)],
            'taxes'                      => ['sometimes', 'numeric', 'min:0'],
            'fees'                       => ['sometimes', 'numeric', 'min:0'],
            'paid_amount'                => ['sometimes', 'numeric', 'min:0'],
            'special_requests'           => ['sometimes', 'nullable', 'string', 'max:5000'],
            'internal_notes'             => ['sometimes', 'nullable', 'string', 'max:5000'],
            'external_reservation_id'    => ['sometimes', 'nullable', 'string', 'max:255'],
            'channel_manager_reference'  => ['sometimes', 'nullable', 'string', 'max:255'],
            'synced_at'                  => ['sometimes', 'nullable', 'date'],
            'cancellation_reason'        => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
