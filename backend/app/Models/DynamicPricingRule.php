<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DynamicPricingRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'rate_plan_id',
        'name',
        'rule_type',
        'condition',
        'action',
        'value',
        'value_type',
        'min_value',
        'max_value',
        'applies_to_all_room_types',
        'room_types',
        'active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_value' => 'decimal:2',
        'max_value' => 'decimal:2',
        'condition' => 'array',
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

    public function scopeByRuleType($query, $ruleType)
    {
        return $query->where('rule_type', $ruleType);
    }

    public function applyRule(float $baseRate, array $context = []): float
    {
        if (!$this->matchesConditions($context)) {
            return $baseRate;
        }

        $adjustment = $this->calculateAdjustment($baseRate);
        
        // Apply min/max constraints
        if ($this->min_value !== null && $adjustment < $this->min_value) {
            return $this->min_value;
        }
        if ($this->max_value !== null && $adjustment > $this->max_value) {
            return $this->max_value;
        }

        return $adjustment;
    }

    protected function matchesConditions(array $context): bool
    {
        if (empty($this->condition)) {
            return true;
        }

        foreach ($this->condition as $key => $value) {
            if (!isset($context[$key])) {
                return false;
            }

            if (is_array($value)) {
                if (!in_array($context[$key], $value)) {
                    return false;
                }
            } elseif ($context[$key] != $value) {
                return false;
            }
        }

        return true;
    }

    protected function calculateAdjustment(float $baseRate): float
    {
        if ($this->value_type === 'percentage') {
            $percentage = $this->value / 100;
            if ($this->action === 'increase') {
                return $baseRate * (1 + $percentage);
            } else {
                return $baseRate * (1 - $percentage);
            }
        } else {
            if ($this->action === 'increase') {
                return $baseRate + $this->value;
            } else {
                return $baseRate - $this->value;
            }
        }
    }
}