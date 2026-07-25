<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_number' => $this->reservation_number,
            'check_in_date' => $this->check_in_date?->toDateString(),
            'check_out_date' => $this->check_out_date?->toDateString(),
            'nights' => $this->nights,
            'confirmation_number' => $this->confirmation_number,
            'check_in' => $this->check_in?->toDateString(),
            'check_out' => $this->check_out?->toDateString(),
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'source' => $this->source,
            'total_amount' => $this->total_amount,
            'balance_due' => $this->balance_due,
        ];
    }
}
