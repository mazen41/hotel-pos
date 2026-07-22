'use client';

import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { OrderHeader } from '@/components/pos/OrderHeader';

export default function POSPage() {
  const t = useTranslations();
  const { can } = usePermissions();

  if (!can('pos.view')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">{t('errors.noPermission')}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-116px)] bg-background rounded-xl overflow-hidden border border-border">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <OrderHeader />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <MenuGrid />
          </div>
          
          {/* Cart Panel */}
          <CartPanel />
        </div>
      </div>
    </div>
  );
}