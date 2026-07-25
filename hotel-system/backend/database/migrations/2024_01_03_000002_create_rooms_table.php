<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * rooms represents the physical room inventory of the hotel.
     * Each room is linked to a room_type and has its own status and attributes.
     */
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();

            // ── Room Type Relationship ─────────────────────────────────────────
            $table->foreignId('room_type_id')
                ->constrained('room_types')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            // ── Room Identification ─────────────────────────────────────────────
            $table->string('room_number')->unique();
            $table->string('floor')->nullable();

            // ── Status ─────────────────────────────────────────────────────────
            $table->enum('status', [
                'available',
                'occupied',
                'cleaning',
                'maintenance',
                'out_of_order',
            ])->default('available');

            // ── Additional Information ───────────────────────────────────────────
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);

            // ── Channel Manager & Inventory Synchronization (Future) ───────────
            // These fields support future synchronization with channel managers
            // such as SiteMinder, Booking.com, Expedia, and Airbnb.
            $table->string('external_room_id')->nullable()->comment('External system room ID');
            $table->string('inventory_code')->nullable()->comment('Inventory code for channel manager');
            $table->unsignedInteger('sort_order')->default(0)->comment('Display order');

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ────────────────────────────────────────────────────────
            $table->index('room_type_id');
            $table->index('status');
            $table->index('is_active');
            $table->index('room_number');
            $table->index('external_room_id');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
