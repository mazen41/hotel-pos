<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class RatePlan extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'name',
        'description',
        'type',
        'pricing_type',
        'base_rate',
        'min_nights',
        'max_nights',
        'occupancy_based_pricing',
        'allow_children',
        'allow_extra_beds',
        'extra_bed_price',
        'meal_plan_included',
        'meal_plan_type',
        'cancellation_policy',
        'payment_policy',
        'active',
        'priority',
        'available_channels',
        'channel_sync_enabled',
        'channel_manager_references',
    ];

    protected $casts = [
        'base_rate' => 'decimal:2',
        'extra_bed_price' => 'decimal:2',
        'occupancy_based_pricing' => 'boolean',
        'allow_children' => 'boolean',
        'allow_extra_beds' => 'boolean',
        'meal_plan_included' => 'boolean',
        'active' => 'boolean',
        'priority' => 'integer',
        'available_channels' => 'array',
        'channel_sync_enabled' => 'boolean',
        'channel_manager_references' => 'array',
    ];

    public function roomTypes(): BelongsToMany
    {
        return $this->belongsToMany(RoomType::class, 'rate_plan_room_type')
            ->withPivot('rate')
            ->withTimestamps();
    }

    public function seasonalRates(): HasMany
    {
        return $this->hasMany(SeasonalRate::class);
    }

    public function dynamicPricingRules(): HasMany
    {
        return $this->hasMany(DynamicPricingRule::class);
    }

    public function restrictions(): HasMany
    {
        return $this->hasMany(RateRestriction::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('active', false);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }

    public function activate(): bool
    {
        $this->active = true;
        return $this->save();
    }

    public function deactivate(): bool
    {
        $this->active = false;
        return $this->save();
    }

    public function duplicate(string $newName): self
    {
        $newRatePlan = $this->replicate();
        $newRatePlan->name = $newName;
        $newRatePlan->active = false;
        $newRatePlan->save();

        // Duplicate room type rates
        foreach ($this->roomTypes as $roomType) {
            $newRatePlan->roomTypes()->attach($roomType->id, [
                'rate' => $roomType->pivot->rate
            ]);
        }

        // Duplicate seasonal rates
        foreach ($this->seasonalRates as $seasonalRate) {
            $newSeasonalRate = $seasonalRate->replicate();
            $newSeasonalRate->rate_plan_id = $newRatePlan->id;
            $newSeasonalRate->save();
        }

        // Duplicate dynamic pricing rules
        foreach ($this->dynamicPricingRules as $rule) {
            $newRule = $rule->replicate();
            $newRule->rate_plan_id = $newRatePlan->id;
            $newRule->save();
        }

        // Duplicate restrictions
        foreach ($this->restrictions as $restriction) {
            $newRestriction = $restriction->replicate();
            $newRestriction->rate_plan_id = $newRatePlan->id;
            $newRestriction->save();
        }

        return $newRatePlan;
    }

    // ─── Activity Logging ───────────────────────────────────────────────────────

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'description', 'type', 'base_rate', 'active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}