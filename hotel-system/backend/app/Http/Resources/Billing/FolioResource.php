<?php

namespace App\Http\Resources\Billing;

use App\Http\Resources\GuestResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FolioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_id' => $this->reservation_id,
            'reservation' => $this->whenLoaded('reservation', fn () => [
                'id' => $this->reservation->id,
                'reservation_number' => $this->reservation->reservation_number,
                'check_in_date' => $this->reservation->check_in_date?->toDateString(),
                'check_out_date' => $this->reservation->check_out_date?->toDateString(),
            ]),
            'guest_id' => $this->guest_id,
            'guest' => $this->whenLoaded('guest', fn () => new GuestResource($this->guest)),
            'folio_number' => $this->folio_number,
            'status' => $this->status,
            'subtotal' => (float) $this->subtotal,
            'tax_amount' => (float) $this->tax_amount,
            'fee_amount' => (float) $this->fee_amount,
            'discount_amount' => (float) $this->discount_amount,
            'total_amount' => (float) $this->total_amount,
            'paid_amount' => (float) $this->paid_amount,
            'balance_due' => (float) $this->balance_due,
            'closed_at' => $this->closed_at?->toIso8601String(),
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'created_by_user' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'charges' => $this->whenLoaded('charges', fn () => ChargeResource::collection($this->charges)),
            'payments' => $this->whenLoaded('payments', fn () => PaymentResource::collection($this->payments)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
