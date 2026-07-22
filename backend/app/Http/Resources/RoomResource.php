<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * RoomResource — API transformation for Room model.
 *
 * Provides a consistent JSON structure for room data across all API endpoints.
 * Includes room type information and all fields necessary for frontend display
 * and channel manager integration.
 */
class RoomResource extends JsonResource
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
            
            // ── Room Type Relationship ─────────────────────────────────────────
            'room_type_id' => $this->room_type_id,
            'room_type' => $this->whenLoaded('roomType', fn () => new RoomTypeResource($this->roomType)),
            
            // ── Room Identification ─────────────────────────────────────────────
            'room_number' => $this->room_number,
            'display_name' => $this->display_name,
            'floor' => $this->floor,
            
            // ── Status ─────────────────────────────────────────────────────────
            'status' => $this->status,
            'status_label' => $this->status_label,
            'status_color' => $this->status_color,
            
            // ── Additional Information ───────────────────────────────────────────
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            
            // ── Channel Manager & Inventory Synchronization ─────────────────────
            'external_room_id' => $this->external_room_id,
            'inventory_code' => $this->inventory_code,
            'sort_order' => $this->sort_order,
            
            // ── Timestamps ─────────────────────────────────────────────────────
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
