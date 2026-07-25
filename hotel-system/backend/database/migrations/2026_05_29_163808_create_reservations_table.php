<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('reservation_number')->unique();
            $table->foreignId('guest_id')->constrained('guests')->onDelete('restrict');
            $table->foreignId('room_id')->constrained('rooms')->onDelete('restrict');
            $table->foreignId('room_type_id')->constrained('room_types')->onDelete('restrict');

            $table->string('source', 80)->default('direct');
            $table->date('check_in_date');
            $table->date('check_out_date');
            $table->unsignedInteger('adults')->default(1);
            $table->unsignedInteger('children')->default(0);
            $table->unsignedInteger('nights')->default(1);

            $table->enum('status', [
                'pending',
                'confirmed',
                'checked_in',
                'checked_out',
                'cancelled',
                'no_show',
            ])->default('pending');

            $table->enum('payment_status', [
                'unpaid',
                'partially_paid',
                'paid',
                'refunded',
            ])->default('unpaid');

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('taxes', 12, 2)->default(0);
            $table->decimal('fees', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('balance_due', 12, 2)->default(0);

            $table->text('special_requests')->nullable();
            $table->text('internal_notes')->nullable();

            // Future NoBeds/channel-manager synchronization fields.
            $table->string('external_reservation_id')->nullable();
            $table->string('channel_manager_reference')->nullable();
            $table->timestamp('synced_at')->nullable();

            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('reservation_number');
            $table->index('guest_id');
            $table->index('room_id');
            $table->index('room_type_id');
            $table->index('source');
            $table->index('status');
            $table->index('payment_status');
            $table->index(['check_in_date', 'check_out_date']);
            $table->index('external_reservation_id');
            $table->index('channel_manager_reference');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
