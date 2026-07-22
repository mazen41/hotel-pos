'use client';

import { useState, useEffect } from 'react';
import { roomsApi, roomTypesApi } from '@/lib/api';
import type { Room, RoomType } from '@/types';

interface AvailabilityPanelProps {
  onClose: () => void;
  onSelectRoom: (roomId: number) => void;
}

export default function AvailabilityPanel({ onClose, onSelectRoom }: AvailabilityPanelProps) {
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<number | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, [checkInDate, checkOutDate, selectedRoomType]);

  async function fetchAvailability() {
    setLoading(true);
    try {
      const [roomsResponse, roomTypesResponse] = await Promise.all([
        roomsApi.list({ status: 'available', room_type_id: selectedRoomType || undefined }),
        roomTypesApi.list({ active: true })
      ]);
      setRooms(roomsResponse.data);
      setRoomTypes(roomTypesResponse.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  }

  const nights = checkInDate && checkOutDate 
    ? Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000))
    : 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '16px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--color-border)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'var(--color-surface)',
          zIndex: 10,
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
            📅 Availability Checker
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '8px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Search Parameters */}
          <div style={{
            background: 'var(--color-background)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Check-In Date
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Check-Out Date
                </label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Adults
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Children
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={children}
                  onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-surface)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                <strong>{nights}</strong> night{nights !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {new Date(checkInDate).toLocaleDateString()} - {new Date(checkOutDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Room Type Filter */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Filter by Room Type
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedRoomType(null)}
                style={{
                  padding: '8px 16px',
                  border: selectedRoomType === null ? '1px solid #6366f1' : '1px solid var(--color-border)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  background: selectedRoomType === null ? '#6366f1' : 'var(--color-surface)',
                  color: selectedRoomType === null ? 'white' : 'var(--color-text-primary)',
                  cursor: 'pointer',
                }}
              >
                All Types
              </button>
              {roomTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedRoomType(type.id)}
                  style={{
                    padding: '8px 16px',
                    border: selectedRoomType === type.id ? '1px solid #6366f1' : '1px solid var(--color-border)',
                    borderRadius: '20px',
                    fontSize: '13px',
                    background: selectedRoomType === type.id ? '#6366f1' : 'var(--color-surface)',
                    color: selectedRoomType === type.id ? 'white' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Available Rooms */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '16px' }}>
              Available Rooms
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: '400', marginLeft: '8px' }}>
                ({rooms.length} available)
              </span>
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                Checking availability...
              </div>
            ) : rooms.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'var(--color-background)',
                borderRadius: '8px',
                border: '1px dashed var(--color-border)',
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 4v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  No available rooms for the selected dates
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px',
              }}>
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => onSelectRoom(room.id)}
                    style={{
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 16px rgba(99,102,241,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '700',
                      }}>
                        {room.room_number}
                      </div>
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        color: '#22c55e',
                        fontWeight: '600',
                      }}>
                        Available
                      </span>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        Room Type
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                        {room.room_type?.name || '-'}
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        Floor
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        {room.floor || '-'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        Price per Night
                      </div>
                      <div style={{ fontSize: '16px', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                        ${room.room_type?.base_price ? room.room_type.base_price.toFixed(2) : '0.00'}
                      </div>
                    </div>

                    <button
                      style={{
                        width: '100%',
                        marginTop: '16px',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      Select Room
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}