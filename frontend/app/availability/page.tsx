'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Calendar, Clock, Map, Home, X, Filter } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

interface AvailabilityCalendarData {
  [date: string]: any[];
}

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<AvailabilityCalendarData>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomType, setSelectedRoomType] = useState<number | null>(null);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchRoomTypes();
    fetchCalendarData();
  }, [currentDate, selectedRoomType]);

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get('/room-types');
      setRoomTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch room types:', error);
    }
  };

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      const params: any = {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      };
      
      if (selectedRoomType) {
        params.room_type_id = selectedRoomType;
      }

      const response = await api.get('/availability/calendar', { params });
      setCalendarData(response.data.calendar);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800 border-green-300',
      booked: 'bg-blue-100 text-blue-800 border-blue-300',
      blocked: 'bg-red-100 text-red-800 border-red-300',
      maintenance: 'bg-orange-100 text-orange-800 border-orange-300',
      out_of_order: 'bg-gray-100 text-gray-800 border-gray-300',
      cleaning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      check_in_day: 'bg-purple-100 text-purple-800 border-purple-300',
      check_out_day: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage room availability across all dates</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/availability/daily"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Daily View
          </a>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Previous Month
          </button>
          <span className="text-lg font-semibold px-4">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Next Month
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <select
            value={selectedRoomType || ''}
            onChange={(e) => setSelectedRoomType(e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Room Types</option>
            {roomTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
            <span className="text-sm text-gray-600">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
            <span className="text-sm text-gray-600">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
            <span className="text-sm text-gray-600">Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
            <span className="text-sm text-gray-600">Cleaning</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-gray-50 p-3 text-center font-semibold text-gray-700">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {daysInMonth.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayAvailabilities = calendarData[dateStr] || [];
            const isCurrentDay = isToday(date);

            return (
              <div
                key={dateStr}
                className={`min-h-32 p-2 bg-white ${
                  isCurrentDay ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(date, 'd')}
                  </span>
                  {isCurrentDay && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Today</span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayAvailabilities.slice(0, 5).map((availability: any) => (
                    <div
                      key={availability.id}
                      className={`text-xs px-2 py-1 rounded border ${getStatusColor(availability.status)}`}
                    >
                      <div className="font-medium truncate">
                        {availability.room?.room_number}
                      </div>
                      <div className="truncate opacity-75">
                        {getStatusLabel(availability.status)}
                      </div>
                    </div>
                  ))}
                  {dayAvailabilities.length > 5 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAvailabilities.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Home className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Days in Month</p>
              <p className="text-2xl font-bold text-gray-900">{daysInMonth.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Month</p>
              <p className="text-2xl font-bold text-gray-900">{format(currentDate, 'MMMM yyyy')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Map className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Room Types</p>
              <p className="text-2xl font-bold text-gray-900">{roomTypes.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
