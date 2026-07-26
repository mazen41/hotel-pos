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

        return $this->handlePmsRequest(function () use ($validated) {
            $guests = $this->pmsApiClient->searchGuests($validated['q']);

            // Transform PMS guest data to match frontend expectations.
            // Note: we deliberately do NOT resolve or create a folio here — a
            // reservation may legitimately have no folio yet (nothing has been
            // charged/paid). Folio resolution/creation happens at charge time
            // in chargeToFolio(), not at search time.
            $transformedGuests = [];
            foreach ($guests as $guest) {
                $roomNumber = null;
                $reservationId = null;

                if (isset($guest['reservation_history']) && is_array($guest['reservation_history'])) {
                    foreach ($guest['reservation_history'] as $reservation) {
                        if (isset($reservation['status']) && in_array($reservation['status'], ['checked_in', 'confirmed'])) {
                            $roomNumber = $reservation['room']['room_number'] ?? $reservation['room_number'] ?? null;
                            $reservationId = $reservation['id'] ?? null;
                            break;
                        }
                    }
                }

                // Only include guests with an active reservation and a room assigned
                if ($roomNumber && $reservationId) {
                    $transformedGuests[] = [
                        'id' => $guest['id'],
                        'name' => $guest['full_name'] ?? trim(($guest['first_name'] ?? '') . ' ' . ($guest['last_name'] ?? '')),
                        'room_number' => $roomNumber,
                        'reservation_id' => $reservationId,
                    ];
                }
            }

            return $transformedGuests;
        });
    }

    public function chargeToFolio(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guest_id' => 'nullable',
            'reservation_id' => 'required',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string',
            'order_id' => 'nullable|integer',
        ]);

        return $this->handlePmsRequest(function () use ($validated) {
            $reservationId = (int) $validated['reservation_id'];

            // Resolve the reservation's open folio, creating one on the fly
            // if this is the first charge against it.
            $folioId = null;
            $folios = $this->pmsApiClient->getReservationFolio($reservationId);
            if (!empty($folios)) {
                $folioId = $folios[0]['id'] ?? null;
            }
            if (!$folioId) {
                $newFolio = $this->pmsApiClient->createFolio($reservationId, (int) ($validated['guest_id'] ?? 0));
                $folioId = $newFolio['id'] ?? null;
            }

            if (!$folioId) {
                throw new RuntimeException('Could not resolve or create a folio for this reservation.');
            }

            return $this->pmsApiClient->postChargeToFolio(
                (string) $folioId,
                (float) $validated['amount'],
                $validated['description'],
                [
                    'guest_id' => isset($validated['guest_id']) ? (string) $validated['guest_id'] : null,
                    'reference' => isset($validated['order_id']) ? "Order #{$validated['order_id']}" : null,
                ],
            );
        }, 'Successfully charged to guest folio');
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
