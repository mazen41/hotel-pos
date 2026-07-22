'use client';

import { useState, useEffect } from 'react';
import { maintenanceApi } from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';

interface MaintenanceRequest {
  id: number;
  room_id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  room?: {
    id: number;
    room_number: string;
    room_type?: {
      name: string;
    };
  };
  assignedTo?: {
    id: number;
    name: string;
  };
  createdBy?: {
    id: number;
    name: string;
  };
}

interface MaintenanceBoard {
  pending: MaintenanceRequest[];
  in_progress: MaintenanceRequest[];
  completed: MaintenanceRequest[];
  cancelled: MaintenanceRequest[];
}

interface MaintenanceSummary {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  urgent: number;
}

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [boardData, setBoardData] = useState<MaintenanceBoard | null>(null);
  const [summary, setSummary] = useState<MaintenanceSummary | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState({
    room_id: '',
    priority: '',
  });

  const locale = useLocale();
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchBoardData();
  }, [filter]);

  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const response = await maintenanceApi.board({
        room_id: filter.room_id ? parseInt(filter.room_id) : undefined,
        priority: filter.priority || undefined,
      });
      setBoardData(response.board);
      setSummary(response.summary);
    } catch (error) {
      console.error('Failed to fetch maintenance board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: number, action: string, data?: any) => {
    try {
      if (action === 'in_progress') {
        await maintenanceApi.markAsInProgress(requestId);
      } else if (action === 'completed') {
        await maintenanceApi.markAsCompleted(requestId, data?.resolution_notes);
      } else if (action === 'cancel') {
        await maintenanceApi.cancel(requestId);
      }
      fetchBoardData();
    } catch (error) {
      console.error('Failed to update request status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'var(--color-success-dim)',
      medium: 'var(--color-primary-dim)',
      high: 'var(--color-warning-dim)',
      urgent: 'var(--color-danger-dim)',
    };
    const textColors = {
      low: 'var(--color-success)',
      medium: 'var(--color-primary)',
      high: 'var(--color-warning)',
      urgent: 'var(--color-danger)',
    };
    return { bg: colors[priority as keyof typeof colors] || colors.medium, text: textColors[priority as keyof typeof textColors] || textColors.medium };
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return isRtl ? 'منخفضة' : 'low';
      case 'medium': return isRtl ? 'متوسطة' : 'medium';
      case 'high': return isRtl ? 'عالية' : 'high';
      case 'urgent': return isRtl ? 'عاجلة' : 'urgent';
      default: return priority;
    }
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: '⏳',
      in_progress: '🔧',
      completed: '✅',
      cancelled: '❌',
    };
    return icons[status as keyof typeof icons] || '📋';
  };

  const renderRequestCard = (request: MaintenanceRequest) => {
    const priorityColors = getPriorityColor(request.priority);

    return (
      <div
        key={request.id}
        onClick={() => setSelectedRequest(request)}
        style={{
          background: 'var(--color-bg)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          padding: '16px',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
          direction: isRtl ? 'rtl' : 'ltr',
          textAlign: isRtl ? 'right' : 'left',
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <span style={{ fontSize: '20px' }}>{getStatusIcon(request.status)}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                {request.room?.room_number ? `${isRtl ? 'غرفة' : 'Room'} ${request.room.room_number}` : `Room ${request.room_id}`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {request.room?.room_type?.name || (isRtl ? 'نوع غير محدد' : 'Unknown Type')}
              </div>
            </div>
          </div>
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '500',
            background: priorityColors.bg,
            color: priorityColors.text,
          }}>
            {getPriorityLabel(request.priority)}
          </span>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            {request.title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
            {request.description}
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          {isRtl ? 'تاريخ الإنشاء' : 'Created'}: {new Date(request.created_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
        </div>

        {request.assignedTo && (
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            {isRtl ? 'مسند إلى' : 'Assigned to'}: {request.assignedTo.name}
          </div>
        )}

        <div style={{ 
          paddingTop: '12px', 
          borderTop: '1px solid var(--color-border-light)', 
          display: 'flex', 
          gap: '8px',
          flexDirection: isRtl ? 'row-reverse' : 'row',
        }}>
          {request.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(request.id, 'in_progress');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-primary)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {isRtl ? 'بدء' : 'Start'}
            </button>
          )}
          {request.status === 'in_progress' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const notesPrompt = isRtl ? 'أضف ملاحظات الحل (اختياري):' : 'Add resolution notes (optional):';
                const notes = prompt(notesPrompt);
                handleStatusChange(request.id, 'completed', { resolution_notes: notes });
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-success)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {isRtl ? 'إكمال' : 'Complete'}
            </button>
          )}
          {(request.status === 'pending' || request.status === 'in_progress') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const confirmPrompt = isRtl ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this request?';
                if (confirm(confirmPrompt)) {
                  handleStatusChange(request.id, 'cancel');
                }
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {tCommon('cancel')}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderColumn = (title: string, requests: MaintenanceRequest[], icon: string, count: number) => (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
        </div>
        <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          background: 'var(--color-bg)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
        }}>
          {count}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            {isRtl ? 'لا توجد طلبات' : 'No requests'}
          </div>
        ) : (
          requests.map(renderRequestCard)
        )}
      </div>
    </div>
  );

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            {isRtl ? 'لوحة الصيانة' : 'Maintenance Board'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            {isRtl ? 'إدارة طلبات ومهمات الصيانة' : 'Manage maintenance requests and tasks'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--color-primary)',
            color: 'white',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          {isRtl ? '+ طلب صيانة جديد' : '+ New Request'}
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{isRtl ? 'إجمالي الطلبات' : 'Total Requests'}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-primary)' }}>{summary.total}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-warning)', marginBottom: '4px' }}>{isRtl ? 'معلقة' : 'Pending'}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-warning)' }}>{summary.pending}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-primary)', marginBottom: '4px' }}>{isRtl ? 'قيد التنفيذ' : 'In Progress'}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>{summary.in_progress}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-success)', marginBottom: '4px' }}>{isRtl ? 'مكتملة' : 'Completed'}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-success)' }}>{summary.completed}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginBottom: '4px' }}>{isRtl ? 'عاجلة' : 'Urgent'}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-danger)' }}>{summary.urgent}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
        flexDirection: isRtl ? 'row-reverse' : 'row',
      }}>
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            {isRtl ? 'الأولوية' : 'Priority'}
          </label>
          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              direction: isRtl ? 'rtl' : 'ltr',
            }}
          >
            <option value="">{isRtl ? 'جميع الأولويات' : 'All Priorities'}</option>
            <option value="low">{getPriorityLabel('low')}</option>
            <option value="medium">{getPriorityLabel('medium')}</option>
            <option value="high">{getPriorityLabel('high')}</option>
            <option value="urgent">{getPriorityLabel('urgent')}</option>
          </select>
        </div>

        <button
          onClick={() => setFilter({ room_id: '', priority: '' })}
          style={{
            marginTop: '18px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text-primary)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {tCommon('clearFilters')}
        </button>
      </div>

      {/* Board */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          {tCommon('loading')}
        </div>
      ) : boardData ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {renderColumn(isRtl ? 'معلقة' : 'Pending', boardData.pending, '⏳', boardData.pending.length)}
          {renderColumn(isRtl ? 'قيد التنفيذ' : 'In Progress', boardData.in_progress, '🔧', boardData.in_progress.length)}
          {renderColumn(isRtl ? 'مكتملة' : 'Completed', boardData.completed, '✅', boardData.completed.length)}
          {renderColumn(isRtl ? 'ملغاة' : 'Cancelled', boardData.cancelled, '❌', boardData.cancelled.length)}
        </div>
      ) : null}
    </div>
  );
}
