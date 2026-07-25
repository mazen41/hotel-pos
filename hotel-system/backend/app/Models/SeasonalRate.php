<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SeasonalRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'rate_plan_id',
        'name',
        'start_date',
        'end_date',
        'rate',
        'rate_type',
        'min_stay',
        'max_stay',
        'applies_to_all_room_types',
        'room_types',
        'active',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'min_stay' => 'integer',
        'max_stay' => 'integer',
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

    public function scopeCurrent($query)
    {
        $today = now()->toDateString();
        return $query->where('start_date', '<=', $today)
                      ->where('end_date', '>=', $today);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->where('start_date', '<=', $endDate)
              ->where('end_date', '>=', $startDate);
        });
    }

    public function isActiveForDate(string $date): bool
    {
        return $this->active && 
               $date >= $this->start_date && 
               $date <= $this->end_date;
    }
}