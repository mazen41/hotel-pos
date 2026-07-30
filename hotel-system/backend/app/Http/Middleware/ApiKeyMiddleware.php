<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-API-Key');
        $expectedApiKey = config('services.pos.api_key');

        if (!$apiKey || $apiKey !== $expectedApiKey) {
            return response()->json([
                'message' => 'Invalid or missing API key.',
            ], 401);
        }

        return $next($request);
    }
}
