<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentMethodController extends Controller
{
    /**
     * Get all payment methods
     */
    public function index(): JsonResponse
    {
        $paymentMethods = PaymentMethod::orderBy('sort_order')->get();

        return response()->json(['data' => $paymentMethods]);
    }

    /**
     * Create a new payment method
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:payment_methods,code',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0'
        ]);

        $paymentMethod = PaymentMethod::create([
            'name' => $request->name,
            'code' => $request->code,
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->sort_order ?? 0
        ]);

        return response()->json([
            'message' => 'Payment method created successfully',
            'data' => $paymentMethod
        ], 201);
    }

    /**
     * Get a specific payment method
     */
    public function show(PaymentMethod $paymentMethod): JsonResponse
    {
        return response()->json(['data' => $paymentMethod]);
    }

    /**
     * Update a payment method
     */
    public function update(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:50|unique:payment_methods,code,' . $paymentMethod->id,
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0'
        ]);

        $paymentMethod->update($request->only([
            'name', 'code', 'is_active', 'sort_order'
        ]));

        return response()->json([
            'message' => 'Payment method updated successfully',
            'data' => $paymentMethod
        ]);
    }

    /**
     * Delete a payment method
     */
    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->delete();

        return response()->json([
            'message' => 'Payment method deleted successfully'
        ]);
    }
}
