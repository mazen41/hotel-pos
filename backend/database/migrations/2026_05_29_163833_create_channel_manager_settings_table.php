<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('channel_manager_settings', function (Blueprint $table) {
            $table->id();
            $table->string('channel'); // nobeds, booking_com, expedia, airbnb
            $table->boolean('is_enabled')->default(false);
            $table->string('api_key')->nullable();
            $table->string('api_secret')->nullable();
            $table->string('property_id')->nullable();
            $table->string('username')->nullable();
            $table->string('password')->nullable();
            $table->json('extra_config')->nullable(); // channel-specific fields
            $table->timestamp('last_sync_at')->nullable();
            $table->enum('sync_status', ['idle', 'syncing', 'success', 'error'])->default('idle');
            $table->text('last_sync_error')->nullable();
            $table->timestamps();
            $table->unique('channel');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('channel_manager_settings');
    }
};
