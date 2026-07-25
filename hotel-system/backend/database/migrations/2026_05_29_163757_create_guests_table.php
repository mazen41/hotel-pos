<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('guests', function (Blueprint $table) {
            $table->id();

            // Profile and contact details
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email')->nullable()->unique();
            $table->string('phone', 50)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->text('address')->nullable();

            // Identity documents
            $table->string('passport_number', 100)->nullable()->unique();
            $table->string('national_id', 100)->nullable()->unique();
            $table->date('date_of_birth')->nullable();

            // CRM, consent, and future loyalty analytics
            $table->text('notes')->nullable();
            $table->boolean('vip_status')->default(false);
            $table->boolean('marketing_consent')->default(false);
            $table->unsignedInteger('total_stays')->default(0);
            $table->decimal('total_spent', 12, 2)->default(0);

            // Future NoBeds/OTA import support can link via reservations and channel logs.
            $table->timestamps();
            $table->softDeletes();

            $table->index(['last_name', 'first_name']);
            $table->index('phone');
            $table->index('country');
            $table->index('city');
            $table->index('vip_status');
            $table->index('marketing_consent');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guests');
    }
};
