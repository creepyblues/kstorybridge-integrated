
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTierAccess } from "@/hooks/useTierAccess";
import { User, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const getDiscoverItems = (accountType: string) => {
  if (accountType === "ip_owner") {
    return [
      { title: "Titles", href: "/creators/titles" },
    ];
  } else {
    return [
      { title: "Titles", href: "/buyers/titles" },
      { title: "Favorites", href: "/buyers/favorites" },
    ];
  }
};

const getSettingsItems = (accountType: string) => {
  if (accountType === "ip_owner") {
    return [
      { title: "Profile", href: "/creators/profile" },
    ];
  } else {
    return [
      { title: "Profile", href: "/buyers/profile" },
    ];
  }
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
  const useRealDataOnLocalhost = false; // Change this to true for real data testing

  const mockUser = {
    id: 'mock-user-12345',
    email: 'demo@kstorybridge.com',
    user_metadata: {
      full_name: 'Demo User',
      account_type: user?.user_metadata?.account_type || 'buyer' // Use real account type if available
    }
  };

  // 🧪 MOCK TESTING: Change this value when using mock data
  // Options: 'invited', 'basic', 'pro', 'suite'
  // NOTE: Should match the mockTier in useTierAccess.ts
  const mockTier = 'basic';

  // Use mock data on localhost (unless real data is enabled), real data otherwise
  const displayUser = (isLocalhost && !useRealDataOnLocalhost) ? mockUser : user;
  const displayTier = (isLocalhost && !useRealDataOnLocalhost) ? mockTier : tier;
  const displayTierLoading = (isLocalhost && !useRealDataOnLocalhost) ? false : tierLoading;

  // Get account type for display
  const accountType = displayUser?.user_metadata?.account_type || "buyer";
  const displayTitle = accountType === "ip_owner" ? "Creator Dashboard" : "Buyer Dashboard";
  
  // Get menu items
  const discoverItems = getDiscoverItems(accountType);
  const settingsItems = getSettingsItems(accountType);

  // Get tier display info
  const getTierDisplay = (tier: string | null) => {
    if (displayTierLoading) {
      return { label: 'Loading...', className: 'bg-gray-100 text-gray-600' };
    }

    switch (tier) {
      case 'invited':
        return { label: 'Invited', className: 'bg-gray-100 text-gray-700' };
      case 'basic':
        return { label: 'Basic', className: 'bg-blue-100 text-blue-800' };
      case 'pro':
        return { label: 'Pro', className: 'bg-purple-100 text-purple-800' };
      case 'suite':
        return { label: 'Suite', className: 'bg-gold-100 text-gold-800 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800' };
      default:
        return { label: 'Unknown', className: 'bg-gray-100 text-gray-600' };
    }
  };

  const tierDisplay = getTierDisplay(displayTier);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full bg-white border-b border-porcelain-blue-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <img
              src="/kstorybridge-logo.png"
              alt="KStoryBridge"
              className="h-8 sm:h-10 lg:h-12 w-auto object-contain"
            />
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
                    {/* User name - truncate on mobile */}
                    <span className="text-midnight-ink font-medium max-w-[100px] sm:max-w-none truncate">
                      {displayUser.user_metadata?.full_name || displayUser.email}
                    </span>
                    {accountType === "buyer" && (
                      <div className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium w-fit ${tierDisplay.className}`}>
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

      {/* Mobile Menu Panel */}
      <div className={cn(
        "lg:hidden fixed left-0 top-[73px] w-64 bg-white border-r border-porcelain-blue-200 h-[calc(100vh-73px)] flex flex-col z-40 transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <nav className="p-4 flex-1">
          {/* DISCOVER Section */}
          <div className="mb-6 mt-8">
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
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-colors",
                      isActive
                        ? "bg-hanok-teal text-white"
                        : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                    )}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
        
        {/* SETTINGS Section */}
        <div className="p-4 border-t border-porcelain-blue-200">
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
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
