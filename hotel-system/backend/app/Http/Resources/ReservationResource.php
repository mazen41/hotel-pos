<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'group_id' => $this->group_id,
            'group' => $this->whenLoaded('group', fn () => new ReservationResource($this->group)),
            'group_members' => $this->whenLoaded('groupMembers', fn () => ReservationResource::collection($this->groupMembers)),
            'reservation_number' => $this->reservation_number,
            'guest_id' => $this->guest_id,
            'guest' => $this->whenLoaded('guest', fn () => new GuestResource($this->guest)),
            'room_id' => $this->room_id,
            'room' => $this->whenLoaded('room', fn () => new RoomResource($this->room)),
            'room_type_id' => $this->room_type_id,
            'room_type' => $this->whenLoaded('roomType', fn () => new RoomTypeResource($this->roomType)),
            'rate_plan_id' => $this->rate_plan_id,
            'rate_plan' => $this->whenLoaded('ratePlan', fn () => $this->ratePlan ? [
                'id' => $this->ratePlan->id,
                'name' => $this->ratePlan->name,
                'type' => $this->ratePlan->type,
                'base_rate' => (float) $this->ratePlan->base_rate,
            ] : null),
            'rate_plan_applied_amount' => $this->rate_plan_applied_amount ? (float) $this->rate_plan_applied_amount : null,
            'source' => $this->source,
            'check_in_date' => $this->check_in_date?->toDateString(),
            'check_out_date' => $this->check_out_date?->toDateString(),
            'adults' => $this->adults,
            'children' => $this->children,
            'nights' => $this->nights,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'subtotal' => $this->subtotal,
            'taxes' => $this->taxes,
            'fees' => $this->fees,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'balance_due' => $this->balance_due,
            'special_requests' => $this->special_requests,
            'internal_notes' => $this->internal_notes,
            'external_reservation_id' => $this->external_reservation_id,
            'channel_manager_reference' => $this->channel_manager_reference,
            'synced_at' => $this->synced_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $this->cancellation_reason,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
