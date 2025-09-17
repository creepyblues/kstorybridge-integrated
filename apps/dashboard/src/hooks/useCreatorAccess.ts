import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CreatorProfile {
  id: string;
  email: string;
  full_name: string;
  pen_name?: string;
  ip_owner_role?: string;
  ip_owner_company?: string;
  website_url?: string;
  invitation_status?: string;
  created_at: string;
  updated_at: string;
}

interface CreatorAccess {
  profile: CreatorProfile | null;
  loading: boolean;
  isCreator: boolean;
  canCreateTitles: boolean;
  canEditTitles: boolean;
  canViewRequests: boolean;
  canAccessDashboard: boolean;
}

/**
 * Hook for managing creator-specific access and permissions
 * This replaces tier-based access for creators with role-based permissions
 */
export const useCreatorAccess = (): CreatorAccess => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Localhost development configuration
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // 🧪 LOCALHOST CONFIG: Control data source for development
  const useRealDataOnLocalhost = true;

  // Test email for real data queries (replace with your test account)
  const testEmail = 'sungho@dadble.com';

  useEffect(() => {
    const fetchCreatorProfile = async () => {
      // Only proceed if user is a creator
      const accountType = user?.user_metadata?.account_type;
      if (accountType !== 'creator') {
        console.log('🎨 useCreatorAccess: User is not a creator, skipping profile query');
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // For localhost with real data, use test email
      const queryEmail = isLocalhost && useRealDataOnLocalhost ? testEmail : user?.email;

      try {
        console.log('🔍 useCreatorAccess: Fetching creator profile for:', queryEmail);

        // Query creator profile from user_creators table
        const { data, error } = await supabase
          .from('user_creators')
          .select('*')
          .eq('email', queryEmail)
          .single();

        if (error) {
          console.error('❌ Error fetching creator profile:', error);
          setProfile(null);
        } else {
          console.log('✅ Creator profile found:', data);
          setProfile(data);
        }
      } catch (error) {
        console.error('❌ Exception fetching creator profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorProfile();
  }, [user?.id, user?.user_metadata?.account_type, isLocalhost]);

  // Determine creator permissions based on profile and status
  const isCreator = user?.user_metadata?.account_type === 'creator';
  const canAccessDashboard = isCreator && !!profile;
  const canCreateTitles = canAccessDashboard && profile?.invitation_status === 'accepted';
  const canEditTitles = canCreateTitles; // Same permissions for now
  const canViewRequests = canAccessDashboard; // All creators can view requests

  return {
    profile,
    loading,
    isCreator,
    canCreateTitles,
    canEditTitles,
    canViewRequests,
    canAccessDashboard
  };
};

/**
 * Creator-specific content gating component
 * Use this instead of TierGatedContent for creator-specific restrictions
 */
export interface CreatorGatedContentProps {
  children: React.ReactNode;
  requiredPermission: 'canCreateTitles' | 'canEditTitles' | 'canViewRequests' | 'canAccessDashboard';
  className?: string;
  fallbackContent?: React.ReactNode;
}

export const CreatorGatedContent: React.FC<CreatorGatedContentProps> = ({
  children,
  requiredPermission,
  className = '',
  fallbackContent
}) => {
  const creatorAccess = useCreatorAccess();

  // Show loading state
  if (creatorAccess.loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
      </div>
    );
  }

  // Check if creator has required permission
  const hasPermission = creatorAccess[requiredPermission];

  if (hasPermission) {
    return <div className={className}>{children}</div>;
  }

  // Creator doesn't have required permission - show fallback or restricted content
  if (fallbackContent) {
    return <div className={className}>{fallbackContent}</div>;
  }

  // Show invitation status message for creators
  if (creatorAccess.isCreator && creatorAccess.profile?.invitation_status !== 'accepted') {
    return (
      <div className={`relative ${className}`}>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-amber-800">Account Pending Approval</h3>
              <p className="text-sm text-amber-700">
                Your creator account is currently pending approval. Please contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default restricted access message
  return (
    <div className={`relative ${className}`}>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            You don't have permission to access this content.
          </p>
        </div>
      </div>
    </div>
  );
};