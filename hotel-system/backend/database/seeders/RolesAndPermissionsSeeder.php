<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'view dashboard',
            'manage guests',
            'manage reservations',
            'manage rooms',
            'manage room types',
            'manage rate plans',
            'manage billing',
            'manage housekeeping',
            'manage settings',
            'manage users',
            'manage roles',
            'view reports',
            'express check-in',
            'express check-out',
            'mark no-show',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles and assign permissions
        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $admin->givePermissionTo(Permission::all());

        $manager = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $manager->givePermissionTo([
            'view dashboard',
            'manage guests',
            'manage reservations',
            'manage rooms',
            'manage room types',
            'manage rate plans',
            'manage billing',
            'manage housekeeping',
            'view reports',
            'express check-in',
            'express check-out',
            'mark no-show',
        ]);

        $frontDesk = Role::firstOrCreate(['name' => 'Front Desk', 'guard_name' => 'web']);
        $frontDesk->givePermissionTo([
            'view dashboard',
            'manage guests',
            'manage reservations',
            'manage rooms',
            'manage billing',
            'express check-in',
            'express check-out',
            'mark no-show',
        ]);

        $housekeeping = Role::firstOrCreate(['name' => 'Housekeeping', 'guard_name' => 'web']);
        $housekeeping->givePermissionTo([
            'view dashboard',
            'manage housekeeping',
        ]);
    }
}
