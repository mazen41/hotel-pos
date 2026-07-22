<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvailabilityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'room_id' => $this->room_id,
            'room' => new RoomResource($this->whenLoaded('room')),
            'date' => $this->date->format('Y-m-d'),
            'status' => $this->status,
            'reservation_id' => $this->reservation_id,
            'reservation' => new ReservationResource($this->whenLoaded('reservation')),
            'price' => $this->price,
            'stop_sell' => $this->stop_sell,
            'min_stay_enforced' => $this->min_stay_enforced,
            'min_stay' => $this->min_stay,
            'max_stay_enforced' => $this->max_stay_enforced,
            'max_stay' => $this->max_stay,
            'notes' => $this->notes,
            'is_bookable' => $this->isBookable(),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
