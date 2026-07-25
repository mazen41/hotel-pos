<?php

namespace App\Http\Controllers\Api\Maintenance;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRequest;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MaintenanceController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get board view data (grouped by status).
     */
    public function board(Request $request): JsonResponse
    {
        $query = MaintenanceRequest::with(['room', 'assignedTo', 'createdBy'])
            ->orderBy('created_at', 'desc');

        // Filter by room if requested
        if ($request->has('room_id')) {
            $query->where('room_id', $request->room_id);
        }

        // Filter by priority if requested
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        $allRequests = $query->get();

        // Group by status
        $board = [
            'pending' => $allRequests->where('status', 'pending')->values(),
            'in_progress' => $allRequests->where('status', 'in_progress')->values(),
            'completed' => $allRequests->where('status', 'completed')->values(),
            'cancelled' => $allRequests->where('status', 'cancelled')->values(),
        ];

        // Get summary stats
        $summary = [
            'total' => $allRequests->count(),
            'pending' => $allRequests->where('status', 'pending')->count(),
            'in_progress' => $allRequests->where('status', 'in_progress')->count(),
            'completed' => $allRequests->where('status', 'completed')->count(),
            'urgent' => $allRequests->where('priority', 'urgent')->where('status', '!=', 'completed')->count(),
        ];

        return response()->json([
            'board' => $board,
            'summary' => $summary,
        ]);
    }

    /**
     * Get all maintenance requests.
     */
    public function index(Request $request): JsonResponse
    {
        $query = MaintenanceRequest::with(['room', 'assignedTo', 'createdBy'])
            ->orderBy('created_at', 'desc');

        // Filter by status if requested
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by priority if requested
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by room if requested
        if ($request->has('room_id')) {
            $query->where('room_id', $request->room_id);
        }

        // Filter by assigned user if requested
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        $requests = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $requests->items(),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'from' => $requests->firstItem(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'to' => $requests->lastItem(),
                'total' => $requests->total(),
            ],
        ]);
    }

    /**
     * Store a new maintenance request.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $maintenanceRequest = MaintenanceRequest::create([
            'room_id' => $validated['room_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'] ?? 'medium',
            'assigned_to' => $validated['assigned_to'] ?? null,
            'created_by' => $request->user()->id,
            'status' => 'pending',
        ]);

        // Load relationships
        $maintenanceRequest->load(['room', 'assignedTo', 'createdBy']);

        // Create notification
        $this->notificationService->notifyMaintenanceCreated($maintenanceRequest);

        return response()->json([
            'message' => 'Maintenance request created successfully',
            'data' => $maintenanceRequest,
        ], 201);
    }

    /**
     * Get a specific maintenance request.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $maintenanceRequest = MaintenanceRequest::with(['room', 'assignedTo', 'createdBy'])
            ->findOrFail($id);

        return response()->json([
            'data' => $maintenanceRequest,
        ]);
    }

    /**
     * Update a maintenance request.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'sometimes|in:pending,in_progress,completed,cancelled',
            'resolution_notes' => 'nullable|string',
        ]);

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);
        $maintenanceRequest->update($validated);

        // Auto-set resolved_at when status is completed
        if (isset($validated['status']) && $validated['status'] === 'completed' && !$maintenanceRequest->resolved_at) {
            $maintenanceRequest->resolved_at = now();
            $maintenanceRequest->save();
        }

        $maintenanceRequest->load(['room', 'assignedTo', 'createdBy']);

        return response()->json([
            'message' => 'Maintenance request updated successfully',
            'data' => $maintenanceRequest,
        ]);
    }

    /**
     * Delete a maintenance request.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $maintenanceRequest = MaintenanceRequest::findOrFail($id);
        $maintenanceRequest->delete();

        return response()->json([
            'message' => 'Maintenance request deleted successfully',
        ]);
    }

    /**
     * Assign a maintenance request to a user.
     */
    public function assign(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);
        $maintenanceRequest->assignTo($validated['assigned_to']);

        $maintenanceRequest->load(['room', 'assignedTo', 'createdBy']);

        return response()->json([
            'message' => 'Maintenance request assigned successfully',
            'data' => $maintenanceRequest,
        ]);
    }

    /**
     * Mark maintenance request as in progress.
     */
    public function markAsInProgress(Request $request, int $id): JsonResponse
    {
        $maintenanceRequest = MaintenanceRequest::findOrFail($id);
        $maintenanceRequest->markAsInProgress();

        $maintenanceRequest->load(['room', 'assignedTo', 'createdBy']);

        return response()->json([
            'message' => 'Maintenance request marked as in progress',
            'data' => $maintenanceRequest,
        ]);
    }

    /**
     * Mark maintenance request as completed.
     */
    public function markAsCompleted(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'resolution_notes' => 'nullable|string',
        ]);

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);
        $maintenanceRequest->markAsCompleted($validated['resolution_notes'] ?? null);

        $maintenanceRequest->load(['room', 'assignedTo', 'createdBy']);

        return response()->json([
            'message' => 'Maintenance request marked as completed',
            'data' => $maintenanceRequest,
        ]);
    }

    /**
     * Cancel a maintenance request.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $maintenanceRequest = MaintenanceRequest::findOrFail($id);
        $maintenanceRequest->cancel();

        $maintenanceRequest->load(['room', 'assignedTo', 'createdBy']);

        return response()->json([
            'message' => 'Maintenance request cancelled',
            'data' => $maintenanceRequest,
        ]);
    }
}
