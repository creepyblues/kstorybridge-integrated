
import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTierAccess } from "@/hooks/useTierAccess";
import { useAccountType } from "@/hooks/useAccountType";
import { trackNavigationClick, trackLogoClick, trackMobileMenuToggle, trackTierBadgeClick } from "@/utils/analytics";
import { User, Menu, X } from "lucide-react";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { cn } from "@/lib/utils";

const getDiscoverItems = (accountType: string) => {
  if (accountType === "creator") {
    return [
      { title: "Home", href: "/home" },
      { title: "My Titles", href: "/titles" },
      { title: "News", href: "/news" },
    ];
  } else {
    return [
      { title: "Chat", href: "/buyers/chat" },
      { title: "Featured", href: "/buyers/featured" },
      { title: "Title Library", href: "/buyers/titles" },
      { title: "Saved Titles", href: "/buyers/saved" },
      { title: "News", href: "/buyers/news" },
    ];
  }
};

const getSettingsItems = (accountType: string, userEmail?: string) => {
  const isAuthorizedForChatbot = userEmail === 'sungho@dadble.com' || userEmail === 'kevin@sandstoneartists.com';
  
  const baseItems = accountType === "creator"
    ? [
        { title: "Profile", href: "/profile" },
      ]
    : [
        { title: "Profile", href: "/buyers/profile" },
      ];

  // Add chatbot items for authorized users right after Profile
  if (isAuthorizedForChatbot) {
    const profileIndex = baseItems.findIndex(item => item.title === 'Profile');
    const chatbotItems = accountType === "creator"
      ? [
          { title: "Chat", href: "/chat", badge: "experiment" },
        ]
      : [
          { title: "Chat", href: "/buyers/chat", badge: "experiment" },
        ];

    baseItems.splice(profileIndex + 1, 0, ...chatbotItems);
  }
  
  return baseItems;
};

export function CMSHeader() {
  const { user } = useAuth();
  const { tier, loading: tierLoading } = useTierAccess();

  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Localhost development configuration
  const isLocalhost = window.location.hostname === 'localhost';

  // 🧪 LOCALHOST CONFIG: Control data source for development
  // Set to true to use real Supabase data, false for mock data
  // NOTE: Should match the setting in useTierAccess.ts
  const useRealDataOnLocalhost = true; // Now using real data for localhost testing

  const mockUser = {
    id: 'mock-user-12345',
    email: 'demo@kstorybridge.com',
    user_metadata: {
      full_name: 'Demo User',
      account_type: 'buyer' // Fixed mock account type
    }
  };

  // 🧪 MOCK TESTING: Change this value when using mock data
  // Options: 'basic', 'pro', 'suite'
  // NOTE: Should match the mockTier in useTierAccess.ts
  const mockTier = 'basic';

  // Use mock data on localhost (unless real data is enabled), real data otherwise
  const displayUser = (isLocalhost && !useRealDataOnLocalhost) ? mockUser : user;
  const displayTier = (isLocalhost && !useRealDataOnLocalhost) ? mockTier : tier;
  const displayTierLoading = (isLocalhost && !useRealDataOnLocalhost) ? false : tierLoading;

  // Use streamlined metadata-first account type detection
  const { accountType: detectedAccountType, loading: accountTypeLoading } = useAccountType({
    user: (displayUser as unknown as SupabaseUser | null) ?? null
  });

  // Get account type for display with fallback
  const accountType = detectedAccountType || "buyer";
  const displayTitle = accountType === "creator" ? "Creator Dashboard" : "Buyer Dashboard";
  const userEmail = displayUser?.email;
  
  // Get menu items
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full bg-gray-50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => {
                const newState = !isMobileMenuOpen;
                setIsMobileMenuOpen(newState);
                trackMobileMenuToggle(newState ? 'open' : 'close', accountType as 'buyer' | 'creator');
              }}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
              data-track-button="true"
              data-button-id="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <Link
              to={accountType === "creator" ? "/home" : "/buyers/chat"}
              className="flex items-center"
              onClick={() => trackLogoClick('header', accountType as 'buyer' | 'creator')}
              data-track-button="true"
              data-button-id="header-logo"
            >
              <img
                src="/kstorybridge-logo.png"
                alt="KStoryBridge"
                className="h-8 sm:h-10 lg:h-12 w-auto object-contain hover:opacity-80 transition-opacity cursor-pointer"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            {/* Dashboard title - hide on mobile to save space */}
            <h1 className="hidden md:block text-lg sm:text-xl lg:text-2xl font-semibold text-slate-700 tracking-wide">
              {displayTitle}
            </h1>

            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {displayUser && (
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-midnight-ink-400" />
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* User info - name only */}
                    <div className="flex flex-col">
                      <span className="text-midnight-ink font-medium max-w-[100px] sm:max-w-none truncate">
                        {displayUser.user_metadata?.full_name || displayUser.email}
                      </span>
                    </div>
                    {/* Status badge - tier for buyers only */}
                    {accountType === "buyer" && (
                      <div
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit cursor-pointer hover:opacity-80 transition-opacity ${tierDisplay.className}`}
                        onClick={() => trackTierBadgeClick(displayTier || 'unknown', 'header', accountType as 'buyer' | 'creator')}
                        data-track-button="true"
                        data-button-id="header-tier-badge"
                      >
                        {tierDisplay.label}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Simple Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed left-3 right-3 top-[80px] bg-white rounded-2xl shadow-xl border border-gray-300 z-40 overflow-hidden">
          <div className="py-2">
            {/* All menu items in a simple list */}
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
                    "flex items-center justify-between px-4 py-3 text-base font-medium transition-colors border-b border-gray-100 last:border-b-0",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink hover:bg-gray-50"
                  )}
                  data-track-button="true"
                  data-button-id={`mobile-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span>{item.title}</span>
                  {item.badge && (
                    <span
                      className="px-2.5 py-0.5 text-xs font-semibold text-white rounded-full"
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
                    "flex items-center justify-between px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink hover:bg-gray-50"
                  )}
                  data-track-button="true"
                  data-button-id={`mobile-settings-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
