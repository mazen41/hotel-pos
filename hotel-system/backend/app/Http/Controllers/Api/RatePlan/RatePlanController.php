<?php

namespace App\Http\Controllers\Api\RatePlan;

use App\Http\Controllers\Controller;
use App\Http\Resources\RatePlanResource;
use App\Models\RatePlan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RatePlanController extends Controller
{
    /**
     * GET /api/rate-plans
     *
     * List rate plans with search, filters, sorting, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = RatePlan::query()->with(['roomTypes', 'seasonalRates', 'dynamicPricingRules', 'restrictions']);

        // Search
        if ($search = $request->get('search')) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by active status
        if ($request->has('active')) {
            $active = filter_var($request->get('active'), FILTER_VALIDATE_BOOLEAN);
            if ($active) {
                $query->active();
            } else {
                $query->inactive();
            }
        }

        // Filter by type
        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        // Filter by room type
        if ($roomTypeId = $request->get('room_type_id')) {
            $query->whereHas('roomTypes', function (Builder $q) use ($roomTypeId) {
                $q->where('room_types.id', $roomTypeId);
            });
        }

        // Sorting
        $sortField = $request->get('sort', 'priority');
        $sortDirection = strtolower($request->get('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['name', 'type', 'base_rate', 'priority', 'created_at', 'updated_at'];

        if (!in_array($sortField, $allowedSorts, true)) {
            $sortField = 'priority';
        }

        $ratePlans = $query
            ->orderBy($sortField, $sortDirection)
            ->paginate((int) $request->get('per_page', 15))
            ->withQueryString();

        return response()->json([
            'data' => RatePlanResource::collection($ratePlans->items()),
            'meta' => [
                'current_page' => $ratePlans->currentPage(),
                'from'         => $ratePlans->firstItem(),
                'last_page'    => $ratePlans->lastPage(),
                'per_page'     => $ratePlans->perPage(),
                'to'           => $ratePlans->lastItem(),
                'total'        => $ratePlans->total(),
            ],
            'links' => [
                'first' => $ratePlans->url(1),
                'last'  => $ratePlans->url($ratePlans->lastPage()),
                'prev'  => $ratePlans->previousPageUrl(),
                'next'  => $ratePlans->nextPageUrl(),
            ],
        ]);
    }

    /**
     * GET /api/rate-plans/search
     *
     * Quick search for rate plans (faster, limited results).
     */
    public function search(Request $request): JsonResponse
    {
        $search = $request->get('q', '');
        $perPage = min((int) $request->get('per_page', 10), 50);

        $ratePlans = RatePlan::query()
            ->where('name', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%")
            ->limit($perPage)
            ->get();

        return response()->json([
            'data' => RatePlanResource::collection($ratePlans),
        ]);
    }

    /**
     * GET /api/rate-plans/{id}
     */
    public function show(RatePlan $ratePlan): JsonResponse
    {
        $ratePlan->load(['roomTypes', 'seasonalRates', 'dynamicPricingRules', 'restrictions']);

        return response()->json([
            'data' => new RatePlanResource($ratePlan),
        ]);
    }

    /**
     * POST /api/rate-plans
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validate($request, [
            'name'                    => 'required|string|max:255',
            'description'             => 'nullable|string',
            'type'                    => 'required|in:standard,corporate,seasonal,package,promotional',
            'pricing_type'            => 'required|in:fixed,percentage,per_person,per_night',
            'base_rate'               => 'required|numeric|min:0',
            'min_nights'              => 'nullable|integer|min:1',
            'max_nights'              => 'nullable|integer|min:1',
            'occupancy_based_pricing' => 'boolean',
            'allow_children'          => 'boolean',
            'allow_extra_beds'        => 'boolean',
            'extra_bed_price'         => 'nullable|numeric|min:0',
            'meal_plan_included'      => 'boolean',
            'meal_plan_type'          => 'nullable|string|max:100',
            'cancellation_policy'     => 'nullable|string',
            'payment_policy'          => 'nullable|string',
            'active'                  => 'boolean',
            'priority'                => 'integer|min:1',
            'available_channels'      => 'array',
            'channel_sync_enabled'    => 'boolean',
            'room_type_rates'         => 'array',
        ]);

        $ratePlan = RatePlan::create($validated);

        if (!empty($validated['room_type_rates'])) {
            foreach ($validated['room_type_rates'] as $roomTypeRate) {
                $ratePlan->roomTypes()->attach($roomTypeRate['room_type_id'], [
                    'rate' => $roomTypeRate['rate'],
                ]);
            }
        }

        $ratePlan->load(['roomTypes', 'seasonalRates', 'dynamicPricingRules', 'restrictions']);

        return response()->json([
            'message' => 'Rate plan created successfully.',
            'data'    => new RatePlanResource($ratePlan),
        ], 201);
    }

    /**
     * PUT /api/rate-plans/{id}
     */
    public function update(Request $request, RatePlan $ratePlan): JsonResponse
    {
        $validated = $this->validate($request, [
            'name'                    => 'sometimes|required|string|max:255',
            'description'             => 'nullable|string',
            'type'                    => 'sometimes|required|in:standard,corporate,seasonal,package,promotional',
            'pricing_type'            => 'sometimes|required|in:fixed,percentage,per_person,per_night',
            'base_rate'               => 'sometimes|required|numeric|min:0',
            'min_nights'              => 'nullable|integer|min:1',
            'max_nights'              => 'nullable|integer|min:1',
            'occupancy_based_pricing' => 'boolean',
            'allow_children'          => 'boolean',
            'allow_extra_beds'        => 'boolean',
            'extra_bed_price'         => 'nullable|numeric|min:0',
            'meal_plan_included'      => 'boolean',
            'meal_plan_type'          => 'nullable|string|max:100',
            'cancellation_policy'     => 'nullable|string',
            'payment_policy'          => 'nullable|string',
            'active'                  => 'boolean',
            'priority'                => 'sometimes|required|integer|min:1',
            'available_channels'      => 'array',
            'channel_sync_enabled'    => 'boolean',
            'room_type_rates'         => 'array',
        ]);

        $ratePlan->update($validated);

        if (isset($validated['room_type_rates'])) {
            $ratePlan->roomTypes()->detach();
            foreach ($validated['room_type_rates'] as $roomTypeRate) {
                $ratePlan->roomTypes()->attach($roomTypeRate['room_type_id'], [
                    'rate' => $roomTypeRate['rate'],
                ]);
            }
        }

        $ratePlan->load(['roomTypes', 'seasonalRates', 'dynamicPricingRules', 'restrictions']);

        return response()->json([
            'message' => 'Rate plan updated successfully.',
            'data'    => new RatePlanResource($ratePlan),
        ]);
    }

    /**
     * DELETE /api/rate-plans/{id}
     */
    public function destroy(RatePlan $ratePlan): JsonResponse
    {
        $ratePlanId = $ratePlan->id;
        $ratePlan->delete();

        return response()->json([
            'message'      => 'Rate plan deleted successfully.',
            'rate_plan_id' => $ratePlanId,
        ]);
    }

    /**
     * POST /api/rate-plans/{id}/activate
     */
    public function activate(RatePlan $ratePlan): JsonResponse
    {
        $ratePlan->activate();

        return response()->json([
            'message' => 'Rate plan activated successfully.',
            'data'    => new RatePlanResource($ratePlan->load(['roomTypes', 'seasonalRates', 'dynamicPricingRules', 'restrictions'])),
        ]);
    }

    /**
     * POST /api/rate-plans/{id}/deactivate
     */
    public function deactivate(RatePlan $ratePlan): JsonResponse
    {
        $ratePlan->deactivate();

        return response()->json([
            'message' => 'Rate plan deactivated successfully.',
            'data'    => new RatePlanResource($ratePlan->load(['roomTypes', 'seasonalRates', 'dynamicPricingRules', 'restrictions'])),
        ]);
    }

    /**
     * POST /api/rate-plans/{id}/duplicate
     */
    public function duplicate(Request $request, RatePlan $ratePlan): JsonResponse
    {
        $validated = $this->validate($request, [
            'name' => 'required|string|max:255',
        ]);

        $duplicate = $ratePlan->duplicate($validated['name']);

        return response()->json([
            'message' => 'Rate plan duplicated successfully.',
            'data'    => new RatePlanResource($duplicate->load(['roomTypes', 'seasonalRates', 'dynamicPricingRules', 'restrictions'])),
        ]);
    }

    // ─── Channel Manager Placeholder Methods ──────────────────────────────────

    /**
     * POST /api/rate-plans/{id}/sync-to-channel
     */
    public function syncToChannel(RatePlan $ratePlan): JsonResponse
    {
        return response()->json([
            'message' => 'Channel manager sync is not implemented yet.',
            'data'    => [
                'rate_plan_id' => $ratePlan->id,
                'status'       => 'pending',
                'note'         => 'This is a placeholder for channel manager integration',
            ],
        ], 501);
    }

    /**
     * POST /api/rate-plans/{id}/sync-from-channel
     */
    public function syncFromChannel(RatePlan $ratePlan): JsonResponse
    {
        return response()->json([
            'message' => 'Channel manager sync is not implemented yet.',
            'data'    => [
                'rate_plan_id' => $ratePlan->id,
                'status'       => 'pending',
                'note'         => 'This is a placeholder for channel manager integration',
            ],
        ], 501);
    }
}
