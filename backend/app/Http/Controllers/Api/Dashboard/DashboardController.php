<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Return mock KPI data for the dashboard overview.
     * These will be replaced with real database queries in future sprints.
     */
    public function kpis(): JsonResponse
    {
        return response()->json([
            'data' => [
                [
                    'key'        => 'total_reservations',
                    'label'      => 'Total Reservations',
                    'value'      => 1284,
                    'change'     => '+12.5%',
                    'trend'      => 'up',
                    'period'     => 'vs last month',
                ],
                [
                    'key'        => 'occupancy_rate',
                    'label'      => 'Occupancy Rate',
                    'value'      => '78.4%',
                    'change'     => '+3.2%',
                    'trend'      => 'up',
                    'period'     => 'vs last month',
                ],
                [
                    'key'        => 'todays_checkins',
                    'label'      => "Today's Check-ins",
                    'value'      => 24,
                    'change'     => '-2',
                    'trend'      => 'down',
                    'period'     => 'vs yesterday',
                ],
                [
                    'key'        => 'todays_checkouts',
                    'label'      => "Today's Check-outs",
                    'value'      => 18,
                    'change'     => '+4',
                    'trend'      => 'up',
                    'period'     => 'vs yesterday',
                ],
                [
                    'key'        => 'total_revenue',
                    'label'      => 'Total Revenue',
                    'value'      => '$284,750',
                    'change'     => '+8.1%',
                    'trend'      => 'up',
                    'period'     => 'vs last month',
                ],
            ],
        ]);
    }

    /**
     * Return mock recent activity feed.
     */
    public function recentActivity(): JsonResponse
    {
        return response()->json([
            'data' => [
                [
                    'id'          => 1,
                    'type'        => 'check_in',
                    'guest'       => 'Amira Hassan',
                    'room'        => '304',
                    'description' => 'Checked in to Deluxe Suite',
                    'time'        => '2 minutes ago',
                ],
                [
                    'id'          => 2,
                    'type'        => 'reservation',
                    'guest'       => 'Karim Mansour',
                    'room'        => '512',
                    'description' => 'New reservation for 3 nights',
                    'time'        => '18 minutes ago',
                ],
                [
                    'id'          => 3,
                    'type'        => 'check_out',
                    'guest'       => 'Nadia Saleh',
                    'room'        => '208',
                    'description' => 'Checked out from Standard Room',
                    'time'        => '1 hour ago',
                ],
                [
                    'id'          => 4,
                    'type'        => 'reservation',
                    'guest'       => 'Omar Fathy',
                    'room'        => '101',
                    'description' => 'New reservation via Booking.com',
                    'time'        => '2 hours ago',
                ],
                [
                    'id'          => 5,
                    'type'        => 'check_in',
                    'guest'       => 'Layla Ibrahim',
                    'room'        => '406',
                    'description' => 'Checked in to Executive Room',
                    'time'        => '3 hours ago',
                ],
            ],
        ]);
    }

    /**
     * Return mock occupancy trend data (last 7 days).
     */
    public function occupancyTrend(): JsonResponse
    {
        return response()->json([
            'data' => [
                ['date' => 'Mon', 'rate' => 72],
                ['date' => 'Tue', 'rate' => 68],
                ['date' => 'Wed', 'rate' => 81],
                ['date' => 'Thu', 'rate' => 75],
                ['date' => 'Fri', 'rate' => 89],
                ['date' => 'Sat', 'rate' => 94],
                ['date' => 'Sun', 'rate' => 78],
            ],
        ]);
    }
}
