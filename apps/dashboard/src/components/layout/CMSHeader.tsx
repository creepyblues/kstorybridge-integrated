
import { Shield, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function CMSHeader() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // Get account type for display
  const accountType = user?.user_metadata?.account_type || "buyer";
  const displayTitle = accountType === "ip_owner" ? "Creator Dashboard" : "Buyer Dashboard";

  return (
    <header className="w-full bg-white border-b border-porcelain-blue-200 px-6 py-4">
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
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-midnight-ink-400" />
                <span className="text-midnight-ink font-medium">
                  {user.user_metadata?.full_name || user.email}
                </span>
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
