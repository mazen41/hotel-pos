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
        Schema::table('cash_shifts', function (Blueprint $table) {
            if (!Schema::hasColumn('cash_shifts', 'total_refunds')) {
                $table->decimal('total_refunds', 10, 2)->default(0)->after('total_sales');
            }
        });

        Schema::table('order_returns', function (Blueprint $table) {
            if (!Schema::hasColumn('order_returns', 'cash_shift_id')) {
                $table->foreignId('cash_shift_id')->nullable()->after('order_id')->constrained('cash_shifts')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_returns', function (Blueprint $table) {
            if (Schema::hasColumn('order_returns', 'cash_shift_id')) {
                $table->dropForeign(['cash_shift_id']);
                $table->dropColumn('cash_shift_id');
            }
        });

        Schema::table('cash_shifts', function (Blueprint $table) {
            if (Schema::hasColumn('cash_shifts', 'total_refunds')) {
                $table->dropColumn('total_refunds');
            }
        });
    }
};
