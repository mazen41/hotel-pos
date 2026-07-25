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
        Schema::create('rate_restrictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rate_plan_id')->constrained()->onDelete('cascade');
            $table->enum('restriction_type', ['blackout_date', 'min_stay', 'max_stay', 'check_in', 'check_out'])->default('blackout_date');
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('value')->nullable();
            $table->text('description')->nullable();
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
        Schema::dropIfExists('rate_restrictions');
    }
};