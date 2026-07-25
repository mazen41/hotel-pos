<?php

namespace Database\Seeders;

use App\Models\Availability;
use App\Models\Room;
use App\Models\RoomType;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AvailabilitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all rooms
        $rooms = Room::with('roomType')->get();

        // Generate availability for the next 90 days
        $startDate = Carbon::now()->startOfDay();
        $endDate = Carbon::now()->addDays(90)->endOfDay();

        foreach ($rooms as $room) {
            $currentDate = $startDate->copy();
            
            while ($currentDate <= $endDate) {
                // Check if this room has any reservation for this date
                $reservation = \App\Models\Reservation::where('room_id', $room->id)
                    ->where('check_in_date', '<=', $currentDate)
                    ->where('check_out_date', '>', $currentDate)
                    ->where('status', '!=', 'cancelled')
                    ->first();

                $status = $reservation ? 'booked' : 'available';
                
                // Get price from room type rates
                $rates = json_decode($room->roomType->rates, true);
                $price = $rates['DBL'] ?? $room->roomType->base_price;

                Availability::updateOrCreate(
                    [
                        'room_id' => $room->id,
                        'date' => $currentDate->format('Y-m-d'),
                    ],
                    [
                        'status' => $status,
                        'reservation_id' => $reservation ? $reservation->id : null,
                        'price' => $price,
                        'stop_sell' => false,
                        'min_stay_enforced' => false,
                        'min_stay' => 1,
                        'max_stay_enforced' => false,
                        'max_stay' => null,
                    ]
                );

                $currentDate->addDay();
            }
        }

        $this->command->info('Availability data seeded for next 90 days');
    }
}
