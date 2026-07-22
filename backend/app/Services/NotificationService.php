<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Reservation;
use App\Models\User;
use Carbon\Carbon;

/**
 * NotificationService — Rules engine for creating notifications.
 *
 * This service handles the automatic creation of notifications based on
 * hotel events such as arrivals, departures, overdue payments, etc.
 */
class NotificationService
{
    /**
     * Check and create notifications for today's arrivals.
     */
    public function checkArrivalsToday(): void
    {
        $today = Carbon::today();
        
        $arrivals = Reservation::where('check_in_date', $today)
            ->whereIn('status', ['confirmed', 'pending'])
            ->get();

        foreach ($arrivals as $reservation) {
            // Notify admin users or front desk staff
            $this->notifyAdminUsers(
                Notification::TYPE_ARRIVAL_TODAY,
                'Guest Arriving Today',
                "Guest {$reservation->guest->full_name} is scheduled to arrive today in room {$reservation->room?->room_number}",
                ['reservation_id' => $reservation->id, 'check_in_date' => $reservation->check_in_date],
                $reservation
            );
        }
    }

    /**
     * Check and create notifications for today's departures.
     */
    public function checkDeparturesToday(): void
    {
        $today = Carbon::today();
        
        $departures = Reservation::where('check_out_date', $today)
            ->where('status', 'checked_in')
            ->get();

        foreach ($departures as $reservation) {
            $this->notifyAdminUsers(
                Notification::TYPE_DEPARTURE_TODAY,
                'Guest Departing Today',
                "Guest {$reservation->guest->full_name} is scheduled to depart today from room {$reservation->room?->room_number}",
                ['reservation_id' => $reservation->id, 'check_out_date' => $reservation->check_out_date],
                $reservation
            );
        }
    }

    /**
     * Check and create notifications for overdue payments.
     */
    public function checkOverduePayments(): void
    {
        $overdueReservations = Reservation::where('balance_due', '>', 0)
            ->where('check_in_date', '<', Carbon::today())
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->where('payment_status', '!=', 'paid')
            ->get();

        foreach ($overdueReservations as $reservation) {
            // Check if notification already exists for today
            $existingNotification = Notification::where('type', Notification::TYPE_PAYMENT_OVERDUE)
                ->where('related_type', Reservation::class)
                ->where('related_id', $reservation->id)
                ->whereDate('created_at', Carbon::today())
                ->exists();

            if (!$existingNotification) {
                $this->notifyAdminUsers(
                    Notification::TYPE_PAYMENT_OVERDUE,
                    'Payment Overdue',
                    "Reservation #{$reservation->reservation_number} has an overdue balance of \${$reservation->balance_due}",
                    ['reservation_id' => $reservation->id, 'balance_due' => $reservation->balance_due],
                    $reservation
                );
            }
        }
    }

    /**
     * Check and create notifications for overdue housekeeping tasks.
     */
    public function checkOverdueHousekeeping(): void
    {
        // Placeholder for when HousekeepingTask model is implemented
        // For now, we'll skip this check
    }

    /**
     * Create notification for maintenance request.
     */
    public function notifyMaintenanceCreated($maintenanceRequest): void
    {
        $this->notifyAdminUsers(
            Notification::TYPE_MAINTENANCE_CREATED,
            'Maintenance Request Created',
            "New maintenance request for room {$maintenanceRequest->room?->room_number}: {$maintenanceRequest->title}",
            ['maintenance_request_id' => $maintenanceRequest->id, 'priority' => $maintenanceRequest->priority],
            $maintenanceRequest
        );
    }

    /**
     * Notify all admin users.
     */
    protected function notifyAdminUsers(string $type, string $title, string $message, array $data = null, $related = null): void
    {
        // Get all admin users (you might want to adjust this based on your roles)
        $adminUsers = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->get();

        foreach ($adminUsers as $user) {
            Notification::createForUser($user->id, $type, $title, $message, $data, $related);
        }
    }

    /**
     * Run all notification checks.
     */
    public function runAllChecks(): void
    {
        $this->checkArrivalsToday();
        $this->checkDeparturesToday();
        $this->checkOverduePayments();
        $this->checkOverdueHousekeeping();
    }
}