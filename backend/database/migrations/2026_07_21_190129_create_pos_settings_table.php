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
        Schema::create('pos_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('require_open_shift_for_cash')->default(true);
            $table->boolean('auto_print_receipt')->default(false);
            $table->string('default_payment_method')->default('cash');
            $table->text('receipt_footer')->nullable();
            $table->decimal('tax_percentage', 5, 2)->default(0);
            $table->decimal('service_charge_percentage', 5, 2)->default(0);
            $table->string('currency')->default('USD');
            $table->string('currency_symbol')->default('$');
            $table->decimal('auto_approve_return_threshold', 10, 2)->default(50);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_settings');
    }
};
