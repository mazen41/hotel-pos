<?php

namespace App\Http\Controllers\Api\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StoreFolioRequest;
use App\Http\Requests\Billing\UpdateFolioRequest;
use App\Http\Resources\Billing\FolioResource;
use App\Models\Folio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FolioController extends Controller
{
    /**
     * GET /api/billing/folios
     */
    public function index(Request $request): JsonResponse
    {
        $query = Folio::query()->with(['reservation', 'guest', 'charges', 'payments', 'createdBy']);

        // Filter by reservation
        if ($request->filled('reservation_id')) {
            $query->where('reservation_id', $request->reservation_id);
        }

        // Filter by guest
        if ($request->filled('guest_id')) {
            $query->where('guest_id', $request->guest_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by folio number
        if ($request->filled('folio_number')) {
            $query->where('folio_number', 'like', '%' . $request->folio_number . '%');
        }

        // Filter by balance
        if ($request->filled('with_balance') && $request->with_balance) {
            $query->where('balance_due', '>', 0);
        }

        $sortField = $request->get('sort', 'created_at');
        $sortDirection = strtolower($request->get('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['created_at', 'folio_number', 'total_amount', 'balance_due', 'status'];

        if (!in_array($sortField, $allowedSorts, true)) {
            $sortField = 'created_at';
        }

        $folios = $query
            ->orderBy($sortField, $sortDirection)
            ->paginate((int) $request->get('per_page', 15))
            ->withQueryString();

        return response()->json([
            'data' => FolioResource::collection($folios->items()),
            'meta' => [
                'current_page' => $folios->currentPage(),
                'from' => $folios->firstItem(),
                'last_page' => $folios->lastPage(),
                'per_page' => $folios->perPage(),
                'to' => $folios->lastItem(),
                'total' => $folios->total(),
            ],
            'links' => [
                'first' => $folios->url(1),
                'last' => $folios->url($folios->lastPage()),
                'prev' => $folios->previousPageUrl(),
                'next' => $folios->nextPageUrl(),
            ],
        ]);
    }

    /**
     * POST /api/billing/folios
     */
    public function store(StoreFolioRequest $request): JsonResponse
    {
        $folio = Folio::create(array_merge($request->validated(), [
            'created_by' => auth()->id(),
        ]));

        return response()->json([
            'message' => 'Folio created successfully.',
            'data' => new FolioResource($folio->load(['reservation', 'guest', 'charges', 'payments', 'createdBy'])),
        ], 201);
    }

    /**
     * GET /api/billing/folios/{id}
     */
    public function show(Folio $folio): JsonResponse
    {
        $folio->load(['reservation', 'guest', 'charges', 'payments', 'createdBy']);

        return response()->json([
            'data' => new FolioResource($folio),
        ]);
    }

    /**
     * PUT /api/billing/folios/{id}
     */
    public function update(UpdateFolioRequest $request, Folio $folio): JsonResponse
    {
        $folio->update($request->validated());

        return response()->json([
            'message' => 'Folio updated successfully.',
            'data' => new FolioResource($folio->load(['reservation', 'guest', 'charges', 'payments', 'createdBy'])),
        ]);
    }

    /**
     * DELETE /api/billing/folios/{id}
     */
    public function destroy(Folio $folio): JsonResponse
    {
        if ($folio->status === 'closed') {
            return response()->json([
                'message' => 'Cannot delete a closed folio.',
            ], 409);
        }

        if ($folio->charges()->exists() || $folio->payments()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a folio with charges or payments.',
            ], 409);
        }

        $folio->delete();

        return response()->json([
            'message' => 'Folio deleted successfully.',
        ]);
    }

    /**
     * POST /api/billing/folios/{id}/close
     */
    public function close(Folio $folio): JsonResponse
    {
        if ($folio->status === 'closed') {
            return response()->json([
                'message' => 'Folio is already closed.',
            ], 409);
        }

        if ($folio->balance_due > 0) {
            return response()->json([
                'message' => 'Cannot close folio with outstanding balance.',
            ], 409);
        }

        $folio->close();

        return response()->json([
            'message' => 'Folio closed successfully.',
            'data' => new FolioResource($folio->load(['reservation', 'guest', 'charges', 'payments', 'createdBy'])),
        ]);
    }

    /**
     * POST /api/billing/folios/{id}/reopen
     */
    public function reopen(Folio $folio): JsonResponse
    {
        if ($folio->status !== 'closed') {
            return response()->json([
                'message' => 'Only closed folios can be reopened.',
            ], 409);
        }

        $folio->update([
            'status' => 'open',
            'closed_at' => null,
        ]);

        return response()->json([
            'message' => 'Folio reopened successfully.',
            'data' => new FolioResource($folio->load(['reservation', 'guest', 'charges', 'payments', 'createdBy'])),
        ]);
    }
}
