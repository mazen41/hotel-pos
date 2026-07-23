import DashboardShell from '@/components/layout/DashboardShell';
import { PosSettingsProvider } from '@/contexts/PosSettingsContext';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <PosSettingsProvider>
      <DashboardShell defaultCollapsed={true}>
        {children}
      </DashboardShell>
    </PosSettingsProvider>
  );
}
