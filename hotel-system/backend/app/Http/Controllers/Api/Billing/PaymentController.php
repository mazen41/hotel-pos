<?php

namespace App\Http\Controllers\Api\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StorePaymentRequest;
use App\Http\Requests\Billing\UpdatePaymentRequest;
use App\Http\Resources\Billing\PaymentResource;
use App\Models\Payment;
use App\Models\Folio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * GET /api/billing/payments
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::query()->with(['folio', 'reservation', 'receivedBy']);

        // Filter by folio
        if ($request->filled('folio_id')) {
            $query->where('folio_id', $request->folio_id);
        }

        // Filter by reservation
        if ($request->filled('reservation_id')) {
            $query->where('reservation_id', $request->reservation_id);
        }

        // Filter by payment method
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('payment_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('payment_date', '<=', $request->date_to);
        }

        $sortField = $request->get('sort', 'payment_date');
        $sortDirection = strtolower($request->get('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['payment_date', 'amount', 'payment_method', 'status', 'created_at'];

        if (!in_array($sortField, $allowedSorts, true)) {
            $sortField = 'payment_date';
        }

        $payments = $query
            ->orderBy($sortField, $sortDirection)
            ->paginate((int) $request->get('per_page', 15))
            ->withQueryString();

        return response()->json([
            'data' => PaymentResource::collection($payments->items()),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'from' => $payments->firstItem(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'to' => $payments->lastItem(),
                'total' => $payments->total(),
            ],
            'links' => [
                'first' => $payments->url(1),
                'last' => $payments->url($payments->lastPage()),
                'prev' => $payments->previousPageUrl(),
                'next' => $payments->nextPageUrl(),
            ],
        ]);
    }

    /**
     * POST /api/billing/payments
     */
    public function store(StorePaymentRequest $request): JsonResponse
    {
        $folio = Folio::findOrFail($request->folio_id);

        if ($folio->status === 'closed') {
            return response()->json([
                'message' => 'Cannot add payments to a closed folio.',
            ], 409);
        }

        $payment = Payment::create(array_merge($request->validated(), [
            'received_by' => auth()->id(),
        ]));

        return response()->json([
            'message' => 'Payment created successfully.',
            'data' => new PaymentResource($payment->load(['folio', 'reservation', 'receivedBy'])),
        ], 201);
    }

    /**
     * GET /api/billing/payments/{id}
     */
    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['folio', 'reservation', 'receivedBy']);

        return response()->json([
            'data' => new PaymentResource($payment),
        ]);
    }

    /**
     * PUT /api/billing/payments/{id}
     */
    public function update(UpdatePaymentRequest $request, Payment $payment): JsonResponse
    {
        if ($payment->folio->status === 'closed') {
            return response()->json([
                'message' => 'Cannot update payments on a closed folio.',
            ], 409);
        }

        $payment->update($request->validated());

        return response()->json([
            'message' => 'Payment updated successfully.',
            'data' => new PaymentResource($payment->load(['folio', 'reservation', 'receivedBy'])),
        ]);
    }

    /**
     * DELETE /api/billing/payments/{id}
     */
    public function destroy(Payment $payment): JsonResponse
    {
        if ($payment->folio->status === 'closed') {
            return response()->json([
                'message' => 'Cannot delete payments from a closed folio.',
            ], 409);
        }

        $payment->delete();

        return response()->json([
            'message' => 'Payment deleted successfully.',
        ]);
    }

    /**
     * POST /api/billing/payments/{id}/refund
     */
    public function refund(Payment $payment): JsonResponse
    {
        if ($payment->status !== 'completed') {
            return response()->json([
                'message' => 'Only completed payments can be refunded.',
            ], 409);
        }

        if ($payment->folio->status === 'closed') {
            return response()->json([
                'message' => 'Cannot refund payments on a closed folio.',
            ], 409);
        }

        $payment->update([
            'status' => 'refunded',
        ]);

        return response()->json([
            'message' => 'Payment refunded successfully.',
            'data' => new PaymentResource($payment->load(['folio', 'reservation', 'receivedBy'])),
        ]);
    }
}
