
import { useAuth } from "@/hooks/useAuth";
import { useTierAccess } from "@/hooks/useTierAccess";
import { User } from "lucide-react";

export function CMSHeader() {
  const { user } = useAuth();
  const { tier, loading: tierLoading } = useTierAccess();

  // Localhost development configuration
  const isLocalhost = window.location.hostname === 'localhost';

  // 🧪 LOCALHOST CONFIG: Control data source for development
  // Set to true to use real Supabase data, false for mock data
  // NOTE: Should match the setting in useTierAccess.ts
  const useRealDataOnLocalhost = true; // Change this to true for real data testing

  const mockUser = {
    id: 'mock-user-12345',
    email: 'demo@kstorybridge.com',
    user_metadata: {
      full_name: 'Demo User',
      account_type: 'buyer'
    }
  };

  // 🧪 MOCK TESTING: Change this value when using mock data
  // Options: 'invited', 'basic', 'pro', 'suite'
  // NOTE: Should match the mockTier in useTierAccess.ts
  const mockTier = 'pro';

  // Use mock data on localhost (unless real data is enabled), real data otherwise
  const displayUser = (isLocalhost && !useRealDataOnLocalhost) ? mockUser : user;
  const displayTier = (isLocalhost && !useRealDataOnLocalhost) ? mockTier : tier;
  const displayTierLoading = (isLocalhost && !useRealDataOnLocalhost) ? false : tierLoading;

  // Get account type for display
  const accountType = displayUser?.user_metadata?.account_type || "buyer";
  const displayTitle = accountType === "ip_owner" ? "Creator Dashboard" : "Buyer Dashboard";

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
    <header className="fixed top-0 left-0 right-0 w-full bg-white border-b border-porcelain-blue-200 px-6 py-4 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img
            src="/kstorybridge-logo.png"
            alt="KStoryBridge"
            className="h-12 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-semibold text-slate-700 tracking-wide">
            {displayTitle}
          </h1>

          <div className="flex items-center gap-4">
            {displayUser && (
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-midnight-ink-400" />
                <div className="flex items-center gap-3">
                  <span className="text-midnight-ink font-medium">
                    {displayUser.user_metadata?.full_name || displayUser.email}
                  </span>
                  {accountType === "buyer" && (
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium w-fit ${tierDisplay.className}`}>
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
  );
}
