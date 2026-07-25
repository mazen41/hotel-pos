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
        Schema::table('room_types', function (Blueprint $table) {
            // Add meal plan field
            $table->string('meal_plan')->nullable()->after('base_price')->comment('Meal plan type: BB, HB, FB, AI, etc.');
            
            // Add detailed rates structure as JSON
            $table->json('rates')->nullable()->after('meal_plan')->comment('Detailed rates: {"SGL": 50, "DBL": 55, "TPL": 90, "QUAD": 100}');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn(['meal_plan', 'rates']);
        });
    }
};
