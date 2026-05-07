import { BuyerSidebar } from './BuyerSidebar';
import { useActivityBeacon } from '@/hooks/useActivityBeacon';

interface BuyerLayoutProps {
  children: React.ReactNode;
}

export function BuyerLayout({ children }: BuyerLayoutProps) {
  useActivityBeacon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-teal-50/20 to-cyan-50/30">
      <BuyerSidebar />
      <main className="md:ml-64">
        {children}
      </main>
    </div>
  );
}
