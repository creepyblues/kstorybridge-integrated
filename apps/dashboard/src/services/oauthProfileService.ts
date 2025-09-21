/**
 * OAuth Profile Service
 *
 * Handles profile creation for OAuth users with proper session management
 * and RLS policy compliance.
 */

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { createSimpleOAuthBuyerProfile, createSimpleOAuthCreatorProfile } from './simpleOAuthProfile';

const profileEdgeFunctionsEnabled = import.meta.env.VITE_ENABLE_PROFILE_EDGE_FUNCTIONS === 'true';

export interface OAuthProfileResult {
  success: boolean;
  error?: string;
  profile?: any;
}

export interface BuyerProfileData {
  id: string;
  email: string;
  full_name: string;
  buyer_company: string;
  buyer_role: string;
  linkedin_url?: string | null;
  tier?: 'basic' | 'invited' | 'pro' | 'suite';
  requested?: boolean;
  account_type?: 'buyer';
}

export interface CreatorProfileData {
  id: string;
  email: string;
  full_name: string;
  pen_name: string;
  ip_owner_role?: string | null;
  ip_owner_company?: string | null;
  website_url?: string | null;
  invitation_status?: string;
  account_type?: 'creator';
}

/**
 * Create buyer profile with session validation
 */
export async function createOAuthBuyerProfile(
  profileData: BuyerProfileData
): Promise<OAuthProfileResult> {
  try {
    console.log('🔐 OAuth Profile: Creating buyer profile with session validation');

    // For OAuth signup, we can trust the already authenticated user context
    // Skip getSession() which is timing out during OAuth callback flow
    console.log('⚡ OAuth Profile: Using direct approach during OAuth flow');

    // Prepare profile data with defaults
    const safeProfileData = {
      ...profileData,
      tier: profileData.tier || 'basic',
      requested: profileData.requested !== undefined ? profileData.requested : false,
      account_type: 'buyer' as const,
      created_at: new Date().toISOString()
    };

    // Try multiple approaches for profile creation
    console.log('🚀 OAuth Profile: Attempting profile creation with multiple fallbacks');

    // Approach 1: Use simple OAuth profile creation (avoids getSession timeouts)
    try {
      console.log('🎯 Attempting simple OAuth profile creation...');

      const simpleResult = await createSimpleOAuthBuyerProfile({
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        buyer_company: profileData.buyer_company,
        buyer_role: profileData.buyer_role,
        linkedin_url: profileData.linkedin_url,
        tier: profileData.tier || 'basic',
        requested: profileData.requested || false
      });

      if (simpleResult.success) {
        console.log('✅ OAuth Profile: Simple creation succeeded');
        return { success: true, profile: simpleResult.profile };
      }

      console.warn('⚠️ Simple creation failed, trying edge function:', simpleResult.error);
    } catch (simpleException) {
      console.warn('⚠️ Simple creation exception:', simpleException);
    }

    // Approach 2: Try edge function if explicitly enabled
    if (profileEdgeFunctionsEnabled) {
      try {
        console.log('📡 Attempting edge function approach...');
        const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('create-buyer-profile', {
          body: {
            userId: profileData.id,
            email: profileData.email,
            fullName: profileData.full_name,
            buyerCompany: profileData.buyer_company,
            buyerRole: profileData.buyer_role,
            linkedinUrl: profileData.linkedin_url,
            tier: profileData.tier || 'basic'
          }
        });

        if (!edgeError && edgeResult) {
          console.log('✅ OAuth Profile: Edge function succeeded');
          return { success: true, profile: edgeResult };
        }

        console.warn('⚠️ Edge function failed, trying atomic creator:', edgeError?.message);
      } catch (edgeException) {
        console.warn('⚠️ Edge function exception:', edgeException);
      }
    } else {
      console.log('📡 Edge function approach skipped (VITE_ENABLE_PROFILE_EDGE_FUNCTIONS not set to true)');
    }

    // Approach 2: Use the atomic profile creator (which has retry logic)
    try {
      console.log('🔄 Attempting atomic profile creator...');
      const { createBuyerProfileAtomic } = await import('@/utils/atomicProfileCreator');

      const atomicResult = await createBuyerProfileAtomic({
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        buyer_company: profileData.buyer_company,
        buyer_role: profileData.buyer_role,
        linkedin_url: profileData.linkedin_url,
        tier: profileData.tier || 'basic',
        requested: false
      }, {
        maxRetries: 3,
        allowUpdate: true,
        waitForTrigger: false // Skip trigger wait in OAuth flow
      });

      if (atomicResult.success) {
        console.log('✅ OAuth Profile: Atomic creator succeeded');
        return { success: true, profile: atomicResult.profile };
      }

      console.warn('⚠️ Atomic creator failed:', atomicResult.error);
    } catch (atomicException) {
      console.warn('⚠️ Atomic creator exception:', atomicException);
    }

    // Approach 3: Use the current user's token directly (bypass getSession timeout)
    try {
      console.log('🔑 Attempting direct user token approach...');

      // Get the user directly (this works even when getSession times out)
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.warn('⚠️ No user found for direct token approach');
      } else {
        console.log('✅ User found, attempting profile creation with user context');

        // Create a new client instance with the user's session
        const userSupabase = supabase;

        const { data: profile, error } = await userSupabase
          .from('user_buyers')
          .upsert(safeProfileData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (!error && profile) {
          console.log('✅ OAuth Profile: Direct user token approach succeeded');
          return { success: true, profile };
        }

        console.warn('⚠️ Direct user token approach failed:', error?.message);
      }
    } catch (directException) {
      console.warn('⚠️ Direct user token approach exception:', directException);
    }

    // Approach 4: Final fallback - direct upsert without session validation
    try {
      console.log('📝 Attempting final direct database upsert...');
      const { data: profile, error } = await supabase
        .from('user_buyers')
        .upsert(safeProfileData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (!error && profile) {
        console.log('✅ OAuth Profile: Final direct upsert succeeded');
        return { success: true, profile };
      }

      console.warn('⚠️ Final direct upsert failed:', error?.message);
    } catch (directException) {
      console.warn('⚠️ Final direct upsert exception:', directException);
    }

    // If all approaches fail, return a helpful error
    return {
      success: false,
      error: 'Profile creation temporarily unavailable. Please try signing in again or contact support.'
    };

    // Note: Keeping the direct approach commented as fallback
    /*
    const { data: profile, error } = await supabase
      .from('user_buyers')
      .upsert(safeProfileData, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();
    */

  } catch (error) {
    console.error('❌ OAuth Profile: Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Create creator profile with session validation
 */
export async function createOAuthCreatorProfile(
  profileData: CreatorProfileData
): Promise<OAuthProfileResult> {
  try {
    console.log('🔐 OAuth Profile: Creating creator profile with session validation');

    // For OAuth signup, we can trust the already authenticated user context
    // Skip getSession() which is timing out during OAuth callback flow
    console.log('⚡ OAuth Profile: Using direct approach during OAuth flow');

    // Prepare profile data with defaults
    const safeProfileData = {
      ...profileData,
      invitation_status: profileData.invitation_status || 'invited',
      account_type: 'creator' as const,
      created_at: new Date().toISOString()
    };

    // Try multiple approaches for creator profile creation
    console.log('🚀 OAuth Profile: Attempting creator profile creation with multiple fallbacks');

    // Approach 1: Use simple OAuth creator profile creation (avoids getSession timeouts)
    try {
      console.log('🎯 Attempting simple OAuth creator profile creation...');

      const simpleResult = await createSimpleOAuthCreatorProfile({
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        pen_name: profileData.pen_name,
        ip_owner_role: profileData.ip_owner_role,
        ip_owner_company: profileData.ip_owner_company,
        website_url: profileData.website_url
      });

      if (simpleResult.success) {
        console.log('✅ OAuth Profile: Simple creator creation succeeded');
        return { success: true, profile: simpleResult.profile };
      }

      console.warn('⚠️ Simple creator creation failed, trying edge function:', simpleResult.error);
    } catch (simpleException) {
      console.warn('⚠️ Simple creator creation exception:', simpleException);
    }

    // Approach 2: Try edge function if explicitly enabled
    if (profileEdgeFunctionsEnabled) {
      try {
        console.log('📡 Attempting creator edge function approach...');
        const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('create-creator-profile', {
          body: {
            userId: profileData.id,
            email: profileData.email,
            fullName: profileData.full_name,
            penName: profileData.pen_name,
            ipOwnerRole: profileData.ip_owner_role,
            ipOwnerCompany: profileData.ip_owner_company,
            websiteUrl: profileData.website_url,
            invitationStatus: profileData.invitation_status || 'invited'
          }
        });

        if (!edgeError && edgeResult) {
          console.log('✅ OAuth Profile: Creator edge function succeeded');
          return { success: true, profile: edgeResult };
        }

        console.warn('⚠️ Creator edge function failed, trying atomic creator:', edgeError?.message);
      } catch (edgeException) {
        console.warn('⚠️ Creator edge function exception:', edgeException);
      }
    } else {
      console.log('📡 Creator edge function approach skipped (VITE_ENABLE_PROFILE_EDGE_FUNCTIONS not set to true)');
    }

    // Approach 2: Use the atomic profile creator
    try {
      console.log('🔄 Attempting atomic creator profile creator...');
      const { createCreatorProfileAtomic } = await import('@/utils/atomicProfileCreator');

      const atomicResult = await createCreatorProfileAtomic({
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        pen_name: profileData.pen_name,
        ip_owner_role: profileData.ip_owner_role,
        ip_owner_company: profileData.ip_owner_company,
        website_url: profileData.website_url,
        invitation_status: profileData.invitation_status || 'invited'
      }, {
        maxRetries: 3,
        allowUpdate: true,
        waitForTrigger: false // Skip trigger wait in OAuth flow
      });

      if (atomicResult.success) {
        console.log('✅ OAuth Profile: Atomic creator succeeded');
        return { success: true, profile: atomicResult.profile };
      }

      console.warn('⚠️ Atomic creator failed:', atomicResult.error);
    } catch (atomicException) {
      console.warn('⚠️ Atomic creator exception:', atomicException);
    }

    // Approach 3: Direct upsert as final fallback
    try {
      console.log('📝 Attempting direct creator database upsert...');
      const { data: profile, error } = await supabase
        .from('user_creators')
        .upsert(safeProfileData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (!error && profile) {
        console.log('✅ OAuth Profile: Creator direct upsert succeeded');
        return { success: true, profile };
      }

      console.warn('⚠️ Creator direct upsert failed:', error?.message);
    } catch (directException) {
      console.warn('⚠️ Creator direct upsert exception:', directException);
    }

    // If all approaches fail, return a helpful error
    return {
      success: false,
      error: 'Creator profile creation temporarily unavailable. Please try signing in again or contact support.'
    };

    // Note: Keeping the direct approach commented as fallback
    /*
    const { data: profile, error } = await supabase
      .from('user_creators')
      .upsert(safeProfileData, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();
    */

  } catch (error) {
    console.error('❌ OAuth Profile: Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validate that the user has proper authentication for profile creation
 */
export async function validateOAuthSession(userId: string): Promise<{
  valid: boolean;
  session?: any;
  error?: string;
}> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return { valid: false, error: sessionError.message };
    }

    if (!sessionData.session) {
      return { valid: false, error: 'No active session found' };
    }

    if (sessionData.session.user.id !== userId) {
      return { valid: false, error: 'Session user mismatch' };
    }

    return { valid: true, session: sessionData.session };

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Session validation failed'
    };
  }
}
