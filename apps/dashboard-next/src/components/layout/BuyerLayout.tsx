import { BuyerSidebar } from './BuyerSidebar';

interface BuyerLayoutProps {
  children: React.ReactNode;
}

export function BuyerLayout({ children }: BuyerLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <BuyerSidebar />
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
