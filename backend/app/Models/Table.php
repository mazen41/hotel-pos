<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Table extends Model
{
    protected $fillable = [
        'number',
        'name',
        'capacity',
        'status',
        'location',
        'notes',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function activeOrder()
    {
        return $this->hasOne(Order::class)
            ->whereIn('status', ['pending', 'processing'])
            ->latest();
    }

    public function getAvailableTables()
    {
        return self::where('status', 'available')->get();
    }

    public function getOccupiedTables()
    {
        return self::where('status', 'occupied')->get();
    }

    public function getPendingPaymentTables()
    {
        return self::where('status', 'pending_payment')->get();
    }
}
