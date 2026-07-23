'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { User, LogOut, ReceiptText } from 'lucide-react';
import type { Order } from '@/types';

interface OrderHeaderProps {
  order: Order | null;
  itemCount: number;
}

export function OrderHeader({ order, itemCount }: OrderHeaderProps) {
  const t = useTranslations();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-surface px-4 py-4 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white shadow-medium">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t('pos.title')}
        </h1>
        <p className="text-sm text-text-muted">
          {order ? `${order.order_number} • ${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Ready for a new order'}
        </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LanguageSwitcher />
        
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
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
      </div>
    </header>
  );
}
