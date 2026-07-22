<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

/**
 * Reservation — front-desk booking record prepared for NoBeds OTA imports.
 * Reservation — placeholder model for guest relationship support.
 *
 * The reservation workflow will be implemented in a later phase; this model
 * only exposes relationships needed by Guest Management today.
 */
class Reservation extends Model
{
    use SoftDeletes, LogsActivity;

    public const ACTIVE_STATUSES = ['pending', 'confirmed', 'checked_in'];

    public const STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];

    public const PAYMENT_STATUSES = ['unpaid', 'partially_paid', 'paid', 'refunded'];

    protected $fillable = [
        'group_id',
        'reservation_number',
        'guest_id',
        'room_id',
        'room_type_id',
        'rate_plan_id',
        'rate_plan_applied_amount',
        'source',
        'check_in_date',
        'check_out_date',
        'adults',
        'children',
        'nights',
        'status',
        'payment_status',
        'subtotal',
        'taxes',
        'fees',
        'total_amount',
        'paid_amount',
        'balance_due',
        'special_requests',
        'internal_notes',
        'external_reservation_id',
        'channel_manager_reference',
        'synced_at',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected $casts = [
        'group_id' => 'integer',
        'guest_id' => 'integer',
        'room_id' => 'integer',
        'room_type_id' => 'integer',
        'rate_plan_id' => 'integer',
        'rate_plan_applied_amount' => 'decimal:2',
        'check_in_date' => 'date',
        'check_out_date' => 'date',
        'adults' => 'integer',
        'children' => 'integer',
        'nights' => 'integer',
        'subtotal' => 'decimal:2',
        'taxes' => 'decimal:2',
        'fees' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'synced_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }

    public function ratePlan(): BelongsTo
    {
        return $this->belongsTo(RatePlan::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'group_id');
    }

    public function groupMembers(): HasMany
    {
        return $this->hasMany(Reservation::class, 'group_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', self::ACTIVE_STATUSES);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        $search = trim((string) $search);

        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $query) use ($search): void {
            $query->where('reservation_number', 'like', "%{$search}%")
                ->orWhere('external_reservation_id', 'like', "%{$search}%")
                ->orWhere('channel_manager_reference', 'like', "%{$search}%")
                ->orWhereHas('guest', function (Builder $query) use ($search): void {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
        });
    }

    public function scopeOverlapping(Builder $query, string $checkInDate, string $checkOutDate): Builder
    {
        return $query->where('check_in_date', '<', $checkOutDate)
            ->where('check_out_date', '>', $checkInDate);
    }

    public function scopeByGroup(Builder $query, ?int $groupId): Builder
    {
        if ($groupId === null) {
            return $query->whereNull('group_id');
        }
        return $query->where('group_id', $groupId);
    }

    // ─── Activity Logging ───────────────────────────────────────────────────────

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'payment_status', 'check_in_date', 'check_out_date', 'room_id', 'guest_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
