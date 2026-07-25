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
        Schema::create('availabilities', function (Blueprint $table) {
            $table->id();
            
            // Room relationship
            $table->foreignId('room_id')
                ->constrained('rooms')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Date tracking
            $table->date('date')->index();
            
            // Availability status
            $table->enum('status', [
                'available',
                'booked',
                'blocked',
                'maintenance',
                'out_of_order',
                'check_out_day',
                'check_in_day'
            ])->default('available');
            
            // Reservation reference (if booked)
            $table->foreignId('reservation_id')
                ->nullable()
                ->constrained('reservations')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            // Pricing for this specific date
            $table->decimal('price', 10, 2)->nullable();
            
            // Inventory controls
            $table->boolean('stop_sell')->default(false);
            $table->boolean('min_stay_enforced')->default(false);
            $table->integer('min_stay')->default(1);
            $table->boolean('max_stay_enforced')->default(false);
            $table->integer('max_stay')->nullable();
            
            // Notes
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Unique constraint to prevent duplicate availability records
            $table->unique(['room_id', 'date']);
            
            // Indexes for performance
            $table->index(['date', 'status']);
            $table->index('reservation_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('availabilities');
    }
};
