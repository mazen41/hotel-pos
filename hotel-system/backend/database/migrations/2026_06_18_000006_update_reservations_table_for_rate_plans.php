<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->foreignId('rate_plan_id')->nullable()->after('room_type_id')->constrained()->onDelete('set null');
            $table->decimal('rate_plan_applied_amount', 10, 2)->nullable()->after('rate_plan_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['rate_plan_id']);
            $table->dropColumn(['rate_plan_id', 'rate_plan_applied_amount']);
        });
    }
};