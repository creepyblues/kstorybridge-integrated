
import { Link, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { useTierAccess } from "@/hooks/useTierAccess";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trackNavigationClick, trackLogoClick, trackMobileMenuToggle, trackTierBadgeClick } from "@/utils/analytics";
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
      { title: "Chat", href: "/buyers/chat" },
      { title: "Comps Navigator", href: "/buyers/comps-navigator" },
      { title: "Featured", href: "/buyers/featured" },
      { title: "Title Library", href: "/buyers/titles" },
      { title: "Saved Titles", href: "/buyers/saved" },
      { title: "K-content News", href: "/buyers/news" },
      // { title: "My Requests", href: "/buyers/requests" },
    ];
  } else {
    // Account type not determined yet - return empty array
    return [];
  }
};

const getSettingsItems = (accountType: string | null, isAdmin: boolean): MenuItem[] => {
  const baseItems = accountType === "creator"
    ? [
        { title: "Profile", href: "/creators/profile" },
        // { title: "Send msg", href: "/creators/send-message" }, // Hidden for now - needs database setup
      ]
    : accountType === "buyer"
    ? [
        // { title: "Send msg", href: "/buyers/send-message" }, // Hidden for now - needs database setup
        { title: "Profile", href: "/buyers/profile" },
        { title: "Upgrade Plan", href: "/buyers/plan" },
        ...(isAdmin ? [
          { title: "Admin", href: "/admin", badge: "admin", icon: "🔐" }
        ] : []),
      ]
    : []; // No account type determined - return empty array

  return baseItems;
};

export function CMSSidebar() {
  const { user } = useAuth();
  const { tier, loading: tierLoading } = useTierAccess();
  const { isAdmin } = useAdminAuth();
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

  // Use streamlined metadata-first account type detection
  const { accountType, loading: accountTypeLoading } = useAccountType({
    user: (displayUser as unknown as SupabaseUser | null) ?? null
  });
  const userEmail = displayUser?.email;
  const discoverItems = getDiscoverItems(accountType);
  const settingsItems = getSettingsItems(accountType, isAdmin);

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
            to={accountType === "creator" ? "/creators/home" : "/buyers/chat"}
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
            onClick={() => {
              const newState = !isMobileMenuOpen;
              setIsMobileMenuOpen(newState);
              trackMobileMenuToggle(newState ? 'open' : 'close', accountType as 'buyer' | 'creator');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
            data-track-button="true"
            data-button-id="mobile-menu-toggle-sidebar"
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
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    trackNavigationClick(item.title, item.href, 'mobile_menu', accountType as 'buyer' | 'creator');
                  }}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-base font-normal transition-colors border-b border-gray-100 last:border-b-0",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink hover:bg-gray-50"
                  )}
                  data-track-button="true"
                  data-button-id={`mobile-sidebar-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
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
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    trackNavigationClick(item.title, item.href, 'mobile_menu', accountType as 'buyer' | 'creator');
                  }}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-base font-normal transition-colors",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink hover:bg-gray-50"
                  )}
                  data-track-button="true"
                  data-button-id={`mobile-sidebar-settings-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
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
      <div className="hidden lg:block fixed left-0 top-0 w-72 bg-gray-100 h-screen z-30">
        <div className="flex flex-col h-full">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
          {/* Logo and Title Section */}
          <div className="p-4 pt-6">
            <Link
              to={accountType === "creator" ? "/creators/home" : "/buyers/chat"}
              className="flex items-center justify-center mb-6"
              onClick={() => trackLogoClick('sidebar', accountType as 'buyer' | 'creator')}
              data-track-button="true"
              data-button-id="sidebar-logo"
            >
              <img
                src="/kstorybridge-logo.png"
                alt="KStoryBridge"
                className="h-10 w-auto object-contain hover:opacity-80 transition-opacity cursor-pointer"
              />
            </Link>
          </div>

          <nav className="px-4">
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
                      onClick={() => trackNavigationClick(item.title, item.href, 'sidebar', accountType as 'buyer' | 'creator')}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-normal transition-colors",
                        isActive
                          ? "bg-hanok-teal text-white"
                          : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                      )}
                      data-track-button="true"
                      data-button-id={`sidebar-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
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

            {/* SETTINGS Section */}
            <div className="mb-6">
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
                      onClick={() => trackNavigationClick(item.title, item.href, 'sidebar', accountType as 'buyer' | 'creator')}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-normal transition-colors",
                        isActive
                          ? "bg-hanok-teal text-white"
                          : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                      )}
                      data-track-button="true"
                      data-button-id={`sidebar-settings-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
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
          </div>

          {/* User Info Section */}
          {displayUser && (
            <div className="p-4 border-t border-gray-300 bg-gray-100">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-midnight-ink-400" />
                  <span className="text-sm font-medium text-midnight-ink truncate max-w-[120px]">
                    {displayUser.user_metadata?.full_name || displayUser.email}
                  </span>
                </div>
                {/* Tier badge for buyers only */}
                {accountType === "buyer" && (
                  <div
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${tierDisplay.className}`}
                    onClick={() => trackTierBadgeClick(displayTier || 'unknown', 'sidebar', accountType as 'buyer' | 'creator')}
                    data-track-button="true"
                    data-button-id="sidebar-tier-badge"
                  >
                    {tierDisplay.label}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer - sits at absolute bottom */}
          <div className="px-4 pb-3 pt-3 border-t border-gray-300 bg-gray-100">
            <div className="text-xs text-gray-500 leading-tight mb-1">
              © 2025 KStoryBridge
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 leading-tight">
              <a
                href="https://kstorybridge.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition-colors"
              >
                Privacy
              </a>
              <span>|</span>
              <button
                onClick={() => {
                  localStorage.removeItem('kstorybridge_cookie_consent');
                  window.location.reload();
                }}
                className="hover:text-black transition-colors"
              >
                Cookie
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
