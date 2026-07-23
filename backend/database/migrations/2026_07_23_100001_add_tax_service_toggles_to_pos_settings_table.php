<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pos_settings', function (Blueprint $table) {
            $table->boolean('tax_enabled')->default(true)->after('tax_percentage');
            $table->boolean('service_charge_enabled')->default(false)->after('service_charge_percentage');
        });

        // Patch existing rows: update USD defaults to EGP
        DB::table('pos_settings')
            ->where('currency', 'USD')
            ->update([
                'currency' => 'EGP',
                'currency_symbol' => 'EGP',
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pos_settings', function (Blueprint $table) {
            $table->dropColumn(['tax_enabled', 'service_charge_enabled']);
        });
    }
};
