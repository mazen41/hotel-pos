<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RoomType;
use App\Models\Room;
use App\Models\Guest;
use App\Models\Reservation;
use App\Models\RatePlan;
use App\Models\User;
use App\Models\HousekeepingTask;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create demo user
        $user = User::firstOrCreate(
            ['email' => 'admin@hotel.com'],
            [
                'name' => 'Hotel Administrator',
                'password' => Hash::make('password123'),
            ]
        );

        // Assign Admin role (RolesAndPermissionsSeeder must run first)
        $user->syncRoles(['Admin']);

        $this->command->info('Created demo user: admin@hotel.com / password123 (role: Admin)');

        // Room types data from your specification with exact meal plans and rates
        $roomTypesData = [
            [
                'name' => 'Standard Double Room',
                'description' => 'Comfortable double room with modern amenities',
                'base_price' => 55.00,
                'meal_plan' => 'BB',
                'rates' => json_encode(['SGL' => 50, 'DBL' => 55]),
                'max_adults' => 2,
                'max_children' => 1,
                'max_occupancy' => 3,
                'bed_type' => 'Double Bed',
                'amenities' => ['Free WiFi', 'Air Conditioning', 'TV', 'Private Bathroom'],
                'is_active' => true,
            ],
            [
                'name' => 'Standard Twin Room',
                'description' => 'Standard room with two separate beds',
                'base_price' => 55.00,
                'meal_plan' => 'BB',
                'rates' => json_encode(['SGL' => 50, 'DBL' => 55]),
                'max_adults' => 2,
                'max_children' => 1,
                'max_occupancy' => 3,
                'bed_type' => 'Twin Beds',
                'amenities' => ['Free WiFi', 'Air Conditioning', 'TV', 'Private Bathroom'],
                'is_active' => true,
            ],
            [
                'name' => 'Superior Twin Room With Balcony',
                'description' => 'Enhanced twin room with private balcony',
                'base_price' => 60.00,
                'meal_plan' => 'BB',
                'rates' => json_encode(['SGL' => 55, 'DBL' => 60]),
                'max_adults' => 2,
                'max_children' => 2,
                'max_occupancy' => 4,
                'bed_type' => 'Twin Beds',
                'amenities' => ['Free WiFi', 'Air Conditioning', 'TV', 'Private Bathroom', 'Balcony', 'Mini Bar'],
                'is_active' => true,
            ],
            [
                'name' => 'Deluxe Single Room Side Pyramids View',
                'description' => 'Luxurious single room with Pyramids view',
                'base_price' => 65.00,
                'meal_plan' => 'BB',
                'rates' => json_encode(['SGL' => 60, 'DBL' => 65]),
                'max_adults' => 1,
                'max_children' => 1,
                'max_occupancy' => 2,
                'bed_type' => 'Single Bed',
                'amenities' => ['Free WiFi', 'Air Conditioning', 'TV', 'Private Bathroom', 'Pyramids View', 'Room Service'],
                'is_active' => true,
            ],
            [
                'name' => 'Deluxe Twin Room Side Pyramids View',
                'description' => 'Deluxe twin room with stunning Pyramids view',
                'base_price' => 70.00,
                'meal_plan' => 'BB',
                'rates' => json_encode(['SGL' => 65, 'DBL' => 70]),
                'max_adults' => 2,
                'max_children' => 2,
                'max_occupancy' => 4,
                'bed_type' => 'Twin Beds',
                'amenities' => ['Free WiFi', 'Air Conditioning', 'TV', 'Private Bathroom', 'Pyramids View', 'Balcony', 'Mini Bar'],
                'is_active' => true,
            ],
            [
                'name' => 'Deluxe Triple Room Side Pyramids View',
                'description' => 'Spacious triple room with Pyramids view',
                'base_price' => 90.00,
                'meal_plan' => 'BB',
                'rates' => json_encode(['DBL' => 70, 'TPL' => 90, 'QUAD' => 100]),
                'max_adults' => 3,
                'max_children' => 2,
                'max_occupancy' => 5,
                'bed_type' => 'Triple Configuration',
                'amenities' => ['Free WiFi', 'Air Conditioning', 'TV', 'Private Bathroom', 'Pyramids View', 'Balcony', 'Mini Bar', 'Living Area'],
                'is_active' => true,
            ],
        ];

        $roomTypes = [];
        foreach ($roomTypesData as $data) {
            $roomType = RoomType::create($data);
            $roomTypes[$roomType->name] = $roomType;
            $this->command->info("Created room type: {$roomType->name}");
        }

        // Rooms data from your specification
        $roomsData = [
            // Standard Double Room
            ['room_number' => '403', 'room_type' => 'Standard Double Room', 'floor' => '4'],
            ['room_number' => '404', 'room_type' => 'Standard Double Room', 'floor' => '4'],
            ['room_number' => '503', 'room_type' => 'Standard Double Room', 'floor' => '5'],
            ['room_number' => '504', 'room_type' => 'Standard Double Room', 'floor' => '5'],
            
            // Standard Twin Room
            ['room_number' => '405', 'room_type' => 'Standard Twin Room', 'floor' => '4'],
            ['room_number' => '505', 'room_type' => 'Standard Twin Room', 'floor' => '5'],
            
            // Superior Twin Room With Balcony
            ['room_number' => '402', 'room_type' => 'Superior Twin Room With Balcony', 'floor' => '4'],
            ['room_number' => '502', 'room_type' => 'Superior Twin Room With Balcony', 'floor' => '5'],
            
            // Deluxe Single Room Side Pyramids View
            ['room_number' => '401', 'room_type' => 'Deluxe Single Room Side Pyramids View', 'floor' => '4'],
            ['room_number' => '501', 'room_type' => 'Deluxe Single Room Side Pyramids View', 'floor' => '5'],
            
            // Deluxe Twin Room Side Pyramids View
            ['room_number' => '407', 'room_type' => 'Deluxe Twin Room Side Pyramids View', 'floor' => '4'],
            ['room_number' => '507', 'room_type' => 'Deluxe Twin Room Side Pyramids View', 'floor' => '5'],
            
            // Deluxe Triple Room Side Pyramids View
            ['room_number' => '406', 'room_type' => 'Deluxe Triple Room Side Pyramids View', 'floor' => '4'],
            ['room_number' => '506', 'room_type' => 'Deluxe Triple Room Side Pyramids View', 'floor' => '5'],
        ];

        foreach ($roomsData as $data) {
            $roomType = $roomTypes[$data['room_type']];
            Room::create([
                'room_type_id' => $roomType->id,
                'room_number' => $data['room_number'],
                'display_name' => "Room {$data['room_number']} - {$data['room_type']}",
                'floor' => $data['floor'],
                'status' => 'available',
                'is_active' => true,
                'sort_order' => (int) substr($data['room_number'], -1),
            ]);
            $this->command->info("Created room: {$data['room_number']}");
        }

        // Create rate plans based on your specification with occupancy-based pricing
        $ratePlansData = [
            [
                'name' => 'Standard Rate - BB',
                'type' => 'standard',
                'pricing_type' => 'per_person',
                'base_rate' => 55.00,
                'occupancy_based_pricing' => true,
                'meal_plan_included' => true,
                'meal_plan_type' => 'BB',
                'description' => 'Bed & Breakfast rate with occupancy-based pricing',
                'active' => true,
            ],
            [
                'name' => 'Pyramids View Premium',
                'type' => 'promotional',
                'pricing_type' => 'per_person',
                'base_rate' => 70.00,
                'occupancy_based_pricing' => true,
                'meal_plan_included' => true,
                'meal_plan_type' => 'BB',
                'description' => 'Premium rate for Pyramids view rooms with occupancy-based pricing',
                'active' => true,
            ],
            [
                'name' => 'Corporate Rate',
                'type' => 'corporate',
                'pricing_type' => 'percentage',
                'base_rate' => 55.00,
                'occupancy_based_pricing' => true,
                'meal_plan_included' => true,
                'meal_plan_type' => 'BB',
                'description' => 'Special corporate discount with occupancy-based pricing',
                'active' => true,
            ],
        ];

        foreach ($ratePlansData as $data) {
            $ratePlan = RatePlan::create($data);
            $this->command->info("Created rate plan: {$ratePlan->name}");
        }

        // Create sample guests
        $guestsData = [
            [
                'first_name' => 'Ahmed',
                'last_name' => 'Mohamed',
                'email' => 'ahmed.mohamed@email.com',
                'phone' => '+20 123 456 7890',
                'country' => 'Egypt',
                'city' => 'Cairo',
                'vip_status' => true,
                'marketing_consent' => true,
            ],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Johnson',
                'email' => 'sarah.j@email.com',
                'phone' => '+1 555 123 4567',
                'country' => 'United States',
                'city' => 'New York',
                'vip_status' => false,
                'marketing_consent' => true,
            ],
            [
                'first_name' => 'Jean',
                'last_name' => 'Dupont',
                'email' => 'jean.dupont@email.com',
                'phone' => '+33 6 12 34 56 78',
                'country' => 'France',
                'city' => 'Paris',
                'vip_status' => true,
                'marketing_consent' => false,
            ],
            [
                'first_name' => 'Maria',
                'last_name' => 'Garcia',
                'email' => 'maria.garcia@email.com',
                'phone' => '+34 678 901 234',
                'country' => 'Spain',
                'city' => 'Madrid',
                'vip_status' => false,
                'marketing_consent' => true,
            ],
            [
                'first_name' => 'Hiroshi',
                'last_name' => 'Tanaka',
                'email' => 'hiroshi.tanaka@email.com',
                'phone' => '+81 90 1234 5678',
                'country' => 'Japan',
                'city' => 'Tokyo',
                'vip_status' => true,
                'marketing_consent' => true,
            ],
        ];

        $guests = [];
        foreach ($guestsData as $data) {
            $guest = Guest::create($data);
            $guests[] = $guest;
            $this->command->info("Created guest: {$guest->first_name} {$guest->last_name}");
        }

        // Create sample reservations
        $today = now();
        $rooms = Room::all();

        $reservationsData = [
            [
                'guest' => $guests[0],
                'room' => $rooms->where('room_number', '401')->first(),
                'check_in' => $today->copy()->subDays(2),
                'check_out' => $today->copy()->addDays(3),
                'status' => 'checked_in',
                'adults' => 1,
                'children' => 0,
            ],
            [
                'guest' => $guests[1],
                'room' => $rooms->where('room_number', '403')->first(),
                'check_in' => $today->copy()->addDays(1),
                'check_out' => $today->copy()->addDays(5),
                'status' => 'confirmed',
                'adults' => 2,
                'children' => 0,
            ],
            [
                'guest' => $guests[2],
                'room' => $rooms->where('room_number', '402')->first(),
                'check_in' => $today->copy()->subDays(5),
                'check_out' => $today->copy()->subDays(1),
                'status' => 'checked_out',
                'adults' => 2,
                'children' => 1,
            ],
            [
                'guest' => $guests[3],
                'room' => $rooms->where('room_number', '501')->first(),
                'check_in' => $today->copy()->addDays(3),
                'check_out' => $today->copy()->addDays(7),
                'status' => 'confirmed',
                'adults' => 1,
                'children' => 0,
            ],
            [
                'guest' => $guests[4],
                'room' => $rooms->where('room_number', '406')->first(),
                'check_in' => $today->copy()->subDays(1),
                'check_out' => $today->copy()->addDays(4),
                'status' => 'checked_in',
                'adults' => 3,
                'children' => 1,
            ],
        ];

        foreach ($reservationsData as $data) {
            $roomType = $data['room']->roomType;
            $nights = $data['check_in']->diffInDays($data['check_out']);
            
            Reservation::create([
                'guest_id' => $data['guest']->id,
                'room_id' => $data['room']->id,
                'room_type_id' => $roomType->id,
                'reservation_number' => 'RES-' . str_pad(random_int(1000, 9999), 4, '0', STR_PAD_LEFT),
                'source' => 'direct',
                'check_in_date' => $data['check_in'],
                'check_out_date' => $data['check_out'],
                'adults' => $data['adults'],
                'children' => $data['children'],
                'nights' => $nights,
                'status' => $data['status'],
                'payment_status' => $data['status'] === 'checked_out' ? 'paid' : 'partially_paid',
                'subtotal' => $roomType->base_price * $nights,
                'taxes' => $roomType->base_price * $nights * 0.14, // 14% tax
                'fees' => 0,
                'total_amount' => $roomType->base_price * $nights * 1.14,
                'paid_amount' => $data['status'] === 'checked_out' ? $roomType->base_price * $nights * 1.14 : $roomType->base_price * $nights * 0.5,
            ]);
            
            $this->command->info("Created reservation for {$data['guest']->first_name} in room {$data['room']->room_number}");
        }

        // Create housekeeping tasks for today
        $today = now();
        $tasksData = [
            [
                'room' => $rooms->where('room_number', '402')->first(),
                'task_type' => 'cleaning',
                'priority' => 'high',
                'scheduled_at' => $today->copy()->setHour(9)->setMinute(0),
                'status' => 'pending',
            ],
            [
                'room' => $rooms->where('room_number', '403')->first(),
                'task_type' => 'turnover',
                'priority' => 'urgent',
                'scheduled_at' => $today->copy()->setHour(10)->setMinute(0),
                'status' => 'pending',
            ],
            [
                'room' => $rooms->where('room_number', '404')->first(),
                'task_type' => 'cleaning',
                'priority' => 'medium',
                'scheduled_at' => $today->copy()->setHour(11)->setMinute(0),
                'status' => 'in_progress',
            ],
            [
                'room' => $rooms->where('room_number', '405')->first(),
                'task_type' => 'inspection',
                'priority' => 'low',
                'scheduled_at' => $today->copy()->setHour(14)->setMinute(0),
                'status' => 'pending',
            ],
            [
                'room' => $rooms->where('room_number', '406')->first(),
                'task_type' => 'deep_clean',
                'priority' => 'medium',
                'scheduled_at' => $today->copy()->setHour(15)->setMinute(0),
                'status' => 'completed',
            ],
        ];

        foreach ($tasksData as $data) {
            HousekeepingTask::create([
                'room_id' => $data['room']->id,
                'assigned_to' => null,
                'task_type' => $data['task_type'],
                'priority' => $data['priority'],
                'status' => $data['status'],
                'scheduled_at' => $data['scheduled_at'],
                'started_at' => $data['status'] === 'in_progress' || $data['status'] === 'completed' ? $data['scheduled_at'] : null,
                'completed_at' => $data['status'] === 'completed' ? $data['scheduled_at']->copy()->addHour() : null,
                'notes' => null,
                'checklist' => null,
                'created_by' => $user->id,
            ]);
            $this->command->info("Created housekeeping task for room {$data['room']->room_number}");
        }

        $this->command->info('Demo data seeding completed successfully!');
    }
}
