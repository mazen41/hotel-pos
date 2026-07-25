<?php

namespace App\Http\Requests\RoomType;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Gate handled by auth:sanctum middleware
    }

    public function rules(): array
    {
        return [
            // ── Basic Information ───────────────────────────────────────────────
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],

            // ── Pricing ─────────────────────────────────────────────────────────
            'base_price' => ['sometimes', 'numeric', 'min:0', 'max:999999.99'],
            'meal_plan' => ['nullable', 'string', 'max:10'],
            'rates' => ['nullable', 'array'],
            'rates.*' => ['numeric', 'min:0'],

            // ── Occupancy ───────────────────────────────────────────────────────
            'max_adults' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'max_children' => ['sometimes', 'integer', 'min:0', 'max:20'],
            'max_occupancy' => ['sometimes', 'integer', 'min:1', 'max:40'],

            // ── Room Details ─────────────────────────────────────────────────────
            'bed_type' => ['nullable', 'string', 'max:100'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:100'],

            // ── Images ──────────────────────────────────────────────────────────
            'images' => ['nullable', 'array'],
            'images.*' => ['string', 'url', 'max:500'],

            // ── Status ─────────────────────────────────────────────────────────
            'is_active' => ['sometimes', 'boolean'],

            // ── Channel Manager Integration ─────────────────────────────────────
            'external_mapping_id' => ['nullable', 'string', 'max:100'],
            'channel_manager_code' => ['nullable', 'string', 'max:100'],
            'rate_plan_code' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Room type name is required.',
            'base_price.required' => 'Base price is required.',
            'base_price.min' => 'Base price must be at least 0.',
            'max_adults.required' => 'Maximum adults is required.',
            'max_adults.min' => 'Maximum adults must be at least 1.',
            'max_occupancy.required' => 'Maximum occupancy is required.',
            'max_occupancy.min' => 'Maximum occupancy must be at least 1.',
            'amenities.*.max' => 'Each amenity must not exceed 100 characters.',
            'images.*.url' => 'Each image must be a valid URL.',
        ];
    }
}
