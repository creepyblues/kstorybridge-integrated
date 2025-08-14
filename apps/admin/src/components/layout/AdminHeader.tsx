import { useAdminAuth } from '@/hooks/useAdminAuth';
import { LogOut, Shield, User } from 'lucide-react';
import { Button } from "@kstorybridge/ui";

export default function AdminHeader() {
  const { adminProfile, signOut } = useAdminAuth();

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
            Admin Dashboard
          </h1>

          <div className="flex items-center gap-4">
            {adminProfile && (
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-midnight-ink-400" />
                <div className="flex items-center gap-3">
                  <span className="text-midnight-ink font-medium">
                    {adminProfile.full_name || adminProfile.email}
                  </span>
                  <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Admin
                  </div>
                </div>
              </div>
            )}
            
            <Button
              onClick={signOut}
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