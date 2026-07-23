'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { posSettingsApi } from '@/lib/api';
import type { PosSetting } from '@/types';

interface PosSettingsContextValue {
  settings: PosSetting | null;
  loading: boolean;
  error: string | null;
  reloadSettings: () => Promise<void>;
}

const PosSettingsContext = createContext<PosSettingsContextValue>({
  settings: null,
  loading: true,
  error: null,
  reloadSettings: async () => {},
});

export function PosSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PosSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await posSettingsApi.get();
      setSettings(data);
    } catch (err) {
      setError('Failed to load POS settings.');
      console.error('[PosSettings] Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  return (
    <PosSettingsContext.Provider value={{ settings, loading, error, reloadSettings }}>
      {children}
    </PosSettingsContext.Provider>
  );
}

export function usePosSettings(): PosSettingsContextValue {
  return useContext(PosSettingsContext);
}
