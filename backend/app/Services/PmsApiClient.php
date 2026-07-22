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
        return $this->request()->post('/api/folios/charge', array_merge($metadata, [
            'folio_id' => $folioId,
            'amount' => $amount,
            'description' => $description,
            'source' => 'pos',
        ]))->throw()->json();
    }

    public function lookupGuestFolio(string $guestId): array
    {
        return $this->request()->get("/api/guests/{$guestId}/folio")->throw()->json('data', []);
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
