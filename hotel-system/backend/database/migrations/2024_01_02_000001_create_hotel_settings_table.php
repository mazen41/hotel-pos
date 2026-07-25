<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * hotel_settings is a single-row configuration table.
     * It serves as the single source of truth for all hotel-level
     * settings consumed by reservations, pricing, invoicing,
     * and channel manager integrations (SiteMinder, Booking.com, etc.).
     */
    public function up(): void
    {
        Schema::create('hotel_settings', function (Blueprint $table) {
            $table->id();

            // ── General Information ────────────────────────────────────────
            $table->string('hotel_name')->default('');
            $table->string('legal_business_name')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('favicon_path')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('website_url')->nullable();

            // ── Location ──────────────────────────────────────────────────
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->string('postal_code')->nullable();

            // ── Operational Settings ───────────────────────────────────────
            $table->string('timezone')->default('UTC');
            $table->string('currency', 3)->default('USD');     // ISO 4217
            $table->string('default_language', 5)->default('en');  // BCP 47
            $table->time('check_in_time')->default('14:00:00');
            $table->time('check_out_time')->default('11:00:00');

            // ── Financial Settings ─────────────────────────────────────────
            $table->decimal('tax_percentage', 5, 2)->default(0.00);
            $table->decimal('service_charge_percentage', 5, 2)->default(0.00);

            // ── Booking Settings ───────────────────────────────────────────
            $table->text('cancellation_policy')->nullable();
            $table->text('confirmation_policy')->nullable();

            // ── Channel Manager Settings ───────────────────────────────────
            // Preparation fields for SiteMinder / Booking.com / Expedia / Airbnb
            $table->string('channel_property_code')->nullable();
            $table->string('channel_external_property_ref')->nullable();
            $table->string('channel_default_rate_plan_code')->nullable();
            $table->string('channel_default_inventory_code')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hotel_settings');
    }
};
