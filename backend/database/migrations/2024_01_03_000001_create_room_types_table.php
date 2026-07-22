<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * room_types — Foundation for pricing, reservations, inventory,
     * and NoBeds / channel manager integrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('room_types')) {
            return; // Already exists — safe to skip on re-run
        }

        Schema::create('room_types', function (Blueprint $table) {
            $table->id();

            // ── Basic Information ──────────────────────────────────────────────
            $table->string('name');
            $table->text('description')->nullable();

            // ── Pricing ────────────────────────────────────────────────────────
            $table->decimal('base_price', 10, 2)->default(0);

            // ── Occupancy ──────────────────────────────────────────────────────
            $table->unsignedInteger('max_adults')->default(2);
            $table->unsignedInteger('max_children')->default(0);
            $table->unsignedInteger('max_occupancy')->default(2);

            // ── Room Details ───────────────────────────────────────────────────
            $table->string('bed_type')->nullable();
            $table->json('amenities')->nullable();
            $table->json('images')->nullable();

            // ── Status ─────────────────────────────────────────────────────────
            $table->boolean('is_active')->default(true);

            // ── NoBeds / Channel Manager Integration ───────────────────────────
            $table->string('external_mapping_id')->nullable()->comment('External system room type ID');
            $table->string('channel_manager_code')->nullable()->comment('NoBeds / channel manager room type code');
            $table->string('rate_plan_code')->nullable()->comment('Default rate plan code for this room type');

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ────────────────────────────────────────────────────────
            $table->index('is_active');
            $table->index('channel_manager_code');
            $table->index('external_mapping_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_types');
    }
};
