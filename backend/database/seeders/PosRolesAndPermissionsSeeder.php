<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class PosRolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions following the <page>.<action> pattern
        $permissions = [
            // POS permissions
            'pos.view',
            'pos.create_order',
            'pos.void_order',
            'pos.apply_discount',
            'pos.manage_inventory',
            'pos.view_reports',
            'pos.manage_returns',
            'pos.manage_shifts',
            'pos.manage_menu',

            // Inventory permissions
            'inventory.view',
            'inventory.create',
            'inventory.edit',
            'inventory.delete',
            'inventory.adjust_stock',

            // Invoices permissions
            'invoices.view',
            'invoices.create',
            'invoices.delete',
            'invoices.export',

            // Reports permissions
            'reports.view',
            'reports.export',

            // Financial summary permissions
            'financial_summary.view',

            // Roles permissions
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'roles.assign_permissions',

            // Users permissions
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            // Shifts permissions
            'shifts.open',
            'shifts.close',
            'shifts.view_all',

            // Returns permissions
            'returns.view',
            'returns.create',
            'returns.approve',

            // Settings permissions
            'settings.view',
            'settings.edit',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles and assign permissions with discount limits
        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $admin->givePermissionTo(Permission::all());
        $admin->max_discount_percentage = 100;
        $admin->max_discount_amount = 999999;
        $admin->save();

        $manager = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $manager->givePermissionTo([
            'pos.view',
            'pos.create_order',
            'pos.void_order',
            'pos.apply_discount',
            'pos.manage_inventory',
            'pos.view_reports',
            'pos.manage_returns',
            'pos.manage_shifts',
            'pos.manage_menu',
            'inventory.view',
            'inventory.create',
            'inventory.edit',
            'inventory.delete',
            'inventory.adjust_stock',
            'invoices.view',
            'invoices.create',
            'invoices.delete',
            'invoices.export',
            'reports.view',
            'reports.export',
            'financial_summary.view',
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'roles.assign_permissions',
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'shifts.open',
            'shifts.close',
            'shifts.view_all',
            'returns.view',
            'returns.create',
            'returns.approve',
            'settings.view',
            'settings.edit',
        ]);
        $manager->max_discount_percentage = 50;
        $manager->max_discount_amount = 500;
        $manager->save();

        $cashier = Role::firstOrCreate(['name' => 'Cashier', 'guard_name' => 'web']);
        $cashier->givePermissionTo([
            'pos.view',
            'pos.create_order',
            'pos.apply_discount',
            'inventory.view',
            'invoices.view',
            'shifts.open',
            'shifts.close',
            'returns.view',
            'returns.create',
            'settings.view',
        ]);
        $cashier->max_discount_percentage = 10;
        $cashier->max_discount_amount = 50;
        $cashier->save();

        $kitchen = Role::firstOrCreate(['name' => 'Kitchen Staff', 'guard_name' => 'web']);
        $kitchen->givePermissionTo([
            'pos.view',
            'inventory.view',
            'inventory.adjust_stock',
        ]);
        $kitchen->max_discount_percentage = 0;
        $kitchen->max_discount_amount = 0;
        $kitchen->save();
    }
}
