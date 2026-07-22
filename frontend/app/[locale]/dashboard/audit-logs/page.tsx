'use client';

import { useState, useEffect } from 'react';
import { auditLogsApi } from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';

interface ActivityLog {
  id: number;
  log_name: string | null;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  causer_type: string | null;
  causer_id: number | null;
  properties: any;
  old_values: any;
  new_values: any;
  created_at: string;
  causer?: {
    id: number;
    name: string;
    email: string;
  };
  subject?: any;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    subject_type: '',
    date_from: '',
    date_to: '',
  });
  
  const locale = useLocale();
  const t = useTranslations('auditLogs');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      const response = await auditLogsApi.list({
        subject_type: filter.subject_type || undefined,
        date_from: filter.date_from || undefined,
        date_to: filter.date_to || undefined,
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectTypeLabel = (type: string | null) => {
    if (!type) return t('na');
    const simpleType = type.split('\\').pop();
    switch (simpleType) {
      case 'Guest': return t('guest');
      case 'Reservation': return t('reservation');
      case 'RatePlan': return t('ratePlan');
      case 'User': return t('user');
      default: return simpleType;
    }
  };

  const getActionLabel = (description: string) => {
    if (description.includes('created')) return t('created');
    if (description.includes('updated')) return t('updated');
    if (description.includes('deleted')) return t('deleted');
    return description;
  };

  const getActionColor = (description: string) => {
    if (description.includes('created')) return 'var(--color-success)';
    if (description.includes('updated')) return 'var(--color-primary)';
    if (description.includes('deleted')) return 'var(--color-danger)';
    return 'var(--color-text-muted)';
  };

  return (
    <div style={{ padding: '24px', direction: isRtl ? 'rtl' : 'ltr' }}>
      <div style={{ marginBottom: '24px', textAlign: isRtl ? 'right' : 'left' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
          {t('description')}
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        flexDirection: isRtl ? 'row-reverse' : 'row',
      }}>
        <div style={{ flex: 1, minWidth: '200px', textAlign: isRtl ? 'right' : 'left' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            {t('subjectType')}
          </label>
          <select
            value={filter.subject_type}
            onChange={(e) => setFilter({ ...filter, subject_type: e.target.value })}
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
            <option value="">{t('allTypes')}</option>
            <option value="App\\Models\\Guest">{t('guest')}</option>
            <option value="App\\Models\\Reservation">{t('reservation')}</option>
            <option value="App\\Models\\RatePlan">{t('ratePlan')}</option>
            <option value="App\\Models\\User">{t('user')}</option>
          </select>
        </div>

        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            {t('fromDate')}
          </label>
          <input
            type="date"
            value={filter.date_from}
            onChange={(e) => setFilter({ ...filter, date_from: e.target.value })}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
            }}
          />
        </div>

        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            {t('toDate')}
          </label>
          <input
            type="date"
            value={filter.date_to}
            onChange={(e) => setFilter({ ...filter, date_to: e.target.value })}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
            }}
          />
        </div>

        <button
          onClick={() => setFilter({ subject_type: '', date_from: '', date_to: '' })}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text-primary)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {t('clearFilters')}
        </button>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          {tCommon('loading')}
        </div>
      ) : logs.length === 0 ? (
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}>
          {t('noLogs')}
        </div>
      ) : (
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-sidebar)',
              }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textAlign: isRtl ? 'right' : 'left' }}>
                  {t('date')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textAlign: isRtl ? 'right' : 'left' }}>
                  {t('user')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textAlign: isRtl ? 'right' : 'left' }}>
                  {t('action')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textAlign: isRtl ? 'right' : 'left' }}>
                  {t('subjectType')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textAlign: isRtl ? 'right' : 'left' }}>
                  {t('descriptionTable')}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid var(--color-border-light)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    {new Date(log.created_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    {log.causer?.name || t('system')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: getActionColor(log.description),
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: `${getActionColor(log.description)}15`,
                    }}>
                      {getActionLabel(log.description)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    {getSubjectTypeLabel(log.subject_type)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
