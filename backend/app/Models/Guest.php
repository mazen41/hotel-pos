<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

/**
 * Guest — CRM profile for direct, repeat, and OTA-imported hotel guests.
 *
 * Stores identity, contact, consent, VIP, and future analytics fields while
 * remaining ready for reservations, billing, loyalty, and NoBeds imports.
 */
class Guest extends Model
{
    use SoftDeletes, LogsActivity;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'country',
        'city',
        'address',
        'passport_number',
        'national_id',
        'date_of_birth',
        'notes',
        'vip_status',
        'marketing_consent',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'vip_status' => 'boolean',
        'marketing_consent' => 'boolean',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    /**
     * Reservations owned by this guest.
     *
     * Kept intentionally lightweight until the reservation module is built.
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        $search = trim((string) $search);

        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $query) use ($search): void {
            $query->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('passport_number', 'like', "%{$search}%");
        });
    }

    public function scopeVip(Builder $query, bool $vip = true): Builder
    {
        return $query->where('vip_status', $vip);
    }

    public function scopeMarketingConsent(Builder $query, bool $consent = true): Builder
    {
        return $query->where('marketing_consent', $consent);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getPrimaryIdentifierAttribute(): ?string
    {
        return $this->passport_number ?: $this->national_id;
    }

    // ─── Activity Logging ───────────────────────────────────────────────────────

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['first_name', 'last_name', 'email', 'phone', 'vip_status', 'marketing_consent'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
