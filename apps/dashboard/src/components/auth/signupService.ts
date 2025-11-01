import { authService } from '@/services/auth';
import { createBuyerProfileAtomic, createCreatorProfileAtomic } from '@/utils/atomicProfileCreator';
import { createOAuthProfileViaEdgeFunction } from '@/services/oauthProfileEdgeFunction';
import { createBuyerViaEdgeFunction, createCreatorViaEdgeFunction } from '@/services/emailSignupEdgeFunction';
import type { BuyerFormData, CreatorFormData, AccountType } from './types';
import { isBlockedEmail, normalizeCreatorRole } from './validation';
import { sendWelcomeEmail } from '@/services/emailService';
import { notifyBuyerSignup, notifyCreatorSignup } from '@/utils/slack';
import { supabase } from '@/integrations/supabase/client';

const resolveDashboardUrl = () => {
  const defaultProdUrl = 'https://dashboard.kstorybridge.com';
  let envUrl = import.meta.env.VITE_DASHBOARD_URL;

  if (envUrl?.includes('vercel.app')) {
    envUrl = defaultProdUrl;
  }

  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;

    if (origin.includes('localhost')) {
      return origin;
    }

    if (origin.includes('vercel.app')) {
      return defaultProdUrl;
    }

    return origin;
  }

  return defaultProdUrl;
};

export interface SignupResult {
  success: boolean;
  error?: string;
  user?: any;
}

/**
 * Complete OAuth user profile - for users who are already authenticated
 */
