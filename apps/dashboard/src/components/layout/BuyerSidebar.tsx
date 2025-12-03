import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { User, Menu, X, Home, MessageSquare, Compass, Sparkles, Star, BookOpen, Heart, CreditCard, Settings, FileText, Wand2, FileSearch, TrendingUp } from 'lucide-react';

interface MenuItem {
  title: string;
  href: string;
  badge?: string;
  icon: React.ReactNode;
}

// Buyer menu items (with /buyers prefix)
const getDiscoverItems = (): MenuItem[] => {
  return [
    { title: 'Home', href: '/buyers/home', icon: <Home className="h-5 w-5" /> },
    { title: 'Chat', href: '/buyers/chat', icon: <MessageSquare className="h-5 w-5" /> },
    { title: 'Comps Navigator', href: '/buyers/comps-navigator', icon: <Compass className="h-5 w-5" /> },
    { title: 'Mandate Matcher', href: '/buyers/mandates', icon: <Sparkles className="h-5 w-5" /> },
    { title: 'Trending', href: '/buyers/trending', icon: <TrendingUp className="h-5 w-5" /> },
    { title: 'Titles', href: '/buyers/titles', icon: <BookOpen className="h-5 w-5" /> },
    { title: 'Saved', href: '/buyers/saved', icon: <Heart className="h-5 w-5" /> },
    { title: 'Plan', href: '/buyers/plan', icon: <CreditCard className="h-5 w-5" /> },
  ];
};

// Admin menu items (with /admin prefix)
const getAdminItems = (): MenuItem[] => {
  return [
    { title: 'Featured', href: '/admin/featured', icon: <Star className="h-5 w-5" /> },
    { title: 'Titles', href: '/admin/titles', icon: <Settings className="h-5 w-5" /> },
    { title: 'Content', href: '/admin/content', icon: <FileText className="h-5 w-5" /> },
    { title: 'Drafts', href: '/admin/drafts', icon: <FileText className="h-5 w-5" /> },
    { title: 'Asset Generation', href: '/admin/asset-generation', icon: <Wand2 className="h-5 w-5" /> },
    { title: 'Pitch Extractor', href: '/admin/pitch-extractor', icon: <FileSearch className="h-5 w-5" /> },
  ];
};

export function BuyerSidebar() {
  const { user } = useAuth();
  const { isAdmin } = useAdminAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userEmail = user?.email;
  const discoverItems = getDiscoverItems();
  const adminItems = getAdminItems();

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
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-red-200 shadow-lg"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-hanok-teal">
              KStoryBridge
            </h1>
            <p className="text-xs text-gray-500 mt-1">Dashboard for Producers</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {/* Discover section */}
            <div>
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
                        'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                        location.pathname === item.href
                          ? 'bg-hanok-teal/10 text-hanok-teal shadow-sm border border-hanok-teal/20'
                          : 'text-gray-700 hover:bg-hanok-teal/5'
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

            {/* Admin section - only visible for admins */}
            {isAdmin && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                  Admin
                </h3>
                <ul className="space-y-1">
                  {adminItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                          location.pathname === item.href
                            ? 'bg-hanok-teal/10 text-hanok-teal shadow-sm border border-hanok-teal/20'
                            : 'text-gray-700 hover:bg-hanok-teal/5'
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
            )}
          </nav>

          {/* User info - clickable profile link */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/buyers/profile"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-hanok-teal/5 transition-colors"
            >
              <User className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.user_metadata?.full_name || 'Buyer'}
                </p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
