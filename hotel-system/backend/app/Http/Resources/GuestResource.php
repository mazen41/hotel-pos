<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GuestResource — API transformation for guest CRM profiles.
 */
class GuestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'country' => $this->country,
            'city' => $this->city,
            'address' => $this->address,
            'passport_number' => $this->passport_number,
            'national_id' => $this->national_id,
            'primary_identifier' => $this->primary_identifier,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'notes' => $this->notes,
            'vip_status' => $this->vip_status,
            'marketing_consent' => $this->marketing_consent,
            'reservations_count' => $this->whenCounted('reservations'),
            'reservation_history' => $this->whenLoaded('reservations', fn () => ReservationSummaryResource::collection($this->reservations)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
