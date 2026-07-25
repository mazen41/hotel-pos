<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'folio_id' => ['sometimes', 'integer', 'exists:folios,id'],
            'reservation_id' => ['nullable', 'integer', 'exists:reservations,id'],
            'payment_number' => ['sometimes', 'string', 'max:50', Rule::unique('payments', 'payment_number')->ignore($this->payment)],
            'payment_method' => ['sometimes', Rule::in(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'online_payment'])],
            'card_last_four' => ['nullable', 'string', 'max:4'],
            'card_type' => ['nullable', 'string', 'max:50'],
            'transaction_id' => ['nullable', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in(['pending', 'completed', 'failed', 'refunded'])],
            'payment_date' => ['sometimes', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
