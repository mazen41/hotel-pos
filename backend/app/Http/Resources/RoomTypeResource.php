<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * RoomTypeResource — API transformation for RoomType model.
 *
 * Provides a consistent JSON structure for room type data across all API endpoints.
 * Includes all fields necessary for frontend display and channel manager integration.
 */
class RoomTypeResource extends JsonResource
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
            
            // ── Basic Information ───────────────────────────────────────────────
            'name' => $this->name,
            'description' => $this->description,
            
            // ── Pricing ─────────────────────────────────────────────────────────
            'base_price' => (float) $this->base_price,
            'formatted_price' => $this->formatted_price,
            'meal_plan' => $this->meal_plan,
            'rates' => $this->rates,
            
            // ── Occupancy ───────────────────────────────────────────────────────
            'max_adults' => $this->max_adults,
            'max_children' => $this->max_children,
            'max_occupancy' => $this->max_occupancy,
            'occupancy_description' => $this->occupancy_description,
            
            // ── Room Details ─────────────────────────────────────────────────────
            'bed_type' => $this->bed_type,
            'amenities' => $this->amenities ?? [],
            'images' => $this->images ?? [],
            
            // ── Status ─────────────────────────────────────────────────────────
            'is_active' => $this->is_active,
            
            // ── Channel Manager Integration ─────────────────────────────────────
            'external_mapping_id' => $this->external_mapping_id,
            'channel_manager_code' => $this->channel_manager_code,
            'rate_plan_code' => $this->rate_plan_code,
            
            // ── Timestamps ─────────────────────────────────────────────────────
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
