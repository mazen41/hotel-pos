<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

/**
 * NotificationService — creates POS/back-office notifications only.
 */
class NotificationService
{
    public function notifyAdmins(string $type, string $title, string $message, ?array $data = null, mixed $related = null): void
    {
        User::role('Admin')->get()->each(function (User $user) use ($type, $title, $message, $data, $related) {
            Notification::createForUser($user, $type, $title, $message, $data, $related);
        });
    }

    public function notifyLowStock(mixed $inventory): void
    {
        $this->notifyAdmins(
            Notification::TYPE_SYSTEM,
            'Low Inventory Stock',
            "Inventory item {$inventory->name} is below its minimum stock level.",
            ['inventory_id' => $inventory->id],
            $inventory,
        );
    }

    public function notifyShiftClosed(mixed $cashShift): void
    {
        $this->notifyAdmins(
            Notification::TYPE_SYSTEM,
            'Cash Shift Closed',
            "Cash shift #{$cashShift->id} was closed with variance {$cashShift->variance}.",
            ['cash_shift_id' => $cashShift->id],
            $cashShift,
        );
    }
}
