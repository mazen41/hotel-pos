<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

/**
 * Room — Physical room inventory of the hotel.
 *
 * Each room is linked to a RoomType and has its own status and attributes.
 * This model supports future synchronization with channel managers through
 * external mapping fields.
 *
 * @property int         $id
 * @property int         $room_type_id
 * @property string      $room_number
 * @property string|null $floor
 * @property string      $status
 * @property string|null $notes
 * @property bool        $is_active
 * @property string|null $external_room_id
 * @property string|null $inventory_code
 * @property int         $sort_order
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property RoomType    $roomType
 */
class Room extends Model
{
    use SoftDeletes, LogsActivity;

    protected $table = 'rooms';

    protected $fillable = [
        // Room Type Relationship
        'room_type_id',
        // Room Identification
        'room_number',
        'floor',
        // Status
        'status',
        // Additional Information
        'notes',
        'is_active',
        // Channel Manager & Inventory Synchronization
        'external_room_id',
        'inventory_code',
        'sort_order',
    ];

    protected $casts = [
        'room_type_id' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    /**
     * Get the room type that this room belongs to.
     */
    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }

    /**
     * Get reservations linked to this room.
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Get availability records for this room.
     */
    public function availabilities(): HasMany
    {
        return $this->hasMany(Availability::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Scope a query to only include active rooms.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include available rooms.
     */
    public function scopeAvailable($query)
    {
        return $query->whereIn('status', ['available']);
    }

    /**
     * Scope a query to only include bookable rooms (not out of order or out of service).
     */
    public function scopeBookable($query)
    {
        return $query->whereNotIn('status', ['out_of_order', 'out_of_service']);
    }

    /**
     * Scope a query to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to filter by room type.
     */
    public function scopeByRoomType($query, int $roomTypeId)
    {
        return $query->where('room_type_id', $roomTypeId);
    }

    /**
     * Scope a query to search by room number.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where('room_number', 'like', '%' . $search . '%');
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /**
     * Get the formatted room number with type name.
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->room_number . ($this->roomType ? ' - ' . $this->roomType->name : '');
    }

    /**
     * Get the status label with proper formatting.
     */
    public function getStatusLabelAttribute(): string
    {
        return ucfirst(str_replace('_', ' ', $this->status));
    }

    /**
     * Get the status color for UI display.
     */
    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'available' => 'green',
            'occupied' => 'blue',
            'cleaning' => 'yellow',
            'maintenance' => 'orange',
            'out_of_order' => 'red',
            'out_of_service' => 'purple',
            default => 'gray',
        };
    }

    // ─── Activity Logging ───────────────────────────────────────────────────────

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['room_number', 'status', 'is_active', 'room_type_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
