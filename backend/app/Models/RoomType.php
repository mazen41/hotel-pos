<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * RoomType — Foundation for pricing, reservations, inventory, and channel manager integrations.
 *
 * This model supports future synchronization with external systems such as
 * SiteMinder, Booking.com, Expedia, and Airbnb through the external mapping fields.
 *
 * @property int         $id
 * @property string      $name
 * @property string|null $description
 * @property float       $base_price
 * @property string|null $meal_plan
 * @property array|null  $rates
 * @property int         $max_adults
 * @property int         $max_children
 * @property int         $max_occupancy
 * @property string|null $bed_type
 * @property array|null  $amenities
 * @property array|null  $images
 * @property bool        $is_active
 * @property string|null $external_mapping_id
 * @property string|null $channel_manager_code
 * @property string|null $rate_plan_code
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
class RoomType extends Model
{
    use SoftDeletes;

    protected $table = 'room_types';

    protected $fillable = [
        // Basic Information
        'name',
        'description',
        // Pricing
        'base_price',
        'meal_plan',
        'rates',
        // Occupancy
        'max_adults',
        'max_children',
        'max_occupancy',
        // Room Details
        'bed_type',
        'amenities',
        'images',
        // Status
        'is_active',
        // Channel Manager Integration
        'external_mapping_id',
        'channel_manager_code',
        'rate_plan_code',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'meal_plan' => 'string',
        'rates' => 'array',
        'max_adults' => 'integer',
        'max_children' => 'integer',
        'max_occupancy' => 'integer',
        'amenities' => 'array',
        'images' => 'array',
        'is_active' => 'boolean',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Scope a query to only include active room types.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /**
     * Get the formatted base price.
     */
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->base_price, 2);
    }

    /**
     * Get the full occupancy description.
     */
    public function getOccupancyDescriptionAttribute(): string
    {
        $parts = [];
        if ($this->max_adults > 0) {
            $parts[] = "{$this->max_adults} adult" . ($this->max_adults > 1 ? 's' : '');
        }
        if ($this->max_children > 0) {
            $parts[] = "{$this->max_children} child" . ($this->max_children > 1 ? 'ren' : '');
        }
        return implode(', ', $parts) ?: 'No occupancy limit';
    }

    // ─── Relationships ──────────────────────────────────────────────────────────

    public function ratePlans()
    {
        return $this->belongsToMany(RatePlan::class, 'rate_plan_room_type')
            ->withPivot('rate')
            ->withTimestamps();
    }
}
