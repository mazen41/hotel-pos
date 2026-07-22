'use client';

import { useState, useEffect } from 'react';
import { reservationsApi, guestsApi, roomsApi, roomTypesApi, ApiError } from '@/lib/api';
import type { Guest, Room, RoomType, ReservationFormData, Reservation } from '@/types';
import GuestModal from '@/components/guests/GuestModal';

interface ReservationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  preSelectedGuestId?: number;
  preSelectedRoomId?: number;
}

export default function ReservationModal({ onClose, onSuccess, preSelectedGuestId, preSelectedRoomId }: ReservationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // Step 1: Guest Selection
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [showNewGuestModal, setShowNewGuestModal] = useState(false);
  
  // Step 2: Stay Information
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [availableRoomTypes, setAvailableRoomTypes] = useState<RoomType[]>([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
  
  // Step 3: Room Selection
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  // Step 4: Pricing
  const [pricing, setPricing] = useState({
    roomRate: 0,
    nights: 0,
    subtotal: 0,
    taxes: 0,
    fees: 0,
    totalAmount: 0,
    paidAmount: 0,
    balanceDue: 0,
  });
  
  // Step 5: Additional info
  const [specialRequests, setSpecialRequests] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [source, setSource] = useState('direct');
  const [groupId, setGroupId] = useState<number | undefined>(undefined);
  const [availableGroups, setAvailableGroups] = useState<Reservation[]>([]);

  useEffect(() => {
    if (preSelectedGuestId) {
      loadGuest(preSelectedGuestId);
    }
    if (preSelectedRoomId) {
      loadRoom(preSelectedRoomId);
    }
    loadRoomTypes();
  }, [preSelectedGuestId, preSelectedRoomId]);

  useEffect(() => {
    if (selectedRoomType) {
      updatePricing();
    }
  }, [selectedRoomType, checkInDate, checkOutDate, adults, children]);

  async function loadGuest(guestId: number) {
    try {
      const response = await guestsApi.get(guestId);
      setSelectedGuest(response.data);
    } catch (error) {
      console.error('Error loading guest:', error);
    }
  }

  async function loadRoom(roomId: number) {
    try {
      const response = await roomsApi.get(roomId);
      setSelectedRoom(response.data);
      if (response.data.room_type) {
        setSelectedRoomType(response.data.room_type);
      }
    } catch (error) {
      console.error('Error loading room:', error);
    }
  }

  async function searchGuests(term: string) {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await guestsApi.search(term);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching guests:', error);
      setSearchResults([]);
    }
  }

  useEffect(() => {
    if (guestSearchTerm.length >= 2) {
      const delay = setTimeout(() => searchGuests(guestSearchTerm), 300);
      return () => clearTimeout(delay);
    }
  }, [guestSearchTerm]);

  async function loadAvailableRooms() {
    setLoadingRooms(true);
    try {
      const response = await roomsApi.list({ 
        status: 'available',
        room_type_id: selectedRoomType?.id
      });
      setAvailableRooms(response.data);
    } catch (error) {
      console.error('Error loading available rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  }

  async function loadRoomTypes() {
    setLoadingRoomTypes(true);
    try {
      const response = await roomTypesApi.list({ active: true });
      setAvailableRoomTypes(response.data);
    } catch (error) {
      console.error('Error loading room types:', error);
    } finally {
      setLoadingRoomTypes(false);
    }
  }

  async function loadAvailableGroups() {
    try {
      const response = await reservationsApi.list({
        status: 'confirmed',
        per_page: 100
      });
      // Filter to only show reservations that can be group leaders (no group_id or group_id == id)
      const groupLeaders = response.data.filter((r: Reservation) => r.group_id === null || r.group_id === r.id);
      setAvailableGroups(groupLeaders);
    } catch (error) {
      console.error('Error loading available groups:', error);
    }
  }

  useEffect(() => {
    if (currentStep === 3) {
      loadAvailableRooms();
    }
  }, [currentStep, selectedRoomType]);

  useEffect(() => {
    if (currentStep === 5) {
      loadAvailableGroups();
    }
  }, [currentStep]);

  function updatePricing() {
    if (!selectedRoomType) return;

    const nights = checkInDate && checkOutDate 
      ? Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000))
      : 0;
    
    const roomRate = selectedRoomType.base_price || 0;
    const subtotal = roomRate * nights;
    const taxes = subtotal * 0.1; // Assuming 10% tax
    const totalAmount = subtotal + taxes;
    
    setPricing({
      roomRate,
      nights,
      subtotal,
      taxes,
      fees: 0,
      totalAmount,
      paidAmount: 0,
      balanceDue: totalAmount,
    });
  }

  async function handleSubmit() {
    if (!selectedGuest || !selectedRoom || !selectedRoomType) {
      alert('Please complete all required steps');
      return;
    }

    setSubmitting(true);
    try {
      const data: ReservationFormData = {
        group_id: groupId,
        guest_id: selectedGuest.id,
        room_id: selectedRoom.id,
        room_type_id: selectedRoomType.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        adults,
        children,
        status: 'confirmed',
        payment_status: 'unpaid',
        taxes: pricing.taxes,
        fees: pricing.fees,
        paid_amount: pricing.paidAmount,
        special_requests: specialRequests || undefined,
        internal_notes: internalNotes || undefined,
        source,
      };

      await reservationsApi.create(data);
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message || 'Failed to create reservation');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedGuest !== null;
      case 2: return checkInDate && checkOutDate && new Date(checkOutDate) > new Date(checkInDate) && selectedRoomType !== null;
      case 3: return selectedRoom !== null;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const nextStep = () => {
    if (!canProceed()) {
      switch (currentStep) {
        case 1:
          alert('Please select a guest to proceed.');
          break;
        case 2:
          if (!checkInDate || !checkOutDate) {
            alert('Please select check-in and check-out dates.');
          } else if (new Date(checkOutDate) <= new Date(checkInDate)) {
            alert('Check-out date must be after check-in date.');
          } else if (!selectedRoomType) {
            alert('Please select a room type to proceed.');
          }
          break;
        case 3:
          alert('Please select a room to proceed.');
          break;
        default:
          alert('Please complete all required steps.');
      }
      return;
    }
    setCurrentStep(Math.min(currentStep + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', padding: '0 32px' }}>
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: currentStep >= step 
              ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' 
              : 'var(--color-background)',
            border: currentStep >= step ? 'none' : '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentStep >= step ? 'white' : 'var(--color-text-muted)',
            fontSize: '14px',
            fontWeight: '600',
          }}>
            {step}
          </div>
          {step < 5 && (
            <div style={{
              flex: 1,
              height: '2px',
              background: currentStep > step 
                ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' 
                : 'var(--color-border)',
              margin: '0 12px',
            }} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--color-text-primary)' }}>
              Step 1: Select Guest
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Search Existing Guest
              </label>
              <input
                type="text"
                placeholder="Search by name, phone, email..."
                value={guestSearchTerm}
                onChange={(e) => setGuestSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'var(--color-background)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {searchResults.length > 0 && (
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                {searchResults.map((guest) => (
                  <div
                    key={guest.id}
                    onClick={() => setSelectedGuest(guest)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: selectedGuest?.id === guest.id ? 'rgba(99,102,241,0.05)' : 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = 'var(--color-background)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = selectedGuest?.id === guest.id ? 'rgba(99,102,241,0.05)' : 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>{guest.full_name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{guest.phone || guest.email || ''}</div>
                    </div>
                    {guest.vip_status && (
                      <span style={{
                        fontSize: '11px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                        color: '#92400e',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: '600',
                      }}>VIP</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', padding: '20px', background: 'var(--color-background)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Can't find the guest?</p>
              <button
                onClick={() => setShowNewGuestModal(true)}
                style={{
                  padding: '10px 20px',
                  border: '1px dashed var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'transparent',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                }}
              >
                + Create New Guest
              </button>
            </div>

            {selectedGuest && (
              <div style={{
                padding: '16px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#166534', marginBottom: '4px' }}>
                    Selected: {selectedGuest.full_name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#15803d' }}>
                    {selectedGuest.phone || selectedGuest.email || ''}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGuest(null)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #22c55e',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: 'transparent',
                    color: '#22c55e',
                    cursor: 'pointer',
                  }}
                >
                  Change
                </button>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--color-text-primary)' }}>
              Step 2: Stay Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Check-In Date
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Check-Out Date
                </label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
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
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
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
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Room Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {loadingRoomTypes ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Loading room types...
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px',
                }}>
                  {availableRoomTypes.map((roomType) => (
                    <div
                      key={roomType.id}
                      onClick={() => setSelectedRoomType(roomType)}
                      style={{
                        padding: '16px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: selectedRoomType?.id === roomType.id ? 'rgba(99,102,241,0.05)' : 'var(--color-surface)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                        {roomType.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        {roomType.description || 'No description'}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                        ${roomType.base_price ? roomType.base_price.toFixed(2) : '0.00'}/night
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-background)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Duration: <strong>{checkInDate && checkOutDate ? Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000)) : 0} night{(checkInDate && checkOutDate && Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000)) !== 1 ? 's' : '')}</strong>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Dates: <strong>{new Date(checkInDate).toLocaleDateString()}</strong> to <strong>{new Date(checkOutDate).toLocaleDateString()}</strong>
              </div>
              {selectedRoomType && (
                <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Room Type: <strong>{selectedRoomType.name}</strong> (${selectedRoomType.base_price ? selectedRoomType.base_price.toFixed(2) : '0.00'}/night)
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--color-text-primary)' }}>
              Step 3: Select Room
            </h3>
            
            {loadingRooms ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                Loading available rooms...
              </div>
            ) : availableRooms.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'var(--color-background)',
                borderRadius: '8px',
                border: '1px dashed var(--color-border)',
              }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  No available rooms for the selected dates and preferences
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px',
                maxHeight: '400px',
                overflowY: 'auto',
              }}>
                {availableRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    style={{
                      padding: '16px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedRoom?.id === room.id ? 'rgba(99,102,241,0.05)' : 'var(--color-surface)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'}
                  >
                    <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                      {room.room_number}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      {room.room_type?.name || ''}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                      ${room.room_type?.base_price ? room.room_type.base_price.toFixed(2) : '0.00'}/night
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--color-text-primary)' }}>
              Step 4: Pricing Summary
            </h3>
            
            <div style={{
              background: 'var(--color-background)',
              borderRadius: '12px',
              padding: '24px',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Room Rate</span>
                  <span style={{ fontSize: '16px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                    ${pricing.roomRate.toFixed(2)} x {pricing.nights} night{pricing.nights !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Subtotal</span>
                  <span style={{ fontSize: '16px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                    ${pricing.subtotal.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Taxes (10%)</span>
                  <span style={{ fontSize: '16px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                    ${pricing.taxes.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Fees</span>
                  <span style={{ fontSize: '16px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                    ${pricing.fees.toFixed(2)}
                  </span>
                </div>
                <div style={{ height: '1px', background: 'var(--color-border)', margin: '16px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Total Amount</span>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1' }}>
                    ${pricing.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--color-text-primary)' }}>
              Step 5: Confirmation
            </h3>
            
            <div style={{
              background: 'var(--color-background)',
              borderRadius: '12px',
              padding: '24px',
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Guest Information
                </h4>
                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  <strong>Name:</strong> {selectedGuest?.full_name}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  <strong>Contact:</strong> {selectedGuest?.phone || selectedGuest?.email || '-'}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Room & Dates
                </h4>
                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  <strong>Room:</strong> {selectedRoom?.room_number} ({selectedRoomType?.name})
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  <strong>Check-In:</strong> {new Date(checkInDate).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  <strong>Check-Out:</strong> {new Date(checkOutDate).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  <strong>Guests:</strong> {adults} adult{adults !== 1 ? 's' : ''}, {children} child{children !== 1 ? 'ren' : ''}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Pricing
                </h4>
                <div style={{ fontWeight: '700', color: '#6366f1', fontSize: '24px' }}>
                  ${pricing.totalAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                  ${pricing.roomRate.toFixed(2)} × {pricing.nights} night{pricing.nights !== 1 ? 's' : ''} + ${pricing.taxes.toFixed(2)} taxes
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Special Requests
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                  placeholder="Any special requests..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Internal Notes
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  placeholder="Internal notes (staff only)..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Add to Group (Optional)
                </label>
                <select
                  value={groupId || ''}
                  onChange={(e) => setGroupId(e.target.value ? parseInt(e.target.value) : undefined)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="">No Group</option>
                  {availableGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.reservation_number} - {group.guest?.full_name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
    }
  };

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
        maxWidth: '700px',
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
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
            New Reservation
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

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div style={{ padding: '0 24px 24px' }}>
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            style={{
              padding: '12px 24px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              background: 'var(--color-surface)',
              color: currentStep === 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Back
          </button>
          {currentStep === 5 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                color: 'white',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {submitting ? 'Creating...' : 'Create Reservation'}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                background: canProceed() ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' : 'var(--color-text-muted)',
                color: 'white',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                opacity: canProceed() ? 1 : 0.5,
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* New Guest Modal */}
      {showNewGuestModal && (
        <GuestModal
          onClose={() => setShowNewGuestModal(false)}
          onSuccess={(guest) => {
            if (guest) setSelectedGuest(guest);
            setShowNewGuestModal(false);
          }}
        />
      )}
    </div>
  );
}