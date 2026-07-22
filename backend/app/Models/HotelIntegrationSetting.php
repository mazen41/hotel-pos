<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HotelIntegrationSetting extends Model
{
    protected $fillable = [
        'hotel_api_url',
        'hotel_api_token',
        'is_enabled',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public static function getSettings(): self
    {
        return self::firstOrCreate([], [
            'hotel_api_url' => '',
            'hotel_api_token' => '',
            'is_enabled' => false,
        ]);
    }
}
