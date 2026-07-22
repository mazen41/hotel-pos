<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateHotelSettingsRequest;
use App\Models\HotelSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class HotelSettingsController extends Controller
{
    /**
     * GET /api/settings/hotel
     *
     * Return the current hotel settings.
     * Creates the singleton row with defaults if it doesn't exist yet.
     */
    public function show(): JsonResponse
    {
        $settings = HotelSetting::current();

        return response()->json([
            'data' => $this->formatSettings($settings),
        ]);
    }

    /**
     * PUT /api/settings/hotel
     *
     * Update hotel settings. Accepts multipart/form-data for file uploads
     * (logo, favicon) alongside regular JSON fields.
     */
    public function update(UpdateHotelSettingsRequest $request): JsonResponse
    {
        $settings = HotelSetting::current();

        $data = $request->except(['logo', 'favicon', '_method']);

        // ── Logo upload ────────────────────────────────────────────────────
        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            // Delete the old logo file
            if ($settings->logo_path) {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $data['logo_path'] = $request->file('logo')
                ->store('hotel/logos', 'public');
        }

        // ── Favicon upload ─────────────────────────────────────────────────
        if ($request->hasFile('favicon') && $request->file('favicon')->isValid()) {
            if ($settings->favicon_path) {
                Storage::disk('public')->delete($settings->favicon_path);
            }
            $data['favicon_path'] = $request->file('favicon')
                ->store('hotel/favicons', 'public');
        }

        // Normalize time fields — strip seconds if the browser sends HH:MM:SS
        if (isset($data['check_in_time'])) {
            $data['check_in_time'] = substr($data['check_in_time'], 0, 5);
        }
        if (isset($data['check_out_time'])) {
            $data['check_out_time'] = substr($data['check_out_time'], 0, 5);
        }

        $settings->update($data);
        $settings->refresh();

        return response()->json([
            'message' => 'Hotel settings updated successfully.',
            'data'    => $this->formatSettings($settings),
        ]);
    }

    /**
     * Format the settings model for the API response.
     * Keeps the payload shape consistent and explicit.
     */
    private function formatSettings(HotelSetting $s): array
    {
        return [
            // General
            'hotel_name'                        => $s->hotel_name,
            'legal_business_name'               => $s->legal_business_name,
            'logo_url'                          => $s->logo_url,
            'favicon_url'                       => $s->favicon_url,
            'contact_email'                     => $s->contact_email,
            'contact_phone'                     => $s->contact_phone,
            'website_url'                       => $s->website_url,
            // Location
            'country'                           => $s->country,
            'city'                              => $s->city,
            'address'                           => $s->address,
            'postal_code'                       => $s->postal_code,
            // Operational
            'timezone'                          => $s->timezone,
            'currency'                          => $s->currency,
            'default_language'                  => $s->default_language,
            'check_in_time'                     => $s->check_in_time ? substr($s->check_in_time, 0, 5) : '14:00',
            'check_out_time'                    => $s->check_out_time ? substr($s->check_out_time, 0, 5) : '11:00',
            // Financial
            'tax_percentage'                    => (float) $s->tax_percentage,
            'service_charge_percentage'         => (float) $s->service_charge_percentage,
            // Booking
            'cancellation_policy'               => $s->cancellation_policy,
            'confirmation_policy'               => $s->confirmation_policy,
            // Channel Manager
            'channel_property_code'             => $s->channel_property_code,
            'channel_external_property_ref'     => $s->channel_external_property_ref,
            'channel_default_rate_plan_code'    => $s->channel_default_rate_plan_code,
            'channel_default_inventory_code'    => $s->channel_default_inventory_code,
        ];
    }
}
