<?php

namespace Tests\Feature;

use App\Models\CashShift;
use App\Policies\CashShiftPolicy;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class CashShiftPolicyTest extends TestCase
{
    public function test_cash_shift_policy_is_registered(): void
    {
        $policy = Gate::getPolicyFor(CashShift::class);

        $this->assertNotNull($policy);
        $this->assertInstanceOf(CashShiftPolicy::class, $policy);
    }
}
