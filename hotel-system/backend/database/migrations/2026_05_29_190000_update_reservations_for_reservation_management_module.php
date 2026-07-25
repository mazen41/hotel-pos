<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('reservations')) {
            return;
        }

        Schema::table('reservations', function (Blueprint $table) {
            if (! Schema::hasColumn('reservations', 'reservation_number')) {
                $table->string('reservation_number')->nullable()->unique()->after('id');
            }
            if (! Schema::hasColumn('reservations', 'check_in_date')) {
                $table->date('check_in_date')->nullable()->after('source');
            }
            if (! Schema::hasColumn('reservations', 'check_out_date')) {
                $table->date('check_out_date')->nullable()->after('check_in_date');
            }
            if (! Schema::hasColumn('reservations', 'fees')) {
                $table->decimal('fees', 12, 2)->default(0)->after('taxes');
            }
            if (! Schema::hasColumn('reservations', 'paid_amount')) {
                $table->decimal('paid_amount', 12, 2)->default(0)->after('total_amount');
            }
            if (! Schema::hasColumn('reservations', 'external_reservation_id')) {
                $table->string('external_reservation_id')->nullable()->after('internal_notes');
            }
            if (! Schema::hasColumn('reservations', 'channel_manager_reference')) {
                $table->string('channel_manager_reference')->nullable()->after('external_reservation_id');
            }
            if (! Schema::hasColumn('reservations', 'synced_at')) {
                $table->timestamp('synced_at')->nullable()->after('channel_manager_reference');
            }
        });

        DB::table('reservations')->whereNull('reservation_number')->orderBy('id')->get()->each(function ($reservation): void {
            DB::table('reservations')->where('id', $reservation->id)->update([
                'reservation_number' => $reservation->confirmation_number ?? 'RES-' . now()->format('Ymd') . '-' . str_pad((string) $reservation->id, 5, '0', STR_PAD_LEFT),
                'check_in_date' => $reservation->check_in ?? $reservation->check_in_date,
                'check_out_date' => $reservation->check_out ?? $reservation->check_out_date,
                'paid_amount' => $reservation->amount_paid ?? $reservation->paid_amount ?? 0,
                'external_reservation_id' => $reservation->source_reservation_id ?? $reservation->external_reservation_id ?? null,
                'channel_manager_reference' => $reservation->channel_reservation_id ?? $reservation->channel_manager_reference ?? null,
                'synced_at' => $reservation->channel_synced_at ?? $reservation->synced_at ?? null,
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            foreach (['synced_at', 'channel_manager_reference', 'external_reservation_id', 'paid_amount', 'fees', 'check_out_date', 'check_in_date', 'reservation_number'] as $column) {
                if (Schema::hasColumn('reservations', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
