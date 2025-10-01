import { authService } from '@/services/auth';
import { createBuyerProfileAtomic, createCreatorProfileAtomic } from '@/utils/atomicProfileCreator';
import { createOAuthBuyerProfile, createOAuthCreatorProfile } from '@/services/oauthProfileService';
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
  user: any
): Promise<SignupResult> => {
  try {
    console.log('🔄 Completing OAuth profile for:', user.email, 'as', accountType);

    if (accountType === 'buyer') {
      const buyerData = formData as BuyerFormData;

      // Use OAuth-specific profile creation for better session handling
      const profileResult = await createOAuthBuyerProfile({
        id: user.id,
        email: user.email,
        full_name: buyerData.full_name,
        buyer_company: buyerData.buyer_company,
        buyer_role: buyerData.buyer_role,
        linkedin_url: buyerData.linkedin_url || null,
        tier: 'basic'
      });

      if (!profileResult.success) {
        return { success: false, error: profileResult.error };
      }

      // Metadata injection now handled by database trigger (bypasses session timeout issues)
      console.log('✅ TESTING: Profile created successfully, metadata will be injected by database trigger');

      // Return success immediately, send notifications asynchronously in background
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

      // Use OAuth-specific profile creation for better session handling
      const profileResult = await createOAuthCreatorProfile({
        id: user.id,
        email: user.email,
        full_name: creatorData.full_name,
        pen_name: creatorData.pen_name,
        ip_owner_role: normalizedRole, // Role is now required, no null fallback
        ip_owner_company: creatorData.ip_owner_company || null,
        website_url: creatorData.website_url || null,
        invitation_status: 'invited'
      });

      if (!profileResult.success) {
        return { success: false, error: profileResult.error };
      }

      // Metadata injection now handled by database trigger (bypasses session timeout issues)
      console.log('✅ TESTING: Creator profile created successfully, metadata will be injected by database trigger');

      // Return success immediately, send notifications asynchronously in background
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

    // Create profile
    await createBuyerProfileAtomic({
      id: result.user.id,
      email: formData.email,
      full_name: formData.full_name,
      buyer_company: formData.buyer_company,
      buyer_role: formData.buyer_role,
      linkedin_url: formData.linkedin_url || null,
      tier: formData.tier || 'basic',
      requested: false
    });

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

    // Create profile
    await createCreatorProfileAtomic({
      id: result.user.id,
      email: formData.email,
      full_name: formData.full_name,
      pen_name: formData.pen_name,
      ip_owner_role: normalizeCreatorRole(formData.ip_owner_role), // Role is now required
      ip_owner_company: formData.ip_owner_company,
      website_url: formData.website_url,
      invitation_status: formData.invitation_status || 'invited'
    });

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
    // Store account type for OAuth callback
    sessionStorage.setItem('oauth_account_type', accountType);

    const redirectUrl = `${window.location.origin}/auth/callback?account_type=${accountType}&flow=signup`;

    const result = await authService.signInWithOAuth(provider, {
      redirectTo: redirectUrl,
      queryParams: {
        account_type: accountType,
        flow: 'signup'
      }
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
