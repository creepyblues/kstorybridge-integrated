/**
 * Modern Professional Sidebar
 * Clean, accessible navigation for dashboard
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Heart,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X
} from 'lucide-react';

// Navigation items configuration
const getNavigationItems = (accountType: string) => {
  const commonItems = [
    {
      name: 'Dashboard',
      href: accountType === 'ip_owner' ? '/creators/dashboard' : '/buyers/dashboard',
      icon: Home,
    },
  ];

  const roleSpecificItems = accountType === 'ip_owner' 
    ? [
        { name: 'My Titles', href: '/creators/titles', icon: FileText },
        { name: 'Analytics', href: '/creators/analytics', icon: Settings },
      ]
    : [
        { name: 'Browse Titles', href: '/buyers/titles', icon: FileText },
        { name: 'Favorites', href: '/buyers/favorites', icon: Heart },
        { name: 'Requests', href: '/buyers/requests', icon: Settings },
      ];

  const settingsItems = [
    { name: 'Profile', href: accountType === 'ip_owner' ? '/creators/profile' : '/buyers/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ];

  return {
    main: [...commonItems, ...roleSpecificItems],
    settings: settingsItems,
  };
};

interface ModernSidebarProps {
  className?: string;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({ className }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const accountType = user?.user_metadata?.account_type || 'buyer';
  const displayName = user?.user_metadata?.full_name || user?.email || 'User';
  const navigation = getNavigationItems(accountType);

  const handleSignOut = async () => {
    await signOut();
  };

  // Check if link is active
  const isActiveLink = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Mobile overlay
  const MobileOverlay = () => (
    <div 
      className={cn(
        'fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden',
        'transition-opacity duration-300',
        isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={() => setIsMobileOpen(false)}
    />
  );

  // Navigation Link Component
  const NavLink = ({ item, collapsed = false }: { item: any; collapsed?: boolean }) => {
    const isActive = isActiveLink(item.href);
    const Icon = item.icon;

    return (
      <Link
        to={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          isActive 
            ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600' 
            : 'text-gray-700 hover:text-gray-900',
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? item.name : undefined}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', !collapsed && 'mr-3')} />
        {!collapsed && (
          <span className="truncate">{item.name}</span>
        )}
      </Link>
    );
  };

  // User Profile Section
  const UserProfile = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className={cn(
      'flex items-center p-3 border-t border-gray-200',
      collapsed && 'justify-center'
    )}>
      {collapsed ? (
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-primary-600" />
        </div>
      ) : (
        <>
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
            <User className="h-4 w-4 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {accountType === 'ip_owner' ? 'Creator' : 'Buyer'}
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg border"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      <MobileOverlay />

      {/* Desktop Sidebar */}
      <div className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-20',
        'transition-all duration-300 ease-in-out',
        'hidden lg:flex lg:flex-col',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}>
        {/* Logo & Collapse Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center">
              <img 
                src="/kstorybridge-logo.png" 
                alt="KStoryBridge" 
                className="h-8 w-auto"
              />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigation.main.map((item) => (
              <NavLink key={item.name} item={item} collapsed={isCollapsed} />
            ))}
          </div>

          {/* Settings Section */}
          <div className="pt-6">
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Settings
              </p>
            )}
            <div className="space-y-1">
              {navigation.settings.map((item) => (
                <NavLink key={item.name} item={item} collapsed={isCollapsed} />
              ))}
            </div>
          </div>
        </nav>

        {/* Sign Out Button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium',
              'text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-red-500/20',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className={cn('h-5 w-5 flex-shrink-0', !isCollapsed && 'mr-3')} />
            {!isCollapsed && 'Sign Out'}
          </button>
        </div>

        {/* User Profile */}
        <UserProfile collapsed={isCollapsed} />
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        'fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40',
        'lg:hidden flex flex-col',
        'transition-transform duration-300 ease-in-out',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <img 
            src="/kstorybridge-logo.png" 
            alt="KStoryBridge" 
            className="h-8 w-auto"
          />
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {navigation.main.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>

          <div className="pt-6">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Settings
            </p>
            <div className="space-y-1">
              {navigation.settings.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Mobile Sign Out */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </div>

        {/* Mobile User Profile */}
        <UserProfile />
      </div>
    </>
  );
};