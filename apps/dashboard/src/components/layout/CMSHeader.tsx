
import { Shield, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTierAccess } from "@/hooks/useTierAccess";

export function CMSHeader() {
  const { user, signOut } = useAuth();
  const { tier, loading: tierLoading } = useTierAccess();

  // Mock data for localhost development
  const isLocalhost = window.location.hostname === 'localhost';
  const mockUser = {
    id: 'mock-user-12345',
    email: 'demo@kstorybridge.com',
    user_metadata: {
      full_name: 'Demo User',
      account_type: 'buyer'
    }
  };
  
  // 🧪 TESTING: Change this value to test different tier displays
  // Options: 'invited', 'basic', 'pro', 'suite'
  const mockTier = 'pro';

  // Use mock data on localhost, real data otherwise
  const displayUser = isLocalhost ? mockUser : user;
  const displayTier = isLocalhost ? mockTier : tier;
  const displayTierLoading = isLocalhost ? false : tierLoading;

  const handleSignOut = async () => {
    await signOut();
  };

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
                <div className="flex flex-col">
                  <span className="text-midnight-ink font-medium">
                    {displayUser.user_metadata?.full_name || displayUser.email}
                  </span>
                  <span className="text-midnight-ink-400 text-xs">
                    ID: {displayUser.id}
                  </span>
                  {accountType === "buyer" && (
                    <div className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${tierDisplay.className}`}>
                      {tierDisplay.label}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button
              id="cms-header-sign-out-btn"
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="border-porcelain-blue-300 text-midnight-ink-600 hover:bg-porcelain-blue-100 rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
