<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * MaintenanceRequest — Tracks maintenance issues for hotel rooms.
 *
 * @property int         $id
 * @property int         $room_id
 * @property string      $title
 * @property string      $description
 * @property string      $priority
 * @property int|null    $assigned_to
 * @property string      $status
 * @property \Illuminate\Support\Carbon|null $resolved_at
 * @property string|null $resolution_notes
 * @property int|null    $created_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property Room        $room
 * @property User|null   $assignedTo
 * @property User|null   $createdBy
 */
class MaintenanceRequest extends Model
{
    use SoftDeletes;

    public const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
    
    public const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

    protected $fillable = [
        'room_id',
        'title',
        'description',
        'priority',
        'assigned_to',
        'status',
        'resolved_at',
        'resolution_notes',
        'created_by',
    ];

    protected $casts = [
        'room_id' => 'integer',
        'assigned_to' => 'integer',
        'created_by' => 'integer',
        'resolved_at' => 'datetime',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    /**
     * Get the room that has the maintenance request.
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the user assigned to the maintenance request.
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who created the maintenance request.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Scope a query to only include pending requests.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include in-progress requests.
     */
    public function scopeInProgress(Builder $query): Builder
    {
        return $query->where('status', 'in_progress');
    }

    /**
     * Scope a query to only include completed requests.
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope a query to filter by priority.
     */
    public function scopeByPriority(Builder $query, string $priority): Builder
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope a query to filter by status.
     */
    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to filter by assigned user.
     */
    public function scopeAssignedTo(Builder $query, int $userId): Builder
    {
        return $query->where('assigned_to', $userId);
    }

    /**
     * Scope a query to filter by room.
     */
    public function scopeForRoom(Builder $query, int $roomId): Builder
    {
        return $query->where('room_id', $roomId);
    }

    // ─── Methods ───────────────────────────────────────────────────────────────

    /**
     * Mark the maintenance request as in progress.
     */
    public function markAsInProgress(): bool
    {
        $this->status = 'in_progress';
        return $this->save();
    }

    /**
     * Mark the maintenance request as completed.
     */
    public function markAsCompleted(?string $resolutionNotes = null): bool
    {
        $this->status = 'completed';
        $this->resolved_at = now();
        if ($resolutionNotes) {
            $this->resolution_notes = $resolutionNotes;
        }
        return $this->save();
    }

    /**
     * Cancel the maintenance request.
     */
    public function cancel(): bool
    {
        $this->status = 'cancelled';
        return $this->save();
    }

    /**
     * Assign the maintenance request to a user.
     */
    public function assignTo(int $userId): bool
    {
        $this->assigned_to = $userId;
        return $this->save();
    }
}
