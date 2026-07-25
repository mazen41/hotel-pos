<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Gate handled by auth:sanctum middleware
    }

    public function rules(): array
    {
        return [
            // ── Room Type Relationship ─────────────────────────────────────────
            'room_type_id' => ['required', 'exists:room_types,id'],

            // ── Room Identification ─────────────────────────────────────────────
            'room_number' => ['required', 'string', 'max:50', 'unique:rooms,room_number'],
            'floor' => ['nullable', 'string', 'max:50'],

            // ── Status ─────────────────────────────────────────────────────────
            'status' => ['required', 'in:available,occupied,cleaning,maintenance,out_of_order'],

            // ── Additional Information ───────────────────────────────────────────
            'notes' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],

            // ── Channel Manager & Inventory Synchronization ─────────────────────
            'external_room_id' => ['nullable', 'string', 'max:100'],
            'inventory_code' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'room_type_id.required' => 'Room type is required.',
            'room_type_id.exists' => 'Selected room type does not exist.',
            'room_number.required' => 'Room number is required.',
            'room_number.unique' => 'This room number already exists.',
            'status.required' => 'Room status is required.',
            'status.in' => 'Invalid room status selected.',
            'sort_order.min' => 'Sort order must be at least 0.',
        ];
    }
}
