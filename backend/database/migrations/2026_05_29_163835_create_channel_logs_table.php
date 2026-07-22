<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('channel_logs', function (Blueprint $table) {
            $table->id();
            $table->string('channel');
            $table->string('action'); // sync_availability, sync_rates, receive_booking, push_update
            $table->enum('status', ['success', 'error', 'warning'])->default('success');
            $table->json('request_data')->nullable();
            $table->json('response_data')->nullable();
            $table->text('message')->nullable();
            $table->foreignId('reservation_id')->nullable()->constrained('reservations')->onDelete('set null');
            $table->timestamps();
            $table->index('channel');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('channel_logs');
    }
};
