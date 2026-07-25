<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * HotelSetting — Single source of truth for hotel-level configuration.
 *
 * This model uses a singleton pattern: the application always works
 * with exactly one row (id = 1). Use HotelSetting::current() to retrieve it.
 *
 * Fields feed into: reservations, pricing, invoicing, and channel manager
 * integrations (SiteMinder, Booking.com, Expedia, Airbnb).
 *
 * @property int         $id
 * @property string      $hotel_name
 * @property string|null $legal_business_name
 * @property string|null $logo_path
 * @property string|null $favicon_path
 * @property string|null $contact_email
 * @property string|null $contact_phone
 * @property string|null $website_url
 * @property string|null $country
 * @property string|null $city
 * @property string|null $address
 * @property string|null $postal_code
 * @property string      $timezone
 * @property string      $currency
 * @property string      $default_language
 * @property string      $check_in_time
 * @property string      $check_out_time
 * @property float       $tax_percentage
 * @property float       $service_charge_percentage
 * @property string|null $cancellation_policy
 * @property string|null $confirmation_policy
 * @property string|null $channel_property_code
 * @property string|null $channel_external_property_ref
 * @property string|null $channel_default_rate_plan_code
 * @property string|null $channel_default_inventory_code
 */
class HotelSetting extends Model
{
    protected $table = 'hotel_settings';

    protected $fillable = [
        // General
        'hotel_name',
        'legal_business_name',
        'logo_path',
        'favicon_path',
        'contact_email',
        'contact_phone',
        'website_url',
        // Location
        'country',
        'city',
        'address',
        'postal_code',
        // Operational
        'timezone',
        'currency',
        'default_language',
        'check_in_time',
        'check_out_time',
        // Financial
        'tax_percentage',
        'service_charge_percentage',
        // Booking
        'cancellation_policy',
        'confirmation_policy',
        // Channel Manager
        'channel_property_code',
        'channel_external_property_ref',
        'channel_default_rate_plan_code',
        'channel_default_inventory_code',
    ];

    protected $casts = [
        'tax_percentage'             => 'float',
        'service_charge_percentage'  => 'float',
    ];

    // ─── Singleton Access ─────────────────────────────────────────────────────

    /**
     * Retrieve the single hotel settings record, creating it if absent.
     */
    public static function current(): static
    {
        return static::firstOrCreate(
            ['id' => 1],
            ['hotel_name' => 'My Hotel']
        );
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /**
     * Full public URL for the logo, or null when not set.
     */
    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path
            ? url('storage/' . $this->logo_path)
            : null;
    }

    /**
     * Full public URL for the favicon, or null when not set.
     */
    public function getFaviconUrlAttribute(): ?string
    {
        return $this->favicon_path
            ? url('storage/' . $this->favicon_path)
            : null;
    }

    // ─── Appended attributes ──────────────────────────────────────────────────

    protected $appends = ['logo_url', 'favicon_url'];
}
