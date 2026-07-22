<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Notification — User notifications for important POS and back-office events.
 *
 * @property int         $id
 * @property int         $user_id
 * @property string      $type
 * @property string      $title
 * @property string      $message
 * @property array|null  $data
 * @property string|null $related_type
 * @property int|null    $related_id
 * @property bool        $is_read
 * @property \Illuminate\Support\Carbon|null $read_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property User        $user
 */
class Notification extends Model
{
    protected $table = 'notifications';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'related_type',
        'related_id',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'data' => 'array',
        'related_id' => 'integer',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // POS notification types
    public const TYPE_SYSTEM = 'system';
    public const TYPE_LOW_STOCK = 'low_stock';
    public const TYPE_SHIFT_CLOSED = 'shift_closed';
    public const TYPE_RETURN_CREATED = 'return_created';

    // ─── Relationships ─────────────────────────────────────────────────────────

    /**
     * Get the user that owns the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the related entity (polymorphic).
     */
    public function related(): MorphTo
    {
        return $this->morphTo();
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Scope a query to only include unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope a query to only include read notifications.
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    /**
     * Scope a query to filter by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to filter by user.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ─── Methods ───────────────────────────────────────────────────────────────

    /**
     * Mark the notification as read.
     */
    public function markAsRead(): bool
    {
        $this->is_read = true;
        $this->read_at = now();
        return $this->save();
    }

    /**
     * Mark the notification as unread.
     */
    public function markAsUnread(): bool
    {
        $this->is_read = false;
        $this->read_at = null;
        return $this->save();
    }

    /**
     * Create a notification for a user.
     */
    public static function createForUser(int $userId, string $type, string $title, string $message, array $data = null, $related = null): self
    {
        $notification = new self([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        if ($related) {
            $notification->related_type = get_class($related);
            $notification->related_id = $related->id;
        }

        $notification->save();
        return $notification;
    }
}
