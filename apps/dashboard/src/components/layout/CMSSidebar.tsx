
import { Link, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/utils/simpleAccountTypeService";
import { useTierAccess } from "@/hooks/useTierAccess";
import { User, Menu, X } from "lucide-react";
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface MenuItem {
  title: string;
  href: string;
  badge?: string;
  icon?: string;
}

const getDiscoverItems = (accountType: string | null): MenuItem[] => {
  if (accountType === "creator") {
    return [
      { title: "Home", href: "/creators/home" },
      { title: "My Titles", href: "/creators/titles" },
      { title: "K-content News", href: "/creators/news" },
      // { title: "My Requests", href: "/creators/requests" },
    ];
  } else if (accountType === "buyer") {
    return [
      { title: "Home", href: "/buyers/home" },
      { title: "Titles", href: "/buyers/titles" },
      { title: "Favorites", href: "/buyers/favorites" },
      { title: "Chat with AI", href: "/buyers/chat", badge: "beta" },
      { title: "K-content News", href: "/buyers/news" },
      // { title: "My Requests", href: "/buyers/requests" },
    ];
  } else {
    // Account type not determined yet - return empty array
    return [];
  }
};

const getSettingsItems = (accountType: string | null, userEmail?: string): MenuItem[] => {
  const isAdmin = userEmail === 'sungho@dadble.com' || userEmail === 'kevin@sandstoneartists.com';

  const baseItems = accountType === "creator"
    ? [
        { title: "Profile", href: "/creators/profile" },
        // { title: "Send msg", href: "/creators/send-message" }, // Hidden for now - needs database setup
      ]
    : accountType === "buyer"
    ? [
        // { title: "Send msg", href: "/buyers/send-message" }, // Hidden for now - needs database setup
        { title: "Profile", href: "/buyers/profile" },
        ...(isAdmin ? [{ title: "Upgrade Plan", href: "/buyers/plan" }] : []),
      ]
    : []; // No account type determined - return empty array
  
  // Add admin pages for admin users right after Profile
  if (isAdmin) {
    const profileIndex = baseItems.findIndex(item => item.title === 'Profile');
    baseItems.splice(profileIndex + 1, 0, 
      {
        title: "Experiment",
        href: "/experiment",
        badge: "admin",
        icon: "⚡"
      },
      {
        title: "OpenAI Testing",
        href: "/openai-chatbot-testing",
        badge: "admin",
        icon: "🧪"
      }
    );
  }
  
  return baseItems;
};

export function CMSSidebar() {
  const { user } = useAuth();
  const { tier, loading: tierLoading } = useTierAccess();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Localhost development configuration (similar to header)
  const isLocalhost = window.location.hostname === 'localhost';
  const useRealDataOnLocalhost = true;

  const mockUser = {
    id: 'mock-user-12345',
    email: 'demo@kstorybridge.com',
    user_metadata: {
      full_name: 'Demo User',
      account_type: 'buyer'
    }
  };

  const mockTier = 'basic';
  const displayUser = (isLocalhost && !useRealDataOnLocalhost) ? mockUser : user;
  const displayTier = (isLocalhost && !useRealDataOnLocalhost) ? mockTier : tier;
  const displayTierLoading = (isLocalhost && !useRealDataOnLocalhost) ? false : tierLoading;

  // Memoize the options object to prevent unnecessary re-renders
  const accountTypeOptions = useMemo(() => ({
    includeDatabaseLookup: true,
    debug: false,
    user: (displayUser as unknown as SupabaseUser | null) ?? null
  }), [displayUser?.id, displayUser?.user_metadata?.account_type]);

  // Use centralized account type detection with database lookup for accuracy
  const { accountType: detectedAccountType, loading: accountTypeLoading } = useAccountType(accountTypeOptions);

  // Use detected account type, no fallback since users should have proper account type in authenticated areas
  const accountType = detectedAccountType;
  const userEmail = displayUser?.email;
  const discoverItems = getDiscoverItems(accountType);
  const settingsItems = getSettingsItems(accountType, userEmail);

  // Get tier display info for buyers
  const getTierDisplay = (tier: string | null) => {
    if (displayTierLoading) {
      return { label: 'Loading...', className: 'bg-gray-100 text-gray-600' };
    }

    switch (tier) {
      case 'basic':
        return { label: 'Basic', className: 'bg-blue-100 text-blue-800' };
      case 'pro':
        return { label: 'Pro', className: 'bg-purple-100 text-purple-800' };
      case 'suite':
        return { label: 'Suite', className: 'bg-gradient-to-r from-hanok-teal-100 to-hanok-teal-200 text-hanok-teal-800' };
      default:
        return { label: 'Unknown', className: 'bg-gray-100 text-gray-600' };
    }
  };

  const tierDisplay = getTierDisplay(displayTier);
  const displayTitle = accountType === "creator" ? "Creator Dashboard" : "Buyer Dashboard";

  // Show loading state while detecting account type
  if (accountTypeLoading) {
    return (
      <div className="hidden lg:block fixed left-0 top-0 w-72 bg-gray-100 h-screen flex flex-col z-30">
        {/* Logo and Title Section during loading */}
        <div className="p-4 pt-6">
          <div className="flex justify-center mb-6">
            <img
              src="/kstorybridge-logo.png"
              alt="KStoryBridge"
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>

        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hanok-teal"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Header with Logo and Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gray-100 shadow-sm border-b border-gray-300 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo on the left */}
          <Link
            to={accountType === "creator" ? "/creators/home" : "/buyers/home"}
            className="flex items-center"
          >
            <img
              src="/kstorybridge-logo.png"
              alt="KStoryBridge"
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Menu button on the right */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed left-4 right-4 top-[60px] bg-white rounded-2xl shadow-xl border border-gray-300 z-50 overflow-hidden">
          <div className="py-2">
            {/* Discover items */}
            {discoverItems.map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-base font-normal transition-colors border-b border-gray-100 last:border-b-0",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink hover:bg-gray-50"
                  )}
                >
                  <span>{item.title}</span>
                  {item.badge && (
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full uppercase tracking-wider"
                      style={{ backgroundColor: '#FF6B6B' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Separator */}
            <div className="border-t border-gray-300 my-1"></div>

            {/* Settings items */}
            {settingsItems.map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-base font-normal transition-colors",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink hover:bg-gray-50"
                  )}
                >
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-500 text-white rounded-full uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block fixed left-0 top-0 w-72 bg-gray-100 h-screen flex flex-col z-30">
      {/* Logo and Title Section */}
      <div className="p-4 pt-6">
        <Link
          to={accountType === "creator" ? "/creators/home" : "/buyers/home"}
          className="flex items-center justify-center mb-6"
        >
          <img
            src="/kstorybridge-logo.png"
            alt="KStoryBridge"
            className="h-10 w-auto object-contain hover:opacity-80 transition-opacity cursor-pointer"
          />
        </Link>
      </div>

      <nav className="px-4 flex-1">
        {/* DISCOVER Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-midnight-ink-400 uppercase tracking-wider mb-3 px-3">
            DISCOVER
          </h3>
          <div className="space-y-2">
            {discoverItems.map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-normal transition-colors",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <span className="text-base">{item.icon}</span>}
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "px-2.5 py-0.5 text-xs font-semibold rounded-full",
                        item.badge === 'admin'
                          ? "bg-purple-500 text-white"
                          : item.badge === 'beta'
                          ? "text-white"
                          : "bg-red-500 text-white"
                      )}
                      style={item.badge === 'beta' ? { backgroundColor: '#FF6B6B' } : undefined}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* SETTINGS Section */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-midnight-ink-400 uppercase tracking-wider mb-3 px-3">
          SETTINGS
        </h3>
        <div className="space-y-2">
          {settingsItems.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-normal transition-colors",
                  isActive
                    ? "bg-hanok-teal text-white"
                    : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "px-2.5 py-0.5 text-xs font-semibold rounded-full",
                      item.badge === 'admin'
                        ? "bg-purple-500 text-white"
                        : item.badge === 'beta'
                        ? "text-white"
                        : "bg-red-500 text-white"
                    )}
                    style={item.badge === 'beta' ? { backgroundColor: '#FF6B6B' } : undefined}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Info Section - Fixed at Bottom */}
      {displayUser && (
        <div className="p-4 border-t border-gray-300 mt-auto">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-midnight-ink-400" />
              <span className="text-sm font-medium text-midnight-ink truncate max-w-[120px]">
                {displayUser.user_metadata?.full_name || displayUser.email}
              </span>
            </div>
            {/* Tier badge for buyers only */}
            {accountType === "buyer" && (
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${tierDisplay.className}`}>
                {tierDisplay.label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
