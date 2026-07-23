<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class DemoMenuSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Breakfast',
                'description' => 'Morning plates and quick hotel breakfast favorites.',
                'sort_order' => 10,
                'items' => [
                    ['name' => 'Continental Breakfast', 'description' => 'Croissant, toast, jam, butter, seasonal fruit, and coffee.', 'price' => 14.00, 'cost' => 5.20, 'sort_order' => 10, 'preparation_time_minutes' => 8],
                    ['name' => 'Egyptian Foul Plate', 'description' => 'Slow-cooked fava beans with olive oil, lemon, herbs, and baladi bread.', 'price' => 9.50, 'cost' => 3.10, 'sort_order' => 20, 'preparation_time_minutes' => 7],
                    ['name' => 'Cheese Omelette', 'description' => 'Three-egg omelette with mixed cheese and breakfast potatoes.', 'price' => 11.00, 'cost' => 3.80, 'sort_order' => 30, 'preparation_time_minutes' => 10],
                    ['name' => 'Pancake Stack', 'description' => 'Three pancakes with maple syrup, berries, and whipped butter.', 'price' => 12.50, 'cost' => 4.25, 'sort_order' => 40, 'preparation_time_minutes' => 12],
                ],
            ],
            [
                'name' => 'Hot Kitchen',
                'description' => 'Freshly prepared mains for dine-in and room service.',
                'sort_order' => 20,
                'items' => [
                    ['name' => 'Grilled Chicken Plate', 'description' => 'Marinated chicken breast with rice, vegetables, and garlic sauce.', 'price' => 18.50, 'cost' => 7.25, 'sort_order' => 10, 'preparation_time_minutes' => 18],
                    ['name' => 'Beef Kofta Meal', 'description' => 'Chargrilled kofta with tahini, salad, and pita bread.', 'price' => 19.00, 'cost' => 7.80, 'sort_order' => 20, 'preparation_time_minutes' => 16],
                    ['name' => 'Penne Alfredo', 'description' => 'Penne pasta in creamy parmesan sauce with mushrooms.', 'price' => 15.75, 'cost' => 5.90, 'sort_order' => 30, 'preparation_time_minutes' => 14],
                    ['name' => 'Vegetable Curry Bowl', 'description' => 'Seasonal vegetables in mild curry sauce with steamed rice.', 'price' => 14.25, 'cost' => 4.85, 'sort_order' => 40, 'preparation_time_minutes' => 15],
                ],
            ],
            [
                'name' => 'Sandwiches',
                'description' => 'Casual cafe sandwiches and wraps.',
                'sort_order' => 30,
                'items' => [
                    ['name' => 'Club Sandwich', 'description' => 'Triple-layer chicken club with turkey, egg, lettuce, tomato, and fries.', 'price' => 16.00, 'cost' => 6.10, 'sort_order' => 10, 'preparation_time_minutes' => 12],
                    ['name' => 'Chicken Shawarma Wrap', 'description' => 'Spiced chicken, pickles, garlic sauce, and fries in saj bread.', 'price' => 10.50, 'cost' => 3.95, 'sort_order' => 20, 'preparation_time_minutes' => 9],
                    ['name' => 'Tuna Melt', 'description' => 'Tuna salad and cheddar on toasted sourdough.', 'price' => 12.00, 'cost' => 4.30, 'sort_order' => 30, 'preparation_time_minutes' => 10],
                ],
            ],
            [
                'name' => 'Beverages',
                'description' => 'Coffee, tea, fresh juices, and bottled drinks.',
                'sort_order' => 40,
                'items' => [
                    ['name' => 'Americano', 'description' => 'Fresh espresso topped with hot water.', 'price' => 4.50, 'cost' => 1.05, 'sort_order' => 10, 'preparation_time_minutes' => 3],
                    ['name' => 'Cappuccino', 'description' => 'Espresso with steamed milk and foam.', 'price' => 5.50, 'cost' => 1.45, 'sort_order' => 20, 'preparation_time_minutes' => 4],
                    ['name' => 'Fresh Orange Juice', 'description' => 'Pressed-to-order orange juice.', 'price' => 6.00, 'cost' => 2.35, 'sort_order' => 30, 'preparation_time_minutes' => 5],
                    ['name' => 'Mint Lemonade', 'description' => 'Fresh lemon, mint, sugar, and crushed ice.', 'price' => 5.75, 'cost' => 1.85, 'sort_order' => 40, 'preparation_time_minutes' => 5],
                    ['name' => 'Bottled Water', 'description' => 'Still mineral water.', 'price' => 2.00, 'cost' => 0.55, 'sort_order' => 50, 'preparation_time_minutes' => 1],
                ],
            ],
            [
                'name' => 'Desserts',
                'description' => 'Sweet cafe items for dine-in and takeaway.',
                'sort_order' => 50,
                'items' => [
                    ['name' => 'Chocolate Brownie', 'description' => 'Warm chocolate brownie with vanilla ice cream.', 'price' => 8.50, 'cost' => 2.90, 'sort_order' => 10, 'preparation_time_minutes' => 6],
                    ['name' => 'Basbousa Slice', 'description' => 'Semolina cake with syrup and pistachio.', 'price' => 5.50, 'cost' => 1.60, 'sort_order' => 20, 'preparation_time_minutes' => 2],
                    ['name' => 'Fruit Platter', 'description' => 'Seasonal sliced fruit served chilled.', 'price' => 9.00, 'cost' => 3.20, 'sort_order' => 30, 'preparation_time_minutes' => 7],
                ],
            ],
        ];

        foreach ($categories as $categoryData) {
            $items = $categoryData['items'];
            unset($categoryData['items']);

            $category = MenuCategory::updateOrCreate(
                ['name' => $categoryData['name']],
                $categoryData + ['is_active' => true],
            );

            foreach ($items as $itemData) {
                MenuItem::updateOrCreate(
                    ['name' => $itemData['name']],
                    $itemData + [
                        'menu_category_id' => $category->id,
                        'is_active' => true,
                        'track_inventory' => false,
                        'modifiers' => null,
                    ],
                );
            }
        }
    }
}
