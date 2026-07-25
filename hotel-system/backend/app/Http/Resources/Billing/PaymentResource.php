<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
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
            'payment_number' => $this->payment_number,
            'payment_method' => $this->payment_method,
            'card_last_four' => $this->card_last_four,
            'card_type' => $this->card_type,
            'transaction_id' => $this->transaction_id,
            'amount' => (float) $this->amount,
            'status' => $this->status,
            'payment_date' => $this->payment_date?->toIso8601String(),
            'notes' => $this->notes,
            'received_by' => $this->received_by,
            'received_by_user' => $this->whenLoaded('receivedBy', fn () => [
                'id' => $this->receivedBy->id,
                'name' => $this->receivedBy->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
