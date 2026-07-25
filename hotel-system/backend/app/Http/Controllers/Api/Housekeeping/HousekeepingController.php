<?php

namespace App\Http\Controllers\Api\Housekeeping;

use App\Http\Controllers\Controller;
use App\Models\HousekeepingTask;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HousekeepingController extends Controller
{
    public function index(Request $request)
    {
        $query = HousekeepingTask::with(['room.roomType', 'assignedTo', 'createdBy']);

        // Filters
        if ($request->has('status')) {
            $query->byStatus($request->status);
        }
        if ($request->has('priority')) {
            $query->byPriority($request->priority);
        }
        if ($request->has('date')) {
            $query->byDate($request->date);
        }
        if ($request->has('room_id')) {
            $query->where('room_id', $request->room_id);
        }
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Sorting
        $query->orderBy('scheduled_at', 'asc');

        $tasks = $query->paginate($request->per_page ?? 15);

        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'assigned_to' => 'nullable|exists:users,id',
            'task_type' => 'required|in:cleaning,inspection,maintenance,turnover,deep_clean',
            'priority' => 'required|in:low,medium,high,urgent',
            'scheduled_at' => 'required|date',
            'notes' => 'nullable|string',
            'checklist' => 'nullable|array',
        ]);

        $task = HousekeepingTask::create([
            'room_id' => $request->room_id,
            'assigned_to' => $request->assigned_to,
            'task_type' => $request->task_type,
            'priority' => $request->priority,
            'status' => 'pending',
            'scheduled_at' => $request->scheduled_at,
            'notes' => $request->notes,
            'checklist' => $request->checklist,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Housekeeping task created successfully',
            'task' => $task->load(['room.roomType', 'assignedTo']),
        ], 201);
    }

    public function show($id)
    {
        $task = HousekeepingTask::with(['room.roomType', 'assignedTo', 'createdBy'])
            ->findOrFail($id);

        return response()->json($task);
    }

    public function update(Request $request, $id)
    {
        $task = HousekeepingTask::findOrFail($id);

        $request->validate([
            'assigned_to' => 'nullable|exists:users,id',
            'task_type' => 'sometimes|in:cleaning,inspection,maintenance,turnover,deep_clean',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'status' => 'sometimes|in:pending,in_progress,completed,skipped',
            'scheduled_at' => 'sometimes|date',
            'notes' => 'nullable|string',
            'checklist' => 'nullable|array',
        ]);

        // Handle status transitions
        if ($request->has('status')) {
            if ($request->status === 'in_progress' && $task->status === 'pending') {
                $task->started_at = Carbon::now();
            }
            if ($request->status === 'completed' && $task->status !== 'completed') {
                $task->completed_at = Carbon::now();
                if (!$task->started_at) {
                    $task->started_at = $task->completed_at;
                }
            }
        }

        $task->update($request->all());

        return response()->json([
            'message' => 'Housekeeping task updated successfully',
            'task' => $task->load(['room.roomType', 'assignedTo']),
        ]);
    }

    public function destroy($id)
    {
        $task = HousekeepingTask::findOrFail($id);
        $task->delete();

        return response()->json([
            'message' => 'Housekeeping task deleted successfully',
        ]);
    }

    public function board(Request $request)
    {
        $date = $request->date ?? Carbon::today()->toDateString();

        $tasks = HousekeepingTask::with(['room.roomType', 'assignedTo'])
            ->byDate($date)
            ->orderBy('priority', 'desc')
            ->orderBy('scheduled_at', 'asc')
            ->get();

        $board = [
            'pending' => $tasks->where('status', 'pending'),
            'in_progress' => $tasks->where('status', 'in_progress'),
            'completed' => $tasks->where('status', 'completed'),
            'skipped' => $tasks->where('status', 'skipped'),
        ];

        return response()->json([
            'date' => $date,
            'board' => $board,
            'summary' => [
                'total' => $tasks->count(),
                'pending' => $board['pending']->count(),
                'in_progress' => $board['in_progress']->count(),
                'completed' => $board['completed']->count(),
                'skipped' => $board['skipped']->count(),
            ],
        ]);
    }

    public function summary(Request $request)
    {
        $date = $request->date ?? Carbon::today()->toDateString();

        $summary = DB::table('housekeeping_tasks')
            ->join('rooms', 'housekeeping_tasks.room_id', '=', 'rooms.id')
            ->join('room_types', 'rooms.room_type_id', '=', 'room_types.id')
            ->whereDate('housekeeping_tasks.scheduled_at', $date)
            ->select(
                'room_types.name as room_type_name',
                DB::raw('COUNT(*) as total_tasks'),
                DB::raw('SUM(CASE WHEN housekeeping_tasks.status = "pending" THEN 1 ELSE 0 END) as pending'),
                DB::raw('SUM(CASE WHEN housekeeping_tasks.status = "in_progress" THEN 1 ELSE 0 END) as in_progress'),
                DB::raw('SUM(CASE WHEN housekeeping_tasks.status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN housekeeping_tasks.priority = "urgent" THEN 1 ELSE 0 END) as urgent')
            )
            ->groupBy('room_types.id', 'room_types.name')
            ->get();

        $overall = DB::table('housekeeping_tasks')
            ->whereDate('scheduled_at', $date)
            ->select(
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending'),
                DB::raw('SUM(CASE WHEN status = "in_progress" THEN 1 ELSE 0 END) as in_progress'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN status = "skipped" THEN 1 ELSE 0 END) as skipped'),
                DB::raw('SUM(CASE WHEN priority = "urgent" THEN 1 ELSE 0 END) as urgent')
            )
            ->first();

        return response()->json([
            'date' => $date,
            'by_room_type' => $summary,
            'overall' => $overall,
        ]);
    }

    public function assign(Request $request, $id)
    {
        $task = HousekeepingTask::findOrFail($id);

        $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $task->update([
            'assigned_to' => $request->assigned_to,
        ]);

        return response()->json([
            'message' => 'Task assigned successfully',
            'task' => $task->load(['room.roomType', 'assignedTo']),
        ]);
    }

    public function bulkCreate(Request $request)
    {
        $request->validate([
            'room_ids' => 'required|array',
            'room_ids.*' => 'exists:rooms,id',
            'task_type' => 'required|in:cleaning,inspection,maintenance,turnover,deep_clean',
            'priority' => 'required|in:low,medium,high,urgent',
            'scheduled_at' => 'required|date',
            'assigned_to' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        $tasks = [];
        foreach ($request->room_ids as $roomId) {
            $task = HousekeepingTask::create([
                'room_id' => $roomId,
                'assigned_to' => $request->assigned_to,
                'task_type' => $request->task_type,
                'priority' => $request->priority,
                'status' => 'pending',
                'scheduled_at' => $request->scheduled_at,
                'notes' => $request->notes,
                'created_by' => auth()->id(),
            ]);
            $tasks[] = $task;
        }

        return response()->json([
            'message' => count($tasks) . ' tasks created successfully',
            'tasks' => HousekeepingTask::whereIn('id', array_column($tasks, 'id'))
                ->with(['room.roomType', 'assignedTo'])
                ->get(),
        ], 201);
    }
}