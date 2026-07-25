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
        Schema::create('dynamic_pricing_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rate_plan_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('rule_type', ['occupancy_based', 'lead_time_based', 'day_of_week_based', 'event_based'])->default('occupancy_based');
            $table->json('condition');
            $table->enum('action', ['increase', 'decrease'])->default('increase');
            $table->decimal('value', 10, 2)->default(0);
            $table->enum('value_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('min_value', 10, 2)->nullable();
            $table->decimal('max_value', 10, 2)->nullable();
            $table->boolean('applies_to_all_room_types')->default(true);
            $table->json('room_types')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dynamic_pricing_rules');
    }
};