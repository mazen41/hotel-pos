<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\HotelIntegrationSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HotelIntegrationController extends Controller
{
    /**
     * Get hotel integration settings
     */
    public function getSettings(): JsonResponse
    {
        $settings = HotelIntegrationSetting::firstOrCreate([], [
            'hotel_api_url' => null,
            'hotel_api_token' => null,
            'is_enabled' => false
        ]);

        return response()->json(['data' => $settings]);
    }

    /**
     * Update hotel integration settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'hotel_api_url' => 'nullable|url',
            'hotel_api_token' => 'nullable|string',
            'is_enabled' => 'boolean'
        ]);

        $settings = HotelIntegrationSetting::first();
        
        $settings->update($request->only([
            'hotel_api_url',
            'hotel_api_token',
            'is_enabled'
        ]));

        return response()->json([
            'message' => 'Hotel integration settings updated successfully',
            'data' => $settings
        ]);
    }

    /**
     * Search guests from hotel system
     */
    public function searchGuest(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:2'
        ]);

        $settings = HotelIntegrationSetting::first();

        if (!$settings || !$settings->is_enabled || !$settings->hotel_api_url) {
            return response()->json([
                'message' => 'Hotel integration is not configured'
            ], 400);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $settings->hotel_api_token,
                'Accept' => 'application/json'
            ])->get($settings->hotel_api_url . '/api/guests/search', [
                'q' => $request->q
            ]);

            if (!$response->successful()) {
                Log::error('Hotel API guest search failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return response()->json([
                    'message' => 'Failed to search guests in hotel system'
                ], 500);
            }

            $guests = $response->json();

            return response()->json(['data' => $guests['data'] ?? []]);

        } catch (\Exception $e) {
            Log::error('Hotel API guest search error', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to connect to hotel system'
            ], 500);
        }
    }

    /**
     * Charge amount to guest folio
     */
    public function chargeToFolio(Request $request): JsonResponse
    {
        $request->validate([
            'guest_id' => 'required|integer',
            'folio_id' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string',
            'order_id' => 'nullable|integer'
        ]);

        $settings = HotelIntegrationSetting::first();

        if (!$settings || !$settings->is_enabled || !$settings->hotel_api_url) {
            return response()->json([
                'message' => 'Hotel integration is not configured'
            ], 400);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $settings->hotel_api_token,
                'Accept' => 'application/json'
            ])->post($settings->hotel_api_url . '/api/folios/charge', [
                'guest_id' => $request->guest_id,
                'folio_id' => $request->folio_id,
                'amount' => $request->amount,
                'description' => $request->description,
                'source' => 'pos',
                'reference' => $request->order_id ? "Order #{$request->order_id}" : null
            ]);

            if (!$response->successful()) {
                Log::error('Hotel API folio charge failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return response()->json([
                    'message' => 'Failed to charge to folio in hotel system'
                ], 500);
            }

            return response()->json([
                'message' => 'Successfully charged to guest folio',
                'data' => $response->json()
            ]);

        } catch (\Exception $e) {
            Log::error('Hotel API folio charge error', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to connect to hotel system'
            ], 500);
        }
    }
}
