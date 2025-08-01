
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
    <header className="bg-white border-b border-porcelain-blue-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-hanok-teal rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-midnight-ink">{displayTitle}</h1>
            <p className="text-xs text-midnight-ink-500">KStoryBridge Platform</p>
          </div>
        </div>
        
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
    </header>
  );
}
