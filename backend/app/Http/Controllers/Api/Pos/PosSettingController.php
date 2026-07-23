<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\PosSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PosSettingController extends Controller
{
    /**
     * Get POS settings — auto-creates a row with sensible defaults on first call.
     */
    public function get(): JsonResponse
    {
        $settings = PosSetting::firstOrCreate([], [
            'require_open_shift_for_cash'   => true,
            'auto_print_receipt'            => false,
            'default_payment_method'        => 'cash',
            'receipt_footer'                => null,
            'tax_percentage'                => 14,
            'tax_enabled'                   => true,
            'service_charge_percentage'     => 0,
            'service_charge_enabled'        => false,
            'currency'                      => 'EGP',
            'currency_symbol'               => 'EGP',
            'auto_approve_return_threshold' => 50,
        ]);

        return response()->json(['data' => $settings]);
    }

    /**
     * Update POS settings.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'require_open_shift_for_cash'   => 'boolean',
            'auto_print_receipt'            => 'boolean',
            'default_payment_method'        => 'string|max:50',
            'receipt_footer'                => 'nullable|string',
            'tax_percentage'                => 'numeric|min:0|max:100',
            'tax_enabled'                   => 'boolean',
            'service_charge_percentage'     => 'numeric|min:0|max:100',
            'service_charge_enabled'        => 'boolean',
            'currency'                      => 'string|max:10',
            'currency_symbol'               => 'string|max:10',
            'auto_approve_return_threshold' => 'numeric|min:0',
        ]);

        $settings = PosSetting::first();

        if (!$settings) {
            return response()->json(['message' => 'Settings not found.'], 404);
        }

        $settings->update($request->only([
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
        ]));

        return response()->json([
            'message' => 'POS settings updated successfully.',
            'data'    => $settings->fresh(),
        ]);
    }
}