export const completeOAuthProfile = async (
  accountType: AccountType,
  formData: BuyerFormData | CreatorFormData,
  user: any,
  session?: any
): Promise<SignupResult> => {
  try {
    console.log('🔄 Completing OAuth profile for:', user.email, 'as', accountType);

    if (accountType === 'buyer') {
      const buyerData = formData as BuyerFormData;

      // Use secure edge function for OAuth profile creation
      let profileResult = await createOAuthProfileViaEdgeFunction('buyer', user.id, {
        id: user.id,
        email: user.email,
        full_name: buyerData.full_name,
        buyer_company: buyerData.buyer_company,
        buyer_role: buyerData.buyer_role,
        linkedin_url: buyerData.linkedin_url || null,
        tier: 'basic',
        requested: false
      }, session);

      // Fallback to atomic profile creator if service role fails
      if (!profileResult.success) {
        console.log('⚠️ Simple OAuth profile creation failed, falling back to atomic creator');
        profileResult = await createBuyerProfileAtomic({
          id: user.id,
          email: user.email,
          full_name: buyerData.full_name,
          buyer_company: buyerData.buyer_company,
          buyer_role: buyerData.buyer_role,
          linkedin_url: buyerData.linkedin_url || null,
          tier: 'basic',
          requested: false
        }, {
          maxRetries: 3,
          allowUpdate: true
        });
      }

      if (!profileResult.success) {
        return { success: false, error: profileResult.error };
      }

      // CRITICAL: Metadata write is MANDATORY and BLOCKING
      // User CANNOT sign up without account_type metadata
      if (!session?.access_token) {
        console.error('❌ CRITICAL: No session available for metadata update');
        return {
          success: false,
          error: 'OAuth session invalid - cannot complete signup without account_type metadata'
        };
      }

      console.log('🔄 Updating account_type metadata (BLOCKING - MANDATORY)...');

      try {
        // Wrap metadata update with timeout to prevent infinite hangs
        const metadataUpdatePromise = supabase.auth.updateUser({
          data: { account_type: 'buyer' }
        });

        const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Metadata update timeout after 5 seconds')), 5000)
        );

        const { error: metadataError } = await Promise.race([metadataUpdatePromise, timeoutPromise]);

        if (metadataError) {
          console.error('❌ CRITICAL: Metadata update failed:', metadataError);
          return {
            success: false,
            error: 'Failed to set account_type metadata - signup aborted to prevent orphaned profile'
          };
        }

        console.log('✅ Account type metadata written successfully - signup can proceed');
      } catch (error) {
        console.error('❌ CRITICAL: Metadata update exception:', error);
        return {
          success: false,
          error: 'Exception during metadata write - signup aborted to prevent orphaned profile'
        };
      }

      // Only return success AFTER metadata is confirmed written
      const userResult = { success: true, user };

      // Send welcome email and Slack notification in background (non-blocking)
      (async () => {
        try {
          await Promise.all([
            sendWelcomeEmail({
              userName: buyerData.full_name,
              userEmail: user.email,
              accountType: 'buyer',
              dashboardUrl: `${window.location.origin}/buyers/chat`,
              loginUrl: `${window.location.origin}/signin`
            }),
            notifyBuyerSignup({
              fullName: buyerData.full_name,
              email: user.email,
              company: buyerData.buyer_company,
              role: buyerData.buyer_role
            })
          ]);
          console.log('✅ Welcome email and Slack notification sent for OAuth buyer (background)');
        } catch (notificationError) {
          console.error('⚠️ Failed to send notifications (non-blocking background):', notificationError);
        }
      })();

      return userResult;

    } else {
      const creatorData = formData as CreatorFormData;
      const normalizedRole = normalizeCreatorRole(creatorData.ip_owner_role);

      // Use secure edge function for OAuth profile creation
      let profileResult = await createOAuthProfileViaEdgeFunction('creator', user.id, {
        id: user.id,
        email: user.email,
        full_name: creatorData.full_name,
        pen_name: creatorData.pen_name,
        ip_owner_role: normalizedRole,
        ip_owner_company: creatorData.ip_owner_company || null,
        website_url: creatorData.website_url || null
      }, session);

      // Fallback to atomic profile creator if service role fails
      if (!profileResult.success) {
        console.log('⚠️ Simple OAuth creator profile creation failed, falling back to atomic creator');
        profileResult = await createCreatorProfileAtomic({
          id: user.id,
          email: user.email,
          full_name: creatorData.full_name,
          pen_name: creatorData.pen_name,
          ip_owner_role: normalizedRole,
          ip_owner_company: creatorData.ip_owner_company,
          website_url: creatorData.website_url,
          invitation_status: 'invited'
        }, {
          maxRetries: 3,
          allowUpdate: true
        });
      }

      if (!profileResult.success) {
        return { success: false, error: profileResult.error };
      }

      // CRITICAL: Metadata write is MANDATORY and BLOCKING
      // User CANNOT sign up without account_type metadata
      if (!session?.access_token) {
        console.error('❌ CRITICAL: No session available for metadata update');
        return {
          success: false,
          error: 'OAuth session invalid - cannot complete signup without account_type metadata'
        };
      }

      console.log('🔄 Updating account_type metadata (BLOCKING - MANDATORY)...');

      try {
        // Wrap metadata update with timeout to prevent infinite hangs
        const metadataUpdatePromise = supabase.auth.updateUser({
          data: { account_type: 'creator' }
        });

        const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Metadata update timeout after 5 seconds')), 5000)
        );

        const { error: metadataError } = await Promise.race([metadataUpdatePromise, timeoutPromise]);

        if (metadataError) {
          console.error('❌ CRITICAL: Metadata update failed:', metadataError);
          return {
            success: false,
            error: 'Failed to set account_type metadata - signup aborted to prevent orphaned profile'
          };
        }

        console.log('✅ Account type metadata written successfully - signup can proceed');
      } catch (error) {
        console.error('❌ CRITICAL: Metadata update exception:', error);
        return {
          success: false,
          error: 'Exception during metadata write - signup aborted to prevent orphaned profile'
        };
      }

      // Only return success AFTER metadata is confirmed written
      const userResult = { success: true, user };

      // Send welcome email and Slack notification in background (non-blocking)
      (async () => {
        try {
          await Promise.all([
            sendWelcomeEmail({
              userName: creatorData.full_name,
              userEmail: user.email,
              accountType: 'creator',
              dashboardUrl: `${window.location.origin}/creators/home`,
              loginUrl: `${window.location.origin}/signin`
            }),
            notifyCreatorSignup({
              fullName: creatorData.full_name,
              email: user.email,
              penName: creatorData.pen_name,
              role: creatorData.ip_owner_role,
              company: creatorData.ip_owner_company
            })
          ]);
          console.log('✅ Welcome email and Slack notification sent for OAuth creator (background)');
        } catch (notificationError) {
          console.error('⚠️ Failed to send notifications (non-blocking background):', notificationError);
        }
      })();

      return userResult;
    }

  } catch (error) {
    console.error('OAuth profile completion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete profile'
    };
  }
};

/**
 * Handle buyer signup - both email and OAuth
 */
