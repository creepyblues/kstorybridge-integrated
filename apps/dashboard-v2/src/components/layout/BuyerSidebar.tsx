import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { User, Menu, X, MessageSquare, Star, BookOpen, Heart, UserCircle, CreditCard } from 'lucide-react';

interface MenuItem {
  title: string;
  href: string;
  badge?: string;
  icon: React.ReactNode;
}

// Buyer menu items (with /buyers prefix)
const getDiscoverItems = (): MenuItem[] => {
  return [
    { title: 'Chat', href: '/buyers/chat', icon: <MessageSquare className="h-4 w-4" /> },
    { title: 'Featured', href: '/buyers/featured', icon: <Star className="h-4 w-4" /> },
    { title: 'Titles', href: '/buyers/titles', icon: <BookOpen className="h-4 w-4" /> },
    { title: 'Saved', href: '/buyers/saved', icon: <Heart className="h-4 w-4" /> },
  ];
};

const getSettingsItems = (): MenuItem[] => {
  return [
    { title: 'Profile', href: '/buyers/profile', icon: <UserCircle className="h-4 w-4" /> },
    { title: 'Plan', href: '/buyers/plan', icon: <CreditCard className="h-4 w-4" /> },
  ];
};

export function BuyerSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userEmail = user?.email;
  const discoverItems = getDiscoverItems();
  const settingsItems = getSettingsItems();

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={handleMobileMenuToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-900" />
        ) : (
          <Menu className="h-6 w-6 text-gray-900" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link
              to="/buyers/chat"
              className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              KStoryBridge
            </Link>
            <p className="text-sm text-gray-500 mt-1">Buyer Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {/* Discover section */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Discover
              </h3>
              <ul className="space-y-1">
                {discoverItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        location.pathname === item.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Settings section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Settings
              </h3>
              <ul className="space-y-1">
                {settingsItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        location.pathname === item.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-600">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.user_metadata?.full_name || 'Buyer'}
                </p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
