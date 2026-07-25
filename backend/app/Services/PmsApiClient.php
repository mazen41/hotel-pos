<?php

namespace App\Services;

use App\Models\HotelIntegrationSetting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PmsApiClient
{
    public function __construct(private readonly ?HotelIntegrationSetting $settings = null)
    {
    }

    public function lookupRoomByNumber(string $roomNumber): array
    {
        return $this->request()->get("/api/rooms/{$roomNumber}")->throw()->json('data', []);
    }

    public function searchGuests(string $query): array
    {
        return $this->request()->get('/api/guests/search', ['q' => $query])->throw()->json('data', []);
    }

    public function postChargeToFolio(string $folioId, float $amount, string $description, array $metadata = []): array
    {
        return $this->request()->post('/api/billing/charges', array_merge($metadata, [
            'folio_id' => (int) $folioId,
            'amount' => $amount,
            'description' => $description,
            'charge_type' => 'food_beverage', // POS charges are typically food & beverage
            'total_amount' => $amount, // PMS expects total_amount
        ]))->throw()->json('data');
    }

    public function lookupGuestFolio(string $guestId): array
    {
        return $this->request()->get("/api/guests/{$guestId}/folio")->throw()->json('data', []);
    }

    public function getReservationFolio(int $reservationId): array
    {
        $folio = $this->request()->get('/api/billing/folios/lookup', ['reservation_id' => $reservationId])->throw()->json('data');

        return $folio ? [$folio] : [];
    }

    public function createFolio(int $reservationId, int $guestId): array
    {
        return $this->request()->post('/api/billing/folios', [
            'reservation_id' => $reservationId,
            'guest_id' => $guestId,
        ])->throw()->json('data', []);
    }

    private function request(): PendingRequest
    {
        $settings = $this->settings ?? HotelIntegrationSetting::getSettings();

        if (!$settings->is_enabled || blank($settings->hotel_api_url)) {
            throw new RuntimeException('PMS integration is not configured or enabled.');
        }

        return Http::baseUrl(rtrim($settings->hotel_api_url, '/'))
            ->acceptJson()
            ->when(filled($settings->hotel_api_token), fn (PendingRequest $request) => $request->withToken($settings->hotel_api_token));
    }
}
