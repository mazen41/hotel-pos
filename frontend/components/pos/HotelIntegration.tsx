'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { hotelIntegrationApi } from '@/lib/api';
import type { HotelGuest } from '@/types';
import { formatCurrency } from '@/lib/money';
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

  // Debounced search function
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await hotelIntegrationApi.searchGuest(query);
      setSearchResults(data);
    } catch (err) {
      setError('Failed to search guests');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

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
      setError(err instanceof Error ? err.message : 'Failed to charge to folio');
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

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by guest name..."
            className="w-full px-4 py-2 pl-10 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
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
              {charging ? 'Processing...' : `Charge ${formatCurrency(orderTotal)}`}
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