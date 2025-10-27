import React from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';
import { useAuth } from '@/hooks/useAuth';

interface TierGatedContentProps {
  children: React.ReactNode;
  requiredTier?: 'basic' | 'pro' | 'suite';
  className?: string;
  premiumLabel?: string;
  fallbackContent?: React.ReactNode;
}

const TierGatedContent: React.FC<TierGatedContentProps> = ({
  children,
  requiredTier = 'pro',
  className = '',
  premiumLabel = 'PRO PLAN',
  fallbackContent
}) => {
  const { hasMinimumTier, loading } = useTierAccess();
  const { user } = useAuth();

  // Check if user is a creator - creators bypass tier restrictions
  const isCreator = user?.user_metadata?.account_type === 'creator';

  // Show loading state
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
      </div>
    );
  }

  // Creators bypass tier restrictions entirely
  if (isCreator) {
    return <div className={className}>{children}</div>;
  }

  // User has required tier - show content normally
  if (hasMinimumTier(requiredTier)) {
    return <div className={className}>{children}</div>;
  }

  // User doesn't have required tier - show blurred/gated content
  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="filter blur-sm select-none pointer-events-none">
        {fallbackContent || children}
      </div>
      
      {/* Premium overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-rose-50/80 to-purple-50/80 backdrop-blur-sm pointer-events-none flex items-center justify-center">
        <div className="bg-white/90 border border-rose-200 rounded-lg px-3 py-2 shadow-sm flex items-center justify-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-rose-800 text-center block">
              {premiumLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierGatedContent;