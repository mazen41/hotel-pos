<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class HousekeepingTask extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'room_id',
        'assigned_to',
        'task_type',
        'priority',
        'status',
        'scheduled_at',
        'started_at',
        'completed_at',
        'notes',
        'checklist',
        'created_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'checklist' => 'array',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeByDate($query, $date)
    {
        return $query->whereDate('scheduled_at', $date);
    }

    public function scopeForToday($query)
    {
        return $query->whereDate('scheduled_at', Carbon::today());
    }

    public function scopeOverdue($query)
    {
        return $query->where('scheduled_at', '<', Carbon::now())
                    ->where('status', '!=', 'completed');
    }

    public function getDurationAttribute()
    {
        if ($this->started_at && $this->completed_at) {
            return $this->started_at->diffInMinutes($this->completed_at);
        }
        if ($this->started_at) {
            return $this->started_at->diffInMinutes(Carbon::now());
        }
        return null;
    }

    public function getIsOverdueAttribute()
    {
        return $this->scheduled_at->isPast() && $this->status !== 'completed';
    }
}