<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'folio_id',
        'reservation_id',
        'payment_number',
        'payment_method',
        'card_last_four',
        'card_type',
        'transaction_id',
        'amount',
        'status',
        'payment_date',
        'notes',
        'received_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'datetime',
    ];

    public function folio()
    {
        return $this->belongsTo(\App\Models\Folio::class);
    }

    public function reservation()
    {
        return $this->belongsTo(\App\Models\Reservation::class);
    }

    public function receivedBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'received_by');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByMethod($query, $method)
    {
        return $query->where('payment_method', $method);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            if (!$payment->payment_date) {
                $payment->payment_date = now();
            }
            if (!$payment->payment_number) {
                $payment->payment_number = 'PAY-' . str_pad(static::max('id') + 1, 6, '0', STR_PAD_LEFT);
            }
        });

        static::created(function ($payment) {
            $payment->folio->updateTotals();
        });

        static::updated(function ($payment) {
            $payment->folio->updateTotals();
        });

        static::deleted(function ($payment) {
            $payment->folio->updateTotals();
        });
    }
}
