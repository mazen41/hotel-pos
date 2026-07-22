'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { hotelIntegrationApi } from '@/lib/api';
import type { HotelGuest } from '@/types';
import { Search, User, MapPin, CreditCard, Check, X, AlertCircle } from 'lucide-react';

interface HotelIntegrationProps {
  onGuestSelect: (guest: HotelGuest) => void;
  chargeToFolio: (guest: HotelGuest, amount: number) => Promise<void>;
  orderTotal: number;
}

export function HotelIntegration({ onGuestSelect, chargeToFolio, orderTotal }: HotelIntegrationProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HotelGuest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<HotelGuest | null>(null);
  const [loading, setLoading] = useState(false);
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await hotelIntegrationApi.searchGuest(searchQuery);
      setSearchResults(data);
    } catch (err) {
      setError('Failed to search guests');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuest = (guest: HotelGuest) => {
    setSelectedGuest(guest);
    onGuestSelect(guest);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleChargeToFolio = async () => {
    if (!selectedGuest) return;

    setCharging(true);
    setError(null);
    try {
      await chargeToFolio(selectedGuest, orderTotal);
      setSelectedGuest(null);
    } catch (err) {
      setError('Failed to charge to folio');
      console.error('Charge error:', err);
    } finally {
      setCharging(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-text-muted" />
          <h3 className="font-display font-bold text-text-primary">
            Hotel Guest Search
          </h3>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or room number..."
            className="flex-1 px-4 py-2 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-error text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((guest) => (
              <button
                key={guest.id}
                onClick={() => handleSelectGuest(guest)}
                className="w-full flex items-center justify-between bg-surface-hover rounded-lg p-3 hover:bg-surface-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-text-primary">{guest.name}</p>
                    <p className="text-sm text-text-muted">Room {guest.room_number}</p>
                  </div>
                </div>
                <Check className="w-5 h-5 text-success" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Guest */}
      {selectedGuest && (
        <div className="glass rounded-xl p-4 border-l-4 border-success">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success bg-opacity-10 flex items-center justify-center">
                <User className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-text-primary">{selectedGuest.name}</p>
                <p className="text-sm text-text-muted">
                  Room {selectedGuest.room_number} • Folio: {selectedGuest.folio_id}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedGuest(null)}
              className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-error transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-muted">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">Charge to folio</span>
            </div>
            <button
              onClick={handleChargeToFolio}
              disabled={charging}
              className="px-4 py-2 rounded-lg bg-success text-white font-medium hover:bg-success-600 disabled:opacity-50 transition-colors"
            >
              {charging ? 'Processing...' : `Charge $${orderTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}

      {/* Integration Status */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <div className="w-2 h-2 rounded-full bg-success" />
        <span>Hotel integration active</span>
      </div>
    </div>
  );
}