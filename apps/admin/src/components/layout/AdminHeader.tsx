import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { LogOut, Shield, User } from 'lucide-react';

export default function AdminHeader() {
  const { adminProfile, signOut } = useAdminAuth();

  return (
    <header className="bg-white border-b border-porcelain-blue-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-hanok-teal rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-midnight-ink">Admin Portal</h1>
            <p className="text-xs text-midnight-ink-500">KStoryBridge Administration</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {adminProfile && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-midnight-ink-400" />
              <span className="text-midnight-ink font-medium">{adminProfile.full_name}</span>
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
    </header>
  );
}