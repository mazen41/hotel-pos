<?php

namespace App\Http\Controllers\Api\Guest;

use App\Http\Controllers\Controller;
use App\Http\Requests\Guest\SearchGuestRequest;
use App\Http\Requests\Guest\StoreGuestRequest;
use App\Http\Requests\Guest\UpdateGuestRequest;
use App\Http\Resources\GuestResource;
use App\Models\Guest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuestController extends Controller
{
    /**
     * GET /api/guests
     *
     * List guests with search, filters, sorting, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Guest::query()->withCount('reservations');

        $this->applyFilters($query, $request);

        $sortField = $request->get('sort', 'last_name');
        $sortDirection = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['first_name', 'last_name', 'email', 'country', 'city', 'created_at', 'updated_at'];

        if (! in_array($sortField, $allowedSorts, true)) {
            $sortField = 'last_name';
        }

        $guests = $query
            ->orderBy($sortField, $sortDirection)
            ->orderBy('first_name')
            ->paginate((int) $request->get('per_page', 15))
            ->withQueryString();

        return response()->json([
            'data' => GuestResource::collection($guests->items()),
            'meta' => [
                'current_page' => $guests->currentPage(),
                'from' => $guests->firstItem(),
                'last_page' => $guests->lastPage(),
                'per_page' => $guests->perPage(),
                'to' => $guests->lastItem(),
                'total' => $guests->total(),
            ],
            'links' => [
                'first' => $guests->url(1),
                'last' => $guests->url($guests->lastPage()),
                'prev' => $guests->previousPageUrl(),
                'next' => $guests->nextPageUrl(),
            ],
        ]);
    }

    /**
     * POST /api/guests
     *
     * Create a guest while flagging likely duplicates.
     */
    public function store(StoreGuestRequest $request): JsonResponse
    {
        $data = $request->validated();
        $duplicate = $this->findLikelyDuplicate($data);

        if ($duplicate) {
            return response()->json([
                'message' => 'A similar guest profile already exists.',
                'duplicate' => new GuestResource($duplicate->loadCount('reservations')),
            ], 409);
        }

        $guest = Guest::create($data);

        return response()->json([
            'message' => 'Guest created successfully.',
            'data' => new GuestResource($guest->loadCount('reservations')),
        ], 201);
    }

    /**
     * GET /api/guests/{id}
     */
    public function show(Guest $guest): JsonResponse
    {
        $guest->loadCount('reservations')
            ->load(['reservations' => fn ($query) => $query->latest('check_in')->limit(10)]);

        return response()->json([
            'data' => new GuestResource($guest),
        ]);
    }

    /**
     * PUT /api/guests/{id}
     */
    public function update(UpdateGuestRequest $request, Guest $guest): JsonResponse
    {
        $data = $request->validated();
        $duplicate = $this->findLikelyDuplicate($data, $guest->id);

        if ($duplicate) {
            return response()->json([
                'message' => 'A similar guest profile already exists.',
                'duplicate' => new GuestResource($duplicate->loadCount('reservations')),
            ], 409);
        }

        $guest->update($data);

        return response()->json([
            'message' => 'Guest updated successfully.',
            'data' => new GuestResource($guest->fresh()->loadCount('reservations')),
        ]);
    }

    /**
     * DELETE /api/guests/{id}
     */
    public function destroy(Guest $guest): JsonResponse
    {
        if ($guest->reservations()->exists()) {
            return response()->json([
                'message' => 'Guests with reservation history cannot be deleted.',
            ], 409);
        }

        $guest->delete();

        return response()->json([
            'message' => 'Guest deleted successfully.',
        ]);
    }

    /**
     * GET /api/guests/search?q=
     */
    public function search(SearchGuestRequest $request): JsonResponse
    {
        $guests = Guest::query()
            ->withCount('reservations')
            ->search($request->validated('q'))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit((int) $request->get('per_page', 20))
            ->get();

        return response()->json([
            'data' => GuestResource::collection($guests),
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        $query->search($request->get('search', $request->get('q')));

        if ($request->filled('country')) {
            $query->where('country', $request->country);
        }

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        if ($request->has('vip_status')) {
            $query->vip(filter_var($request->vip_status, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('marketing_consent')) {
            $query->marketingConsent(filter_var($request->marketing_consent, FILTER_VALIDATE_BOOLEAN));
        }
    }

    private function findLikelyDuplicate(array $data, ?int $ignoreId = null): ?Guest
    {
        $hasUniqueIdentifier = collect(['email', 'passport_number', 'national_id'])
            ->contains(fn (string $field) => ! empty($data[$field]));
        $hasNamePhoneMatch = ! empty($data['phone']) && ! empty($data['first_name']) && ! empty($data['last_name']);

        if (! $hasUniqueIdentifier && ! $hasNamePhoneMatch) {
            return null;
        }

        return Guest::query()
            ->when($ignoreId, fn (Builder $query) => $query->whereKeyNot($ignoreId))
            ->where(function (Builder $query) use ($data): void {
                foreach (['email', 'passport_number', 'national_id'] as $field) {
                    if (! empty($data[$field])) {
                        $query->orWhere($field, $data[$field]);
                    }
                }

                if (! empty($data['phone']) && ! empty($data['first_name']) && ! empty($data['last_name'])) {
                    $query->orWhere(function (Builder $query) use ($data): void {
                        $query->where('phone', $data['phone'])
                            ->where('first_name', $data['first_name'])
                            ->where('last_name', $data['last_name']);
                    });
                }
            })
            ->first();
    }
}