export const signupBuyer = async (formData: BuyerFormData): Promise<SignupResult> => {
  try {
    // Check for blocked email
    if (isBlockedEmail(formData.email)) {
      return {
        success: false,
        error: 'This email domain is not allowed to sign up.'
      };
    }

    // Create auth user with metadata
    const dashboardUrl = resolveDashboardUrl();

    const result = await authService.signUp({
      email: formData.email,
      password: formData.password,
      metadata: {
        full_name: formData.full_name,
        buyer_company: formData.buyer_company,
        buyer_role: formData.buyer_role,
        linkedin_url: formData.linkedin_url,
        account_type: 'buyer',
        tier: formData.tier || 'basic',
        requested: false
      },
      emailRedirectTo: `${dashboardUrl}/signin/buyer?verified=true`
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (!result.user) {
      return { success: false, error: 'Failed to create user account' };
    }

    // Create profile using edge function (bypasses RLS with server-side service role)
    console.log('📝 Email signup: Creating buyer profile via edge function');
    const profileResult = await createBuyerViaEdgeFunction({
      id: result.user.id,
      email: formData.email,
      full_name: formData.full_name,
      buyer_company: formData.buyer_company,
      buyer_role: formData.buyer_role,
      linkedin_url: formData.linkedin_url || null,
      tier: formData.tier || 'basic',
      requested: false
    });

    if (!profileResult.success) {
      console.error('❌ Email signup: Profile creation failed:', profileResult.error);
      return {
        success: false,
        error: `Failed to create buyer profile: ${profileResult.error || 'Unknown error'}`
      };
    }

    console.log('✅ Email signup: Buyer profile created successfully');

    // Send Slack notification (welcome email will be sent after email verification)
    try {
      await notifyBuyerSignup({
        fullName: formData.full_name,
        email: formData.email,
        company: formData.buyer_company,
        role: formData.buyer_role
      });
      console.log('✅ Slack notification sent for email buyer signup (welcome email will be sent after verification)');
    } catch (notificationError) {
      console.error('⚠️ Failed to send notifications (non-blocking):', notificationError);
    }

    return { success: true, user: result.user };

  } catch (error) {
    console.error('Buyer signup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown signup error'
    };
  }
};

/**
 * Handle creator signup - both email and OAuth
 */
export const signupCreator = async (formData: CreatorFormData): Promise<SignupResult> => {
  try {
    // Check for blocked email
    if (isBlockedEmail(formData.email)) {
      return {
        success: false,
        error: 'This email domain is not allowed to sign up.'
      };
    }

    // Create auth user with metadata
    const dashboardUrl = resolveDashboardUrl();

    const result = await authService.signUp({
      email: formData.email,
      password: formData.password,
      metadata: {
        full_name: formData.full_name,
        pen_name: formData.pen_name,
        ip_owner_role: normalizeCreatorRole(formData.ip_owner_role) || undefined,
        ip_owner_company: formData.ip_owner_company,
        website_url: formData.website_url,
        account_type: 'creator',
        invitation_status: formData.invitation_status || 'invited'
      },
      emailRedirectTo: `${dashboardUrl}/signin/creator?verified=true`
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (!result.user) {
      return { success: false, error: 'Failed to create user account' };
    }

    // Create profile using edge function (bypasses RLS with server-side service role)
    console.log('📝 Email signup: Creating creator profile via edge function');
    const profileResult = await createCreatorViaEdgeFunction({
      id: result.user.id,
      email: formData.email,
      full_name: formData.full_name,
      pen_name: formData.pen_name,
      ip_owner_role: normalizeCreatorRole(formData.ip_owner_role), // Role is now required
      ip_owner_company: formData.ip_owner_company,
      website_url: formData.website_url,
      invitation_status: formData.invitation_status || 'invited'
    });

    if (!profileResult.success) {
      console.error('❌ Email signup: Creator profile creation failed:', profileResult.error);
      return {
        success: false,
        error: `Failed to create creator profile: ${profileResult.error || 'Unknown error'}`
      };
    }

    console.log('✅ Email signup: Creator profile created successfully');

    // Send Slack notification (welcome email will be sent after email verification)
    try {
      await notifyCreatorSignup({
        fullName: formData.full_name,
        email: formData.email,
        penName: formData.pen_name,
        role: formData.ip_owner_role,
        company: formData.ip_owner_company
      });
      console.log('✅ Slack notification sent for email creator signup (welcome email will be sent after verification)');
    } catch (notificationError) {
      console.error('⚠️ Failed to send notifications (non-blocking):', notificationError);
    }

    return { success: true, user: result.user };

  } catch (error) {
    console.error('Creator signup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown signup error'
    };
  }
};

/**
 * Handle OAuth signup
 */
export const handleOAuthSignup = async (
  provider: 'google' | 'discord',
  accountType: AccountType
): Promise<{ error?: string }> => {
  try {
    console.log(`🔐 ${accountType.toUpperCase()} OAuth signup initiated with provider: ${provider}`);

    // Store flow data in sessionStorage (PRIMARY data passing mechanism)
    sessionStorage.setItem('oauth_account_type', accountType);
    sessionStorage.setItem('oauth_flow', 'signup');

    // ✅ CRITICAL: NO URL parameters in OAuth callback URL (per CLAUDE.md)
    // Use clean callback URL - data passed via sessionStorage only
    // Explicit domain handling for multi-environment OAuth redirects
    const isStaging = window.location.hostname === 'dashboard-v2.kstorybridge.com'
    const isProduction = window.location.hostname === 'dashboard.kstorybridge.com'

    const callbackUrl = isStaging
      ? 'https://dashboard-v2.kstorybridge.com/auth/callback'
      : isProduction
      ? 'https://dashboard.kstorybridge.com/auth/callback'
      : `${window.location.origin}/auth/callback`;  // Localhost

    const result = await authService.signInWithOAuth(provider, {
      redirectTo: callbackUrl // Clean callback URL, no parameters
    });

    if (result.error) {
      return { error: result.error };
    }

    return {};

  } catch (error) {
    console.error('OAuth signup error:', error);
    return {
      error: error instanceof Error ? error.message : 'OAuth signup failed'
    };
  }
};
