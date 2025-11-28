/**
 * Modern Dashboard Layout
 * Complete layout system with sidebar and header
 */
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ModernSidebar } from './ModernSidebar';
import { ModernHeader } from './ModernHeader';

interface ModernDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const ModernDashboardLayout: React.FC<ModernDashboardLayoutProps> = ({
  children,
  className,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <ModernSidebar />
      
      {/* Main Content Area */}
      <div className={cn(
        'transition-all duration-300 ease-in-out',
        'lg:ml-64', // Default sidebar width
        sidebarCollapsed && 'lg:ml-16', // Collapsed sidebar width
      )}>
        {/* Header */}
        <ModernHeader sidebarCollapsed={sidebarCollapsed} />
        
        {/* Page Content */}
        <main className={cn('min-h-[calc(100vh-4rem)]', className)}>
          {children}
        </main>
      </div>
    </div>
  );
};