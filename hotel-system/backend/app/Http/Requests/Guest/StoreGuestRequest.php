<?php

namespace App\Http\Requests\Guest;

use Illuminate\Foundation\Http\FormRequest;

class StoreGuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email:rfc', 'max:255', 'unique:guests,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:1000'],
            'passport_number' => ['nullable', 'string', 'max:100', 'unique:guests,passport_number'],
            'national_id' => ['nullable', 'string', 'max:100', 'unique:guests,national_id'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'vip_status' => ['sometimes', 'boolean'],
            'marketing_consent' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Guest first name is required.',
            'last_name.required' => 'Guest last name is required.',
            'email.email' => 'Enter a valid guest email address.',
            'email.unique' => 'A guest with this email already exists.',
            'passport_number.unique' => 'A guest with this passport number already exists.',
            'national_id.unique' => 'A guest with this national ID already exists.',
            'date_of_birth.before' => 'Date of birth must be in the past.',
        ];
    }
}
