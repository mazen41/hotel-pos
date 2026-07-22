<?php

namespace App\Http\Controllers\Api\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StoreChargeRequest;
use App\Http\Requests\Billing\UpdateChargeRequest;
use App\Http\Resources\Billing\ChargeResource;
use App\Models\Charge;
use App\Models\Folio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChargeController extends Controller
{
    /**
     * GET /api/billing/charges
     */
    public function index(Request $request): JsonResponse
    {
        $query = Charge::query()->with(['folio', 'reservation', 'createdBy']);

        // Filter by folio
        if ($request->filled('folio_id')) {
            $query->where('folio_id', $request->folio_id);
        }

        // Filter by reservation
        if ($request->filled('reservation_id')) {
            $query->where('reservation_id', $request->reservation_id);
        }

        // Filter by charge type
        if ($request->filled('charge_type')) {
            $query->where('charge_type', $request->charge_type);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('charged_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('charged_at', '<=', $request->date_to);
        }

        $sortField = $request->get('sort', 'charged_at');
        $sortDirection = strtolower($request->get('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['charged_at', 'amount', 'total_amount', 'charge_type', 'created_at'];

        if (!in_array($sortField, $allowedSorts, true)) {
            $sortField = 'charged_at';
        }

        $charges = $query
            ->orderBy($sortField, $sortDirection)
            ->paginate((int) $request->get('per_page', 15))
            ->withQueryString();

        return response()->json([
            'data' => ChargeResource::collection($charges->items()),
            'meta' => [
                'current_page' => $charges->currentPage(),
                'from' => $charges->firstItem(),
                'last_page' => $charges->lastPage(),
                'per_page' => $charges->perPage(),
                'to' => $charges->lastItem(),
                'total' => $charges->total(),
            ],
            'links' => [
                'first' => $charges->url(1),
                'last' => $charges->url($charges->lastPage()),
                'prev' => $charges->previousPageUrl(),
                'next' => $charges->nextPageUrl(),
            ],
        ]);
    }

    /**
     * POST /api/billing/charges
     */
    public function store(StoreChargeRequest $request): JsonResponse
    {
        $folio = Folio::findOrFail($request->folio_id);

        if ($folio->status === 'closed') {
            return response()->json([
                'message' => 'Cannot add charges to a closed folio.',
            ], 409);
        }

        $charge = Charge::create(array_merge($request->validated(), [
            'created_by' => auth()->id(),
        ]));

        return response()->json([
            'message' => 'Charge created successfully.',
            'data' => new ChargeResource($charge->load(['folio', 'reservation', 'createdBy'])),
        ], 201);
    }

    /**
     * GET /api/billing/charges/{id}
     */
    public function show(Charge $charge): JsonResponse
    {
        $charge->load(['folio', 'reservation', 'createdBy']);

        return response()->json([
            'data' => new ChargeResource($charge),
        ]);
    }

    /**
     * PUT /api/billing/charges/{id}
     */
    public function update(UpdateChargeRequest $request, Charge $charge): JsonResponse
    {
        if ($charge->folio->status === 'closed') {
            return response()->json([
                'message' => 'Cannot update charges on a closed folio.',
            ], 409);
        }

        $charge->update($request->validated());

        return response()->json([
            'message' => 'Charge updated successfully.',
            'data' => new ChargeResource($charge->load(['folio', 'reservation', 'createdBy'])),
        ]);
    }

    /**
     * DELETE /api/billing/charges/{id}
     */
    public function destroy(Charge $charge): JsonResponse
    {
        if ($charge->folio->status === 'closed') {
            return response()->json([
                'message' => 'Cannot delete charges from a closed folio.',
            ], 409);
        }

        $charge->delete();

        return response()->json([
            'message' => 'Charge deleted successfully.',
        ]);
    }
}
