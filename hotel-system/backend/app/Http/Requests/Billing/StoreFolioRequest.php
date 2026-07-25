<?php

namespace App\Http\Requests\Billing;

use App\Models\Folio;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFolioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reservation_id' => ['required', 'integer', 'exists:reservations,id'],
            'guest_id' => ['required', 'integer', 'exists:guests,id'],
            'folio_number' => ['sometimes', 'string', 'max:50', 'unique:folios,folio_number'],
            'status' => ['sometimes', Rule::in(['open', 'closed', 'cancelled'])],
            'subtotal' => ['sometimes', 'numeric', 'min:0'],
            'tax_amount' => ['sometimes', 'numeric', 'min:0'],
            'fee_amount' => ['sometimes', 'numeric', 'min:0'],
            'discount_amount' => ['sometimes', 'numeric', 'min:0'],
            'total_amount' => ['sometimes', 'numeric', 'min:0'],
            'paid_amount' => ['sometimes', 'numeric', 'min:0'],
            'balance_due' => ['sometimes', 'numeric'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
