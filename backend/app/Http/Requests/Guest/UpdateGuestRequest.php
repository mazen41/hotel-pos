<?php

namespace App\Http\Requests\Guest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $guestId = $this->route('guest')?->id ?? $this->route('guest');

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email:rfc', 'max:255', Rule::unique('guests', 'email')->ignore($guestId)],
            'phone' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:1000'],
            'passport_number' => ['nullable', 'string', 'max:100', Rule::unique('guests', 'passport_number')->ignore($guestId)],
            'national_id' => ['nullable', 'string', 'max:100', Rule::unique('guests', 'national_id')->ignore($guestId)],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'vip_status' => ['sometimes', 'boolean'],
            'marketing_consent' => ['sometimes', 'boolean'],
        ];
    }
}
