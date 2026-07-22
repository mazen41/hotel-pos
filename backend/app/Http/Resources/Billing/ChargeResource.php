<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChargeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'folio_id' => $this->folio_id,
            'folio' => $this->whenLoaded('folio', fn () => [
                'id' => $this->folio->id,
                'folio_number' => $this->folio->folio_number,
                'status' => $this->folio->status,
            ]),
            'reservation_id' => $this->reservation_id,
            'reservation' => $this->whenLoaded('reservation', fn () => [
                'id' => $this->reservation->id,
                'reservation_number' => $this->reservation->reservation_number,
            ]),
            'charge_type' => $this->charge_type,
            'description' => $this->description,
            'amount' => (float) $this->amount,
            'tax_amount' => (float) $this->tax_amount,
            'total_amount' => (float) $this->total_amount,
            'charged_at' => $this->charged_at?->toIso8601String(),
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'created_by_user' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
