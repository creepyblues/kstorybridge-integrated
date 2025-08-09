/**
 * Modern Professional Dashboard Header
 * Clean, minimal header with user actions
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Search, Settings, User, HelpCircle } from 'lucide-react';

interface ModernHeaderProps {
  sidebarCollapsed?: boolean;
  className?: string;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({ 
  sidebarCollapsed = false,
  className 
}) => {
  const { user } = useAuth();

  const accountType = user?.user_metadata?.account_type || 'buyer';
  const displayTitle = accountType === 'ip_owner' ? 'Creator Dashboard' : 'Buyer Dashboard';

  return (
    <header className={cn(
      'sticky top-0 z-30 bg-white border-b border-gray-200',
      'transition-all duration-300 ease-in-out',
      // Adjust left margin based on sidebar state
      'lg:ml-64',
      sidebarCollapsed && 'lg:ml-16',
      className
    )}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Title and Search */}
        <div className="flex items-center flex-1 space-x-6">
          {/* Page Title - Hidden on mobile */}
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-gray-900">
              {displayTitle}
            </h1>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search titles, creators..."
                className={cn(
                  'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg',
                  'placeholder-gray-400 text-sm bg-gray-50',
                  'focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  'transition-colors duration-200'
                )}
              />
            </div>
          </div>
        </div>

        {/* Right Section - Actions and User */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            className={cn(
              'relative p-2 rounded-lg text-gray-400 hover:text-gray-600',
              'hover:bg-gray-100 transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
            )}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {/* Notification badge */}
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">3</span>
            </span>
          </button>

          {/* Help */}
          <button
            className={cn(
              'p-2 rounded-lg text-gray-400 hover:text-gray-600',
              'hover:bg-gray-100 transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
            )}
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Settings */}
          <button
            className={cn(
              'p-2 rounded-lg text-gray-400 hover:text-gray-600',
              'hover:bg-gray-100 transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
            )}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* User Avatar and Info */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {accountType === 'ip_owner' ? 'Creator' : 'Buyer'}
              </p>
            </div>
            
            <button
              className={cn(
                'w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center',
                'hover:bg-primary-200 transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
              )}
            >
              <User className="h-4 w-4 text-primary-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};