<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * This migration is intentionally a no-op.
 * The room_types table is fully created by:
 *   2024_01_03_000001_create_room_types_table.php
 *
 * This file exists only to satisfy the migrations history
 * without causing a "table already exists" error.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Table already created by the earlier migration.
        // Nothing to do here.
    }

    public function down(): void
    {
        // Nothing to drop — owned by the earlier migration.
    }
};
