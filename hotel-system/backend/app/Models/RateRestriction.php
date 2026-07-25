<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RateRestriction extends Model
{
    use HasFactory;

    protected $fillable = [
        'rate_plan_id',
        'restriction_type',
        'start_date',
        'end_date',
        'value',
        'description',
        'applies_to_all_room_types',
        'room_types',
        'active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'value' => 'integer',
        'applies_to_all_room_types' => 'boolean',
        'room_types' => 'array',
        'active' => 'boolean',
    ];

    public function ratePlan(): BelongsTo
    {
        return $this->belongsTo(RatePlan::class);
    }

    public function roomTypes(): BelongsToMany
    {
        return $this->belongsToMany(RoomType::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeByRestrictionType($query, $restrictionType)
    {
        return $query->where('restriction_type', $restrictionType);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->where('start_date', '<=', $endDate)
              ->where('end_date', '>=', $startDate);
        });
    }

    public function scopeCurrent($query)
    {
        $today = now()->toDateString();
        return $query->where('start_date', '<=', $today)
                      ->where('end_date', '>=', $today);
    }

    public function isBlackoutDate(): bool
    {
        return $this->restriction_type === 'blackout_date';
    }

    public function isMinStay(): bool
    {
        return $this->restriction_type === 'min_stay';
    }

    public function isMaxStay(): bool
    {
        return $this->restriction_type === 'max_stay';
    }

    public function isCheckInRestricted(): bool
    {
        return $this->restriction_type === 'check_in';
    }

    public function isCheckOutRestricted(): bool
    {
        return $this->restriction_type === 'check_out';
    }

    public function appliesToDate(string $date): bool
    {
        return $this->active && 
               $date >= $this->start_date && 
               $date <= $this->end_date;
    }

    public function appliesToRoomType(int $roomTypeId): bool
    {
        if ($this->applies_to_all_room_types) {
            return true;
        }
        return in_array($roomTypeId, $this->room_types ?? []);
    }
}