<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Admins and managers can do anything with any order.
     * Cashiers can only act on orders they own.
     */
    private function isAdminOrManager(User $user): bool
    {
        return $user->hasRole(['admin', 'manager', 'super-admin']);
    }

    /**
     * Determine whether the user can view any orders.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('pos.view') || $user->can('pos.create_orders') || $this->isAdminOrManager($user);
    }

    /**
     * Determine whether the user can view the order.
     */
    public function view(User $user, Order $order): bool
    {
        if ($this->isAdminOrManager($user)) {
            return true;
        }

        return $user->can('pos.view') && $order->user_id === $user->id;
    }

    /**
     * Determine whether the user can create orders.
     */
    public function create(User $user): bool
    {
        return $user->can('pos.create_orders') || $this->isAdminOrManager($user);
    }

    /**
     * Determine whether the user can update the order (add/remove items, payments, etc.).
     */
    public function update(User $user, Order $order): bool
    {
        // Admins and managers can update any order
        if ($this->isAdminOrManager($user)) {
            return true;
        }

        // Cashiers can only update their own orders that are not yet completed/cancelled
        return ($user->can('pos.create_orders') || $user->can('pos.view'))
            && $order->user_id === $user->id
            && !in_array($order->status, ['completed', 'cancelled']);
    }

    /**
     * Determine whether the user can delete the order.
     */
    public function delete(User $user, Order $order): bool
    {
        if ($this->isAdminOrManager($user)) {
            return true;
        }

        return $user->can('pos.create_orders')
            && $order->user_id === $user->id
            && $order->status === 'pending';
    }

    /**
     * Determine whether the user can restore the order.
     */
    public function restore(User $user, Order $order): bool
    {
        return $this->isAdminOrManager($user);
    }

    /**
     * Determine whether the user can permanently delete the order.
     */
    public function forceDelete(User $user, Order $order): bool
    {
        return $this->isAdminOrManager($user);
    }
}
