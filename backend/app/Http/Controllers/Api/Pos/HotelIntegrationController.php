<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\HotelIntegrationSetting;
use App\Services\PmsApiClient;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class HotelIntegrationController extends Controller
{
    public function __construct(private readonly PmsApiClient $pmsApiClient)
    {
    }

    public function getSettings(): JsonResponse
    {
        return response()->json(['data' => HotelIntegrationSetting::getSettings()]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hotel_api_url' => 'nullable|url',
            'hotel_api_token' => 'nullable|string',
            'is_enabled' => 'boolean',
        ]);

        $settings = HotelIntegrationSetting::getSettings();
        $settings->update($validated);

        return response()->json([
            'message' => 'PMS API integration settings updated successfully',
            'data' => $settings,
        ]);
    }

    public function lookupRoom(string $roomNumber): JsonResponse
    {
        return $this->handlePmsRequest(fn () => $this->pmsApiClient->lookupRoomByNumber($roomNumber));
    }

    public function searchGuest(Request $request): JsonResponse
    {
        $validated = $request->validate(['q' => 'required|string|min:2']);

        return $this->handlePmsRequest(fn () => $this->pmsApiClient->searchGuests($validated['q']));
    }

    public function chargeToFolio(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guest_id' => 'nullable|string',
            'folio_id' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string',
            'order_id' => 'nullable|integer',
        ]);

        return $this->handlePmsRequest(fn () => $this->pmsApiClient->postChargeToFolio(
            $validated['folio_id'],
            (float) $validated['amount'],
            $validated['description'],
            [
                'guest_id' => $validated['guest_id'] ?? null,
                'reference' => isset($validated['order_id']) ? "Order #{$validated['order_id']}" : null,
            ],
        ), 'Successfully charged to guest folio');
    }

    private function handlePmsRequest(callable $callback, string $message = null): JsonResponse
    {
        try {
            $data = $callback();

            return response()->json(array_filter([
                'message' => $message,
                'data' => $data,
            ]));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 400);
        } catch (ConnectionException|RequestException $exception) {
            Log::error('External PMS API request failed', ['error' => $exception->getMessage()]);

            return response()->json(['message' => 'Failed to communicate with external PMS API'], 502);
        }
    }
}
