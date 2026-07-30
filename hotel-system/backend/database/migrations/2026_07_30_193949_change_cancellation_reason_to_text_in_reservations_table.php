<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, make the column nullable with larger size to handle existing data
        DB::statement('ALTER TABLE reservations MODIFY cancellation_reason VARCHAR(1000) NULL');
        
        // Then change to text type
        DB::statement('ALTER TABLE reservations MODIFY cancellation_reason TEXT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to varchar with proper size
        DB::statement('ALTER TABLE reservations MODIFY cancellation_reason VARCHAR(255) NULL');
    }
};
