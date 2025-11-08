import { ReactNode } from 'react';
import { useTierAccess, UserTier } from '@/contexts/TierContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TierGatedContentProps {
  children: ReactNode;
  requiredTier: UserTier;
  fallback?: ReactNode;
}

export function TierGatedContent({ children, requiredTier, fallback }: TierGatedContentProps) {
  const { hasAccess, loading } = useTierAccess();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (hasAccess(requiredTier)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <Card className="border-pro-purple/20 bg-pro-purple/5">
      <CardContent className="p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-pro-purple/10 rounded-full p-4">
            <Lock className="h-8 w-8 text-pro-purple" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-black">
            {requiredTier === 'pro' ? 'Pro' : 'Suite'} Feature
          </h3>
          <p className="text-gray-600">
            This feature is available to {requiredTier === 'pro' ? 'Pro' : 'Suite'} tier members.
            Upgrade your plan to unlock access.
          </p>
        </div>

        <Button
          onClick={() => navigate('/buyers/plan')}
          className="bg-pro-purple hover:bg-pro-purple/90"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade to {requiredTier === 'pro' ? 'Pro' : 'Suite'}
        </Button>
      </CardContent>
    </Card>
  );
}
