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
        Schema::create('rate_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['standard', 'corporate', 'seasonal', 'package', 'promotional'])->default('standard');
            $table->enum('pricing_type', ['fixed', 'percentage', 'per_person', 'per_night'])->default('fixed');
            $table->decimal('base_rate', 10, 2)->default(0);
            $table->integer('min_nights')->nullable();
            $table->integer('max_nights')->nullable();
            $table->boolean('occupancy_based_pricing')->default(false);
            $table->boolean('allow_children')->default(true);
            $table->boolean('allow_extra_beds')->default(false);
            $table->decimal('extra_bed_price', 10, 2)->nullable();
            $table->boolean('meal_plan_included')->default(false);
            $table->string('meal_plan_type')->nullable();
            $table->text('cancellation_policy')->nullable();
            $table->text('payment_policy')->nullable();
            $table->boolean('active')->default(true);
            $table->integer('priority')->default(1);
            $table->json('available_channels')->default('["direct"]');
            $table->boolean('channel_sync_enabled')->default(false);
            $table->json('channel_manager_references')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rate_plans');
    }
};