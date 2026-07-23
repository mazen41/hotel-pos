<?php

namespace App\Providers;

use App\Models\MenuCategory;
use App\Models\Order;
use App\Policies\MenuCategoryPolicy;
use App\Policies\OrderPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register model policies
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(MenuCategory::class, MenuCategoryPolicy::class);
    }
}
