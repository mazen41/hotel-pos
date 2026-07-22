import DashboardShell from '@/components/layout/DashboardShell';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
