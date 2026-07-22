<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Folio extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reservation_id',
        'guest_id',
        'folio_number',
        'status',
        'subtotal',
        'tax_amount',
        'fee_amount',
        'discount_amount',
        'total_amount',
        'paid_amount',
        'balance_due',
        'closed_at',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'fee_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'closed_at' => 'datetime',
    ];

    public function reservation()
    {
        return $this->belongsTo(\App\Models\Reservation::class);
    }

    public function guest()
    {
        return $this->belongsTo(\App\Models\Guest::class);
    }

    public function charges()
    {
        return $this->hasMany(\App\Models\Charge::class);
    }

    public function payments()
    {
        return $this->hasMany(\App\Models\Payment::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function scopeWithBalance($query)
    {
        return $query->where('balance_due', '>', 0);
    }

    public function updateTotals()
    {
        $this->subtotal = $this->charges()->sum('total_amount');
        $this->tax_amount = $this->charges()->sum('tax_amount');
        $this->total_amount = $this->subtotal + $this->tax_amount + $this->fee_amount - $this->discount_amount;
        $this->paid_amount = $this->payments()->where('status', 'completed')->sum('amount');
        $this->balance_due = $this->total_amount - $this->paid_amount;
        $this->save();
    }

    public function close()
    {
        $this->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($folio) {
            if (!$folio->folio_number) {
                $folio->folio_number = 'FOL-' . str_pad(static::max('id') + 1, 6, '0', STR_PAD_LEFT);
            }
        });
    }
}