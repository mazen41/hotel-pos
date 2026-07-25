<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Charge extends Model
{
    use HasFactory;

    protected $fillable = [
        'folio_id',
        'reservation_id',
        'charge_type',
        'description',
        'amount',
        'tax_amount',
        'total_amount',
        'charged_at',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'charged_at' => 'datetime',
    ];

    public function folio()
    {
        return $this->belongsTo(\App\Models\Folio::class);
    }

    public function reservation()
    {
        return $this->belongsTo(\App\Models\Reservation::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('charge_type', $type);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($charge) {
            if (!$charge->charged_at) {
                $charge->charged_at = now();
            }
            if (!$charge->total_amount) {
                $charge->total_amount = $charge->amount + $charge->tax_amount;
            }
        });

        static::created(function ($charge) {
            $charge->folio->updateTotals();
        });

        static::updated(function ($charge) {
            $charge->folio->updateTotals();
        });

        static::deleted(function ($charge) {
            $charge->folio->updateTotals();
        });
    }
}