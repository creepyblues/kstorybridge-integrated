import { ReactNode } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Fixed Header */}
      <AdminHeader />
      
      {/* Content area with sidebar - account for fixed header */}
      <div className="flex pt-[73px]">
        <AdminSidebar />
        <main className="flex-1 overflow-auto bg-gray-50 lg:ml-64 ml-0">
          <div className="max-w-none mx-auto py-8 px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}