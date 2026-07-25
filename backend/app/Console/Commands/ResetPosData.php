<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Table;

class ResetPosData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pos:reset-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely clear all POS transactional data (orders, shifts, returns, payments, adjustments)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->confirm('Are you sure you want to completely clear all transactional POS data? This cannot be undone.')) {
            $this->info('Cleanup cancelled.');
            return Command::SUCCESS;
        }

        $this->info('Starting POS database cleanup...');

        // Disable foreign key checks for safe truncation
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $tablesToTruncate = [
            'order_return_items',
            'order_returns',
            'order_payments',
            'order_items',
            'orders',
            'cash_shifts',
            'inventory_adjustments',
        ];

        foreach ($tablesToTruncate as $table) {
            $this->comment("Truncating table: {$table}...");
            DB::table($table)->truncate();
        }

        // Reset all table states to available
        $this->comment('Resetting all dine-in tables status to available...');
        Table::query()->update(['status' => 'available']);

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info('POS transactional data has been successfully reset. The system is ready for fresh operation.');
        return Command::SUCCESS;
    }
}
