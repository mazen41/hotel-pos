<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RatePlanResource extends JsonResource
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
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type,
            'pricing_type' => $this->pricing_type,
            'base_rate' => (float) $this->base_rate,
            'min_nights' => $this->min_nights,
            'max_nights' => $this->max_nights,
            'occupancy_based_pricing' => (bool) $this->occupancy_based_pricing,
            'allow_children' => (bool) $this->allow_children,
            'allow_extra_beds' => (bool) $this->allow_extra_beds,
            'extra_bed_price' => $this->extra_bed_price ? (float) $this->extra_bed_price : null,
            'meal_plan_included' => (bool) $this->meal_plan_included,
            'meal_plan_type' => $this->meal_plan_type,
            'cancellation_policy' => $this->cancellation_policy,
            'payment_policy' => $this->payment_policy,
            'active' => (bool) $this->active,
            'priority' => $this->priority,
            'available_channels' => $this->available_channels ?? ['direct'],
            'room_types' => $this->whenLoaded('roomTypes', function () {
                return $this->roomTypes->map(function ($roomType) {
                    return [
                        'id' => $roomType->id,
                        'name' => $roomType->name,
                        'rate' => (float) $roomType->pivot->rate,
                    ];
                });
            }),
            'seasonal_rates' => $this->whenLoaded('seasonalRates', function () {
                return $this->seasonalRates->map(function ($seasonalRate) {
                    return [
                        'id' => $seasonalRate->id,
                        'name' => $seasonalRate->name,
                        'start_date' => $seasonalRate->start_date->format('Y-m-d'),
                        'end_date' => $seasonalRate->end_date->format('Y-m-d'),
                        'rate' => (float) $seasonalRate->rate,
                        'rate_type' => $seasonalRate->rate_type,
                        'min_stay' => $seasonalRate->min_stay,
                        'max_stay' => $seasonalRate->max_stay,
                        'applies_to_all_room_types' => (bool) $seasonalRate->applies_to_all_room_types,
                        'room_types' => $seasonalRate->room_types,
                        'active' => (bool) $seasonalRate->active,
                    ];
                });
            }),
            'dynamic_pricing_rules' => $this->whenLoaded('dynamicPricingRules', function () {
                return $this->dynamicPricingRules->map(function ($rule) {
                    return [
                        'id' => $rule->id,
                        'name' => $rule->name,
                        'rule_type' => $rule->rule_type,
                        'condition' => $rule->condition,
                        'action' => $rule->action,
                        'value' => (float) $rule->value,
                        'value_type' => $rule->value_type,
                        'min_value' => $rule->min_value ? (float) $rule->min_value : null,
                        'max_value' => $rule->max_value ? (float) $rule->max_value : null,
                        'applies_to_all_room_types' => (bool) $rule->applies_to_all_room_types,
                        'room_types' => $rule->room_types,
                        'active' => (bool) $rule->active,
                    ];
                });
            }),
            'restrictions' => $this->whenLoaded('restrictions', function () {
                return $this->restrictions->map(function ($restriction) {
                    return [
                        'id' => $restriction->id,
                        'restriction_type' => $restriction->restriction_type,
                        'start_date' => $restriction->start_date->format('Y-m-d'),
                        'end_date' => $restriction->end_date->format('Y-m-d'),
                        'value' => $restriction->value,
                        'description' => $restriction->description,
                        'applies_to_all_room_types' => (bool) $restriction->applies_to_all_room_types,
                        'room_types' => $restriction->room_types,
                        'active' => (bool) $restriction->active,
                    ];
                });
            }),
            'channel_sync_enabled' => (bool) $this->channel_sync_enabled,
            'channel_manager_references' => $this->channel_manager_references,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}