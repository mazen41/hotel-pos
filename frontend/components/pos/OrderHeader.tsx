'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ShoppingCart, User, LogOut } from 'lucide-react';

export function OrderHeader() {
  const t = useTranslations();
  const { user, logout } = useAuth();

  return (
    <header className="glass border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          {t('pos.title')}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        
        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-text-muted" />
            <span className="text-sm text-text-secondary">{user?.name}</span>
          </div>
          
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
            title={t('auth.logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}