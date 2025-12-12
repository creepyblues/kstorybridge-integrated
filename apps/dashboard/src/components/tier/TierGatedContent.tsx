import { ReactNode, useEffect, useRef } from 'react';
import { useTierAccess, UserTier } from '@/contexts/TierContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { trackPremiumFeatureBlocked, trackPremiumUpgradeCtaClicked } from '@/utils/analytics';

interface TierGatedContentProps {
  children: ReactNode;
  requiredTier: UserTier;
  fallback?: ReactNode;
  featureName?: string; // Optional name for tracking
}

export function TierGatedContent({ children, requiredTier, fallback, featureName }: TierGatedContentProps) {
  const { hasAccess, tier, loading } = useTierAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const hasTrackedBlockRef = useRef(false);

  // Track when premium feature is blocked (only once per mount)
  useEffect(() => {
    if (!loading && !hasAccess(requiredTier) && !hasTrackedBlockRef.current) {
      hasTrackedBlockRef.current = true;
      const feature = featureName || `${requiredTier}_feature`;
      trackPremiumFeatureBlocked(
        feature,
        requiredTier,
        tier || 'basic',
        location.pathname
      );
    }
  }, [loading, requiredTier, tier, featureName, location.pathname, hasAccess]);

  const handleUpgradeClick = () => {
    const feature = featureName || `${requiredTier}_feature`;
    trackPremiumUpgradeCtaClicked(
      feature,
      'tier_gated_content',
      tier || 'basic'
    );
    navigate('/buyers/plan');
  };

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
            <Icon icon="solar:lock-bold-duotone" className="h-8 w-8 text-pro-purple" />
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
          onClick={handleUpgradeClick}
          className="bg-pro-purple hover:bg-pro-purple/90"
        >
          <Icon icon="solar:stars-bold-duotone" className="h-4 w-4 mr-2" />
          Upgrade to {requiredTier === 'pro' ? 'Pro' : 'Suite'}
        </Button>
      </CardContent>
    </Card>
  );
}
