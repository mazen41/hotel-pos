'use client';

import { useState, useEffect } from 'react';
import { guestsApi, ApiError } from '@/lib/api';
import type { Guest, GuestFormData } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod schema for validation
const guestSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name must not exceed 100 characters'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name must not exceed 100 characters'),
  email: z.string().email('Invalid email address').max(255, 'Email must not exceed 255 characters').nullable(),
  phone: z.string().min(1, 'Phone is required').max(50, 'Phone must not exceed 50 characters'),
  country: z.string().max(100, 'Country must not exceed 100 characters').nullable(),
  city: z.string().max(100, 'City must not exceed 100 characters').nullable(),
  address: z.string().max(1000, 'Address must not exceed 1000 characters').nullable(),
  passport_number: z.string().max(100, 'Passport number must not exceed 100 characters').nullable(),
  national_id: z.string().max(100, 'National ID must not exceed 100 characters').nullable(),
  date_of_birth: z.string().nullable(),
  gender: z.string().max(20, 'Gender must not exceed 20 characters').nullable(),
  nationality: z.string().max(100, 'Nationality must not exceed 100 characters').nullable(),
  passport_expiry_date: z.string().nullable(),
  notes: z.string().max(5000, 'Notes must not exceed 5000 characters').nullable(),
  vip_status: z.boolean().optional(),
  marketing_consent: z.boolean().optional(),
});

type GuestFormValues = z.infer<typeof guestSchema>;

interface GuestModalProps {
  guest?: Guest | null;
  onClose: () => void;
  onSuccess: (guest?: Guest) => void;
}

export default function GuestModal({ guest, onClose, onSuccess }: GuestModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<Guest | null>(null);
  const [forceSave, setForceSave] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      address: '',
      passport_number: '',
      national_id: '',
      date_of_birth: '',
      gender: '',
      nationality: '',
      passport_expiry_date: '',
      notes: '',
      vip_status: false,
      marketing_consent: false,
    },
  });

  useEffect(() => {
    if (guest) {
      reset({
        first_name: guest.first_name,
        last_name: guest.last_name,
        email: guest.email || '',
        phone: guest.phone || '',
        country: guest.country || '',
        city: guest.city || '',
        address: guest.address || '',
        passport_number: guest.passport_number || '',
        national_id: guest.national_id || '',
        date_of_birth: guest.date_of_birth || '',
        gender: '',
        nationality: guest.country || '',
        passport_expiry_date: '',
        notes: guest.notes || '',
        vip_status: guest.vip_status,
        marketing_consent: guest.marketing_consent,
      });
    }
  }, [guest, reset]);

  async function onSubmit(data: GuestFormValues) {
    if (duplicateWarning && !forceSave) {
      setForceSave(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload: GuestFormData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || undefined,
        phone: data.phone,
        country: data.country || undefined,
        city: data.city || undefined,
        address: data.address || undefined,
        passport_number: data.passport_number || undefined,
        national_id: data.national_id || undefined,
        date_of_birth: data.date_of_birth || undefined,
        gender: data.gender || undefined,
        nationality: data.nationality || undefined,
        passport_expiry_date: data.passport_expiry_date || undefined,
        notes: data.notes || undefined,
        vip_status: data.vip_status,
        marketing_consent: data.marketing_consent,
      };

      let savedGuest: Guest | undefined;
      if (guest) {
        const response = await guestsApi.update(guest.id, payload);
        savedGuest = response.data;
      } else {
        const response = await guestsApi.create(payload);
        if (response.duplicate && !forceSave) {
          setDuplicateWarning(response.duplicate);
          setSubmitting(false);
          return;
        }
        savedGuest = response.data;
      }
      onSuccess(savedGuest);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Error:', error.message);
        alert(error.message || 'Failed to save guest');
      }
    } finally {
      setSubmitting(false);
    }
  }

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
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--color-border)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}>
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
            {guest ? 'Edit Guest' : 'Add New Guest'}
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

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <div style={{
            margin: '20px',
            padding: '16px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#f59e0b', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '600', color: '#b45309', marginBottom: '4px' }}>
                Possible duplicate guest found
              </p>
              <p style={{ color: '#b45309', fontSize: '14px', marginBottom: '12px' }}>
                A guest with similar details already exists: <strong>{duplicateWarning.full_name}</strong> ({duplicateWarning.phone || duplicateWarning.email})
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    window.location.href = `/dashboard/guests/${duplicateWarning.id}`;
                  }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: 'transparent',
                    color: '#b45309',
                    cursor: 'pointer',
                  }}
                >
                  View Existing Guest
                </button>
                <button
                  onClick={() => {
                    setForceSave(true);
                    setDuplicateWarning(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#f59e0b',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Continue Anyway
                </button>
                <button
                  onClick={() => setDuplicateWarning(null)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: 'transparent',
                    color: '#b45309',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* Personal Information Section */}
            <div style={{ gridColumn: 'span 2' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Personal Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    First Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    {...register('first_name')}
                    placeholder="John"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'var(--color-background)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  {errors.first_name && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Last Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    {...register('last_name')}
                    placeholder="Doe"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'var(--color-background)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  {errors.last_name && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.last_name.message}</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Date of Birth
                  </label>
                  <input
                    {...register('date_of_birth')}
                    type="date"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Gender
                  </label>
                  <select
                    {...register('gender')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'var(--color-background)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Nationality
                  </label>
                  <input
                    {...register('nationality')}
                    placeholder="American"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
            </div>

            {/* Contact Information Section */}
            <div style={{ gridColumn: 'span 2' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Contact Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Phone <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    {...register('phone')}
                    placeholder="+1 234 567 8900"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'var(--color-background)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  {errors.phone && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="john.doe@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'var(--color-background)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  {errors.email && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</p>
                  )}
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Address
                  </label>
                  <input
                    {...register('address')}
                    placeholder="123 Main Street, Apt 4B"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    City
                  </label>
                  <input
                    {...register('city')}
                    placeholder="New York"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Country
                  </label>
                  <input
                    {...register('country')}
                    placeholder="United States"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
            </div>

            {/* Identity Information Section */}
            <div style={{ gridColumn: 'span 2' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Identity Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Passport Number
                  </label>
                  <input
                    {...register('passport_number')}
                    placeholder="A12345678"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Passport Expiry Date
                  </label>
                  <input
                    {...register('passport_expiry_date')}
                    type="date"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    National ID
                  </label>
                  <input
                    {...register('national_id')}
                    placeholder="123-45-6789"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
            </div>

            {/* CRM Information Section */}
            <div style={{ gridColumn: 'span 2' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                CRM Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      {...register('vip_status')}
                      type="checkbox"
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#6366f1',
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      VIP Guest
                    </span>
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '26px', marginTop: '4px' }}>
                    Mark high-value guests with VIP status
                  </p>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      {...register('marketing_consent')}
                      type="checkbox"
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#6366f1',
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      Marketing Consent
                    </span>
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '26px', marginTop: '4px' }}>
                    Guest agrees to receive marketing communications
                  </p>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    placeholder="Special requests, preferences, or other notes..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'var(--color-background)',
                      color: 'var(--color-text-primary)',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid var(--color-border)',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '12px 24px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
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
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              }}
            >
              {submitting ? 'Saving...' : (guest ? 'Update Guest' : 'Create Guest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}