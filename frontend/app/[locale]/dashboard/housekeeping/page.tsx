'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { housekeepingApi } from '@/lib/api';
import type { HousekeepingBoard, HousekeepingTask } from '@/types';
import { Calendar, Filter, Plus, RefreshCw, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';

export default function HousekeepingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [boardData, setBoardData] = useState<HousekeepingBoard | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const locale = useLocale();
  const t = useTranslations('housekeeping');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';
  const dateLocale = isRtl ? ar : enUS;

  useEffect(() => {
    fetchBoardData();
  }, [currentDate]);

  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const response = await housekeepingApi.board(format(currentDate, 'yyyy-MM-dd'));
      
      const safeResponse: HousekeepingBoard = {
        date: response?.date || format(currentDate, 'yyyy-MM-dd'),
        board: {
          pending: Array.isArray(response?.board?.pending) ? response.board.pending : [],
          in_progress: Array.isArray(response?.board?.in_progress) ? response.board.in_progress : [],
          completed: Array.isArray(response?.board?.completed) ? response.board.completed : [],
          skipped: Array.isArray(response?.board?.skipped) ? response.board.skipped : [],
        },
        summary: {
          total: response?.summary?.total || 0,
          pending: response?.summary?.pending || 0,
          in_progress: response?.summary?.in_progress || 0,
          completed: response?.summary?.completed || 0,
          skipped: response?.summary?.skipped || 0,
        }
      };
      
      setBoardData(safeResponse);
    } catch (error) {
      console.error('Failed to fetch housekeeping board:', error);
      setBoardData({
        date: format(currentDate, 'yyyy-MM-dd'),
        board: {
          pending: [],
          in_progress: [],
          completed: [],
          skipped: [],
        },
        summary: {
          total: 0,
          pending: 0,
          in_progress: 0,
          completed: 0,
          skipped: 0,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await housekeepingApi.update(taskId, { status: newStatus as any });
      fetchBoardData();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 border-gray-300',
      medium: 'bg-blue-100 text-blue-800 border-blue-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      urgent: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
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

  const getTaskTypeIcon = (type: string) => {
    const icons = {
      cleaning: '🧹',
      inspection: '🔍',
      maintenance: '🔧',
      turnover: '🔄',
      deep_clean: '✨',
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const renderTaskCard = (task: HousekeepingTask) => (
    <div
      key={task.id}
      onClick={() => setSelectedTask(task)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
      style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}
    >
      <div className="flex items-start justify-between mb-3" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div className="flex items-center gap-2" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <span className="text-xl">{getTaskTypeIcon(task.task_type)}</span>
          <div>
            <div className="font-semibold text-gray-900">{task.room.room_number}</div>
            <div className="text-xs text-gray-500">{task.room.room_type.name}</div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <Clock className="w-4 h-4" />
          <span>{format(new Date(task.scheduled_at), 'HH:mm')}</span>
          {task.is_overdue && (
            <span className="text-red-600 font-medium">({isRtl ? 'متأخرة' : 'Overdue'})</span>
          )}
        </div>

        {task.assigned_to && (
          <div className="flex items-center gap-2 text-gray-600" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <Users className="w-4 h-4" />
            <span>{task.assigned_to.name}</span>
          </div>
        )}

        {task.duration && (
          <div className="flex items-center gap-2 text-gray-600" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <AlertCircle className="w-4 h-4" />
            <span>{task.duration} {isRtl ? 'دقيقة' : 'min'}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        {task.status === 'pending' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(task.id, 'in_progress');
            }}
            className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            {isRtl ? 'بدء' : 'Start'}
          </button>
        )}
        {task.status === 'in_progress' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(task.id, 'completed');
            }}
            className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            {isRtl ? 'إكمال' : 'Complete'}
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange(task.id, 'skipped');
          }}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
        >
          {isRtl ? 'تخطي' : 'Skip'}
        </button>
      </div>
    </div>
  );

  const renderColumn = (title: string, tasks: HousekeepingTask[] | null | undefined, icon: string, color: string) => {
    const taskArray = Array.isArray(tasks) ? tasks : [];
    
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`} style={{ marginLeft: isRtl ? '0' : 'auto', marginRight: isRtl ? 'auto' : '0' }}>
            {taskArray.length}
          </span>
        </div>
        <div className="space-y-3">
          {taskArray.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">{isRtl ? 'لا توجد مهام' : 'No tasks'}</div>
          ) : (
            taskArray.map(renderTaskCard)
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            {isRtl ? 'اليوم السابق' : 'Previous Day'}
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className={`px-4 py-2 rounded-lg text-sm ${isToday(currentDate) ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
          >
            {tCommon('today')}
          </button>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            {isRtl ? 'اليوم التالي' : 'Next Day'}
          </button>
          <span className="text-base font-semibold px-2">
            {format(currentDate, 'MMM dd, yyyy', { locale: dateLocale })}
          </span>
          <button
            onClick={fetchBoardData}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
            style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
          >
            <Plus className="w-5 h-5" />
            {t('newTask')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {boardData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <CheckCircle className="w-4 h-4" />
              <span>{t('totalTasks')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{boardData.summary.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-yellow-600 text-sm mb-1" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <Clock className="w-4 h-4" />
              <span>{t('pending')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{boardData.summary.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 text-sm mb-1" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <RefreshCw className="w-4 h-4" />
              <span>{t('inProgress')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{boardData.summary.in_progress}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-green-600 text-sm mb-1" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <CheckCircle className="w-4 h-4" />
              <span>{t('completed')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{boardData.summary.completed}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-red-600 text-sm mb-1" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <AlertCircle className="w-4 h-4" />
              <span>{t('skipped')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{boardData.summary.skipped}</div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {boardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderColumn(t('pending'), boardData.board?.pending || [], '⏳', 'bg-yellow-100 text-yellow-800')}
          {renderColumn(t('inProgress'), boardData.board?.in_progress || [], '🔄', 'bg-blue-100 text-blue-800')}
          {renderColumn(t('completed'), boardData.board?.completed || [], '✅', 'bg-green-100 text-green-800')}
          {renderColumn(t('skipped'), boardData.board?.skipped || [], '⏭️', 'bg-gray-100 text-gray-800')}
        </div>
      )}
    </div>
  );
}
