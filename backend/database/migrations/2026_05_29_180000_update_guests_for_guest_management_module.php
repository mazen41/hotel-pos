<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            if (! Schema::hasColumn('guests', 'passport_number')) {
                $table->string('passport_number', 100)->nullable()->unique()->after('address');
            }

            if (! Schema::hasColumn('guests', 'national_id')) {
                $table->string('national_id', 100)->nullable()->unique()->after('passport_number');
            }

            if (! Schema::hasColumn('guests', 'vip_status')) {
                $table->boolean('vip_status')->default(false)->after('notes')->index();
            }

            if (! Schema::hasColumn('guests', 'marketing_consent')) {
                $table->boolean('marketing_consent')->default(false)->after('vip_status')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            if (Schema::hasColumn('guests', 'marketing_consent')) {
                $table->dropColumn('marketing_consent');
            }

            if (Schema::hasColumn('guests', 'vip_status')) {
                $table->dropColumn('vip_status');
            }

            if (Schema::hasColumn('guests', 'national_id')) {
                $table->dropColumn('national_id');
            }

            if (Schema::hasColumn('guests', 'passport_number')) {
                $table->dropColumn('passport_number');
            }
        });
    }
};
