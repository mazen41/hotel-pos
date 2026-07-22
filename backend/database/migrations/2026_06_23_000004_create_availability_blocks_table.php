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
        Schema::create('availability_blocks', function (Blueprint $table) {
            $table->id();
            
            // Block details
            $table->string('name');
            $table->text('description')->nullable();
            
            // Room or Room Type
            $table->foreignId('room_id')
                ->nullable()
                ->constrained('rooms')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('room_type_id')
                ->nullable()
                ->constrained('room_types')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Date range
            $table->date('start_date');
            $table->date('end_date');
            
            // Block reason
            $table->enum('reason', [
                'maintenance',
                'renovation',
                'group_booking',
                'owner_use',
                'staff_use',
                'other'
            ])->default('maintenance');
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Created by
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['start_date', 'end_date']);
            $table->index('room_id');
            $table->index('room_type_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('availability_blocks');
    }
};
