<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuCategory extends Model
{
    use \Spatie\Permission\Traits\HasRoles;
    protected $fillable = [
        'name',
        'description',
        'sort_order',
        'is_active',
        'image_url',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class)->orderBy('sort_order');
    }

    public function activeMenuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class)->where('is_active', true)->orderBy('sort_order');
    }
}
