<?php

namespace App\Http\Controllers\Api\Availability;

use App\Http\Controllers\Controller;
use App\Models\Availability;
use App\Models\AvailabilityBlock;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AvailabilityController extends Controller
{
    /**
     * Get availability calendar for a date range.
     */
    public function calendar(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'room_type_id' => 'nullable|exists:room_types,id',
        ]);

        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);

        $query = Availability::with(['room.roomType', 'reservation'])
            ->dateRange($request->start_date, $request->end_date);

        if ($request->room_type_id) {
            $query->byRoomType($request->room_type_id);
        }

        $availabilities = $query->get();

        // Group by date for calendar view
        $calendar = [];
        foreach ($availabilities as $availability) {
            $date = $availability->date->format('Y-m-d');
            if (!isset($calendar[$date])) {
                $calendar[$date] = [];
            }
            $calendar[$date][] = $availability;
        }

        return response()->json([
            'calendar' => $calendar,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'total_days' => $startDate->diffInDays($endDate) + 1,
        ]);
    }

    /**
     * Get daily availability summary.
     */
    public function daily(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $date = $request->date;

        $summary = DB::table('availabilities')
            ->join('rooms', 'availabilities.room_id', '=', 'rooms.id')
            ->join('room_types', 'rooms.room_type_id', '=', 'room_types.id')
            ->where('availabilities.date', $date)
            ->select(
                'room_types.name as room_type_name',
                DB::raw('COUNT(*) as total_rooms'),
                DB::raw('SUM(CASE WHEN availabilities.status = "available" AND availabilities.stop_sell = 0 THEN 1 ELSE 0 END) as available'),
                DB::raw('SUM(CASE WHEN availabilities.status = "booked" THEN 1 ELSE 0 END) as booked'),
                DB::raw('SUM(CASE WHEN availabilities.status = "blocked" THEN 1 ELSE 0 END) as blocked'),
                DB::raw('SUM(CASE WHEN availabilities.status = "maintenance" THEN 1 ELSE 0 END) as maintenance'),
                DB::raw('SUM(CASE WHEN availabilities.status = "cleaning" THEN 1 ELSE 0 END) as cleaning')
            )
            ->groupBy('room_types.id', 'room_types.name')
            ->get();

        return response()->json([
            'date' => $date,
            'summary' => $summary,
        ]);
    }

    /**
     * Search availability for booking.
     */
    public function search(Request $request)
    {
        $request->validate([
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
            'adults' => 'required|integer|min:1',
            'children' => 'nullable|integer|min:0',
            'room_type_id' => 'nullable|exists:room_types,id',
        ]);

        $checkIn = Carbon::parse($request->check_in);
        $checkOut = Carbon::parse($request->check_out);
        $guests = $request->adults + ($request->children ?? 0);

        $query = Room::with('roomType')
            ->where('is_active', true)
            ->where('status', '!=', 'out_of_order');

        if ($request->room_type_id) {
            $query->where('room_type_id', $request->room_type_id);
        }

        $rooms = $query->get();

        $availableRooms = [];
        foreach ($rooms as $room) {
            // Check capacity
            if ($room->roomType->max_occupancy < $guests) {
                continue;
            }

            // Check availability for all dates in range
            $isAvailable = true;
            $dates = [];
            for ($date = $checkIn->copy(); $date < $checkOut; $date->addDay()) {
                $availability = Availability::where('room_id', $room->id)
                    ->where('date', $date->format('Y-m-d'))
                    ->first();

                if (!$availability || !$availability->isBookable()) {
                    $isAvailable = false;
                    break;
                }
                $dates[] = $availability;
            }

            if ($isAvailable) {
                $availableRooms[] = [
                    'room' => $room,
                    'room_type' => $room->roomType,
                    'availabilities' => $dates,
                    'total_price' => $this->calculateTotalPrice($dates, $request->adults, $request->children ?? 0),
                ];
            }
        }

        return response()->json([
            'check_in' => $request->check_in,
            'check_out' => $request->check_out,
            'adults' => $request->adults,
            'children' => $request->children ?? 0,
            'nights' => $checkIn->diffInDays($checkOut),
            'available_rooms' => $availableRooms,
        ]);
    }

    /**
     * Update availability status.
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:available,booked,blocked,maintenance,out_of_order,check_out_day,check_in_day',
            'notes' => 'nullable|string',
        ]);

        $availability = Availability::findOrFail($id);
        $availability->update([
            'status' => $request->status,
            'notes' => $request->notes,
        ]);

        return response()->json([
            'message' => 'Availability status updated successfully',
            'availability' => $availability->load('room.roomType'),
        ]);
    }

    /**
     * Set stop sell for a room on specific dates.
     */
    public function setStopSell(Request $request)
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'stop_sell' => 'required|boolean',
        ]);

        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);

        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            Availability::updateOrCreate(
                [
                    'room_id' => $request->room_id,
                    'date' => $date->format('Y-m-d'),
                ],
                [
                    'stop_sell' => $request->stop_sell,
                ]
            );
        }

        return response()->json([
            'message' => 'Stop sell updated successfully',
        ]);
    }

    /**
     * Create availability block.
     */
    public function createBlock(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'room_id' => 'nullable|exists:rooms,id',
            'room_type_id' => 'nullable|exists:room_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|in:maintenance,renovation,group_booking,owner_use,staff_use,other',
        ]);

        $block = AvailabilityBlock::create([
            'name' => $request->name,
            'description' => $request->description,
            'room_id' => $request->room_id,
            'room_type_id' => $request->room_type_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'is_active' => true,
            'created_by' => auth()->id(),
        ]);

        // Apply block to availabilities
        $this->applyBlockToAvailabilities($block);

        return response()->json([
            'message' => 'Availability block created successfully',
            'block' => $block->load('room', 'roomType', 'creator'),
        ], 201);
    }

    /**
     * Get all availability blocks.
     */
    public function getBlocks(Request $request)
    {
        $blocks = AvailabilityBlock::with(['room', 'roomType', 'creator'])
            ->when($request->active, function ($query) {
                return $query->active();
            })
            ->orderBy('start_date')
            ->get();

        return response()->json(['blocks' => $blocks]);
    }

    /**
     * Delete availability block.
     */
    public function deleteBlock($id)
    {
        $block = AvailabilityBlock::findOrFail($id);
        
        // Remove block from availabilities
        $this->removeBlockFromAvailabilities($block);
        
        $block->delete();

        return response()->json([
            'message' => 'Availability block deleted successfully',
        ]);
    }

    /**
     * Helper method to calculate total price.
     */
    private function calculateTotalPrice($availabilities, $adults, $children)
    {
        $total = 0;
        foreach ($availabilities as $availability) {
            $total += $availability->price ?? 0;
        }
        return $total;
    }

    /**
     * Helper method to apply block to availabilities.
     */
    private function applyBlockToAvailabilities(AvailabilityBlock $block)
    {
        $startDate = Carbon::parse($block->start_date);
        $endDate = Carbon::parse($block->end_date);

        if ($block->room_id) {
            // Block specific room
            for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
                Availability::updateOrCreate(
                    [
                        'room_id' => $block->room_id,
                        'date' => $date->format('Y-m-d'),
                    ],
                    [
                        'status' => 'blocked',
                        'notes' => "Blocked: {$block->name} - {$block->reason}",
                    ]
                );
            }
        } elseif ($block->room_type_id) {
            // Block all rooms of a type
            $rooms = Room::where('room_type_id', $block->room_type_id)->get();
            foreach ($rooms as $room) {
                for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
                    Availability::updateOrCreate(
                        [
                            'room_id' => $room->id,
                            'date' => $date->format('Y-m-d'),
                        ],
                        [
                            'status' => 'blocked',
                            'notes' => "Blocked: {$block->name} - {$block->reason}",
                        ]
                    );
                }
            }
        }
    }

    /**
     * Helper method to remove block from availabilities.
     */
    private function removeBlockFromAvailabilities(AvailabilityBlock $block)
    {
        $startDate = Carbon::parse($block->start_date);
        $endDate = Carbon::parse($block->end_date);

        if ($block->room_id) {
            Availability::where('room_id', $block->room_id)
                ->whereBetween('date', [$startDate, $endDate])
                ->where('status', 'blocked')
                ->where('notes', 'like', "Blocked: {$block->name}%")
                ->update(['status' => 'available', 'notes' => null]);
        } elseif ($block->room_type_id) {
            $rooms = Room::where('room_type_id', $block->room_type_id)->pluck('id');
            Availability::whereIn('room_id', $rooms)
                ->whereBetween('date', [$startDate, $endDate])
                ->where('status', 'blocked')
                ->where('notes', 'like', "Blocked: {$block->name}%")
                ->update(['status' => 'available', 'notes' => null]);
        }
    }
}
