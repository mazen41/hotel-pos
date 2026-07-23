<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosSetting extends Model
{
    protected $fillable = [
        'require_open_shift_for_cash',
        'auto_print_receipt',
        'default_payment_method',
        'receipt_footer',
        'tax_percentage',
        'tax_enabled',
        'service_charge_percentage',
        'service_charge_enabled',
        'currency',
        'currency_symbol',
        'auto_approve_return_threshold',
    ];

    protected $casts = [
        'require_open_shift_for_cash' => 'boolean',
        'auto_print_receipt'          => 'boolean',
        'tax_enabled'                 => 'boolean',
        'service_charge_enabled'      => 'boolean',
        'tax_percentage'              => 'decimal:2',
        'service_charge_percentage'   => 'decimal:2',
        'auto_approve_return_threshold' => 'decimal:2',
    ];

    public static function getSettings(): self
    {
        return self::firstOrCreate([], [
            'require_open_shift_for_cash'   => true,
            'auto_print_receipt'            => false,
            'default_payment_method'        => 'cash',
            'tax_percentage'                => 14,
            'tax_enabled'                   => true,
            'service_charge_percentage'     => 0,
            'service_charge_enabled'        => false,
            'currency'                      => 'EGP',
            'currency_symbol'               => 'EGP',
            'auto_approve_return_threshold' => 50,
        ]);
    }
}
