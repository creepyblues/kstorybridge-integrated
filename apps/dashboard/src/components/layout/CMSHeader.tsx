
import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTierAccess } from "@/hooks/useTierAccess";
import { useAccountType } from "@/utils/accountTypeDetection";
import { User, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const getDiscoverItems = (accountType: string) => {
  if (accountType === "creator") {
    return [
      { title: "Home", href: "/creators/home" },
      { title: "My Titles", href: "/creators/titles" },
      { title: "News", href: "/creators/news" },
    ];
  } else {
    return [
      { title: "Home", href: "/buyers/home" },
      { title: "Titles", href: "/buyers/titles" },
      { title: "Favorites", href: "/buyers/favorites" },
      { title: "News", href: "/buyers/news" },
    ];
  }
};

const getSettingsItems = (accountType: string, userEmail?: string) => {
  const isAuthorizedForChatbot = userEmail === 'sungho@dadble.com' || userEmail === 'kevin@sandstoneartists.com';
  
  const baseItems = accountType === "creator" 
    ? [
        { title: "Profile", href: "/creators/profile" },
      ]
    : [
        { title: "Profile", href: "/buyers/profile" },
      ];
  
  // Add chatbot items for authorized users right after Profile
  if (isAuthorizedForChatbot) {
    const profileIndex = baseItems.findIndex(item => item.title === 'Profile');
    const chatbotItems = accountType === "creator" 
      ? [
          { title: "OpenAI Chatbot", href: "/creators/openai-chatbot", badge: "experiment" },
          { title: "AI Chatbot", href: "/creators/ai-chatbot", badge: "experiment" },
        ]
      : [
          { title: "OpenAI Chatbot", href: "/buyers/openai-chatbot", badge: "experiment" },
          { title: "AI Chatbot", href: "/buyers/ai-chatbot", badge: "experiment" },
        ];
    
    baseItems.splice(profileIndex + 1, 0, ...chatbotItems);
  }
  
  return baseItems;
};

export function CMSHeader() {
  const { user } = useAuth();
  const { tier, loading: tierLoading } = useTierAccess();
  
  // Memoize the options object to prevent unnecessary re-renders
  const accountTypeOptions = useMemo(() => ({
    includeDatabaseLookup: true,
    debug: false
  }), []);
  
  const { accountType: detectedAccountType, loading: accountTypeLoading } = useAccountType(accountTypeOptions);
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

  // Get account type for display - use centralized detection for accuracy
  const accountType = detectedAccountType || "buyer";
  const displayTitle = accountType === "creator" ? "Creator Dashboard" : "Buyer Dashboard";
  const userTypeLabel = accountType === "creator" ? "Creator" : "Buyer";
  const userEmail = displayUser?.email;
  
  // Get menu items
  const discoverItems = getDiscoverItems(accountType);
  const settingsItems = getSettingsItems(accountType, userEmail);

  // Get tier display info
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
            
            <Link 
              to={accountType === "creator" ? "/creators/home" : "/buyers/home"}
              className="flex items-center"
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
                    {/* User info - name and type */}
                    <div className="flex flex-col">
                      <span className="text-midnight-ink font-medium max-w-[100px] sm:max-w-none truncate">
                        {displayUser.user_metadata?.full_name || displayUser.email}
                      </span>
                      <span className="text-xs text-midnight-ink-400 font-normal">
                        {userTypeLabel}
                      </span>
                    </div>
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

      {/* Simple Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed left-3 right-3 top-[80px] bg-white rounded-2xl shadow-xl border border-gray-200 z-40 overflow-hidden">
          <div className="py-2">
            {/* All menu items in a simple list */}
            {discoverItems.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-base font-medium transition-colors border-b border-gray-100 last:border-b-0",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink hover:bg-gray-50"
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
            
            {/* Separator */}
            <div className="border-t border-gray-200 my-1"></div>
            
            {settingsItems.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink hover:bg-gray-50"
                  )}
                >
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full uppercase tracking-wider">
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
