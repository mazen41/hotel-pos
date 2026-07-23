<?php

namespace Database\Seeders;

use App\Models\Table;
use Illuminate\Database\Seeder;

class TableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 20 sample tables
        for ($i = 1; $i <= 20; $i++) {
            Table::create([
                'number' => (string) $i,
                'name' => "Table $i",
                'capacity' => $i <= 10 ? 4 : 6, // First 10 tables seat 4, rest seat 6
                'status' => 'available',
                'location' => $i <= 10 ? 'Main Hall' : 'Outdoor Area',
                'notes' => null,
            ]);
        }
    }
}
