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
        Schema::table('rooms', function (Blueprint $table) {
            $table->enum('status', [
                'available',
                'occupied',
                'cleaning',
                'maintenance',
                'out_of_order',
                'out_of_service',
            ])->default('available')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->enum('status', [
                'available',
                'occupied',
                'cleaning',
                'maintenance',
                'out_of_order',
            ])->default('available')->change();
        });
    }
};
