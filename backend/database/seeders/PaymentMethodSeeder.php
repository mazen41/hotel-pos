<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default payment methods
        PaymentMethod::firstOrCreate(
            ['code' => 'cash'],
            [
                'name' => 'Cash',
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        PaymentMethod::firstOrCreate(
            ['code' => 'card'],
            [
                'name' => 'Visa/Card',
                'is_active' => true,
                'sort_order' => 2,
            ]
        );

        PaymentMethod::firstOrCreate(
            ['code' => 'guest'],
            [
                'name' => 'Guest (Pay Later)',
                'is_active' => true,
                'sort_order' => 3,
            ]
        );
    }
}
