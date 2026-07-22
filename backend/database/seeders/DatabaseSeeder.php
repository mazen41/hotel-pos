<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            PosRolesAndPermissionsSeeder::class,
        ]);

        $user = User::firstOrCreate(
            ['email' => 'admin@pos.local'],
            [
                'name' => 'POS Administrator',
                'password' => Hash::make('password123'),
            ],
        );

        $user->syncRoles(['Admin']);
    }
}
