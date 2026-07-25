<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHotelSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Gate handled by auth:sanctum middleware
    }

    public function rules(): array
    {
        return [
            // ── General ───────────────────────────────────────────────────
            'hotel_name'                 => ['sometimes', 'string', 'max:255'],
            'legal_business_name'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'logo'                       => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:2048'],
            'favicon'                    => ['sometimes', 'nullable', 'image', 'mimes:ico,png,svg', 'max:512'],
            'contact_email'              => ['sometimes', 'nullable', 'email', 'max:255'],
            'contact_phone'              => ['sometimes', 'nullable', 'string', 'max:50'],
            'website_url'                => ['sometimes', 'nullable', 'url', 'max:255'],

            // ── Location ──────────────────────────────────────────────────
            'country'                    => ['sometimes', 'nullable', 'string', 'max:100'],
            'city'                       => ['sometimes', 'nullable', 'string', 'max:100'],
            'address'                    => ['sometimes', 'nullable', 'string', 'max:500'],
            'postal_code'                => ['sometimes', 'nullable', 'string', 'max:20'],

            // ── Operational ───────────────────────────────────────────────
            'timezone'                   => ['sometimes', 'string', 'timezone:all'],
            'currency'                   => ['sometimes', 'string', 'size:3'],
            'default_language'           => ['sometimes', 'string', 'max:10'],
            'check_in_time'              => ['sometimes', 'date_format:H:i'],
            'check_out_time'             => ['sometimes', 'date_format:H:i'],

            // ── Financial ─────────────────────────────────────────────────
            'tax_percentage'             => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'service_charge_percentage'  => ['sometimes', 'numeric', 'min:0', 'max:100'],

            // ── Booking ───────────────────────────────────────────────────
            'cancellation_policy'        => ['sometimes', 'nullable', 'string', 'max:5000'],
            'confirmation_policy'        => ['sometimes', 'nullable', 'string', 'max:5000'],

            // ── Channel Manager ────────────────────────────────────────────
            'channel_property_code'             => ['sometimes', 'nullable', 'string', 'max:100'],
            'channel_external_property_ref'     => ['sometimes', 'nullable', 'string', 'max:100'],
            'channel_default_rate_plan_code'    => ['sometimes', 'nullable', 'string', 'max:100'],
            'channel_default_inventory_code'    => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'hotel_name.required'       => 'Hotel name is required.',
            'contact_email.email'       => 'Please enter a valid contact email.',
            'website_url.url'           => 'Please enter a valid website URL (include https://).',
            'timezone.timezone'         => 'Please select a valid timezone.',
            'currency.size'             => 'Currency must be a 3-letter ISO code (e.g. USD, EUR).',
            'check_in_time.date_format' => 'Check-in time must be in HH:MM format.',
            'check_out_time.date_format'=> 'Check-out time must be in HH:MM format.',
            'tax_percentage.max'        => 'Tax percentage cannot exceed 100%.',
            'logo.image'                => 'Logo must be an image file.',
            'logo.max'                  => 'Logo must not exceed 2MB.',
            'favicon.max'               => 'Favicon must not exceed 512KB.',
        ];
    }
}
