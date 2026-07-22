<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Availability extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_id',
        'date',
        'status',
        'reservation_id',
        'price',
        'stop_sell',
        'min_stay_enforced',
        'min_stay',
        'max_stay_enforced',
        'max_stay',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'price' => 'decimal:2',
        'stop_sell' => 'boolean',
        'min_stay_enforced' => 'boolean',
        'max_stay_enforced' => 'boolean',
    ];

    /**
     * Get the room that owns the availability.
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the reservation that owns the availability.
     */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    /**
     * Scope a query to only include available rooms.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')->where('stop_sell', false);
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope a query to filter by room type.
     */
    public function scopeByRoomType($query, $roomTypeId)
    {
        return $query->whereHas('room', function ($q) use ($roomTypeId) {
            $q->where('room_type_id', $roomTypeId);
        });
    }

    /**
     * Check if room is available for booking.
     */
    public function isBookable(): bool
    {
        return $this->status === 'available' && !$this->stop_sell;
    }
}
