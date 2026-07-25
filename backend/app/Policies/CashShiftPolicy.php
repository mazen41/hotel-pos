<?php

namespace App\Policies;

use App\Models\CashShift;
use App\Models\User;

class CashShiftPolicy
{
    private function isAdminOrManager(User $user): bool
    {
        return $user->hasRole(['Admin', 'Manager', 'Super Admin']);
    }

    public function viewAny(User $user): bool
    {
        return $user->can('pos.view') || $this->isAdminOrManager($user);
    }

    public function view(User $user, CashShift $cashShift): bool
    {
        return $this->isAdminOrManager($user) || $cashShift->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->can('pos.create_order') || $user->can('pos.view') || $this->isAdminOrManager($user);
    }

    public function update(User $user, CashShift $cashShift): bool
    {
        return $this->isAdminOrManager($user) || $cashShift->user_id === $user->id;
    }

    public function delete(User $user, CashShift $cashShift): bool
    {
        return $this->isAdminOrManager($user) || $cashShift->user_id === $user->id;
    }

    public function restore(User $user, CashShift $cashShift): bool
    {
        return $this->isAdminOrManager($user) || $cashShift->user_id === $user->id;
    }

    public function forceDelete(User $user, CashShift $cashShift): bool
    {
        return $this->isAdminOrManager($user) || $cashShift->user_id === $user->id;
    }
}
