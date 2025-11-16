import { authService } from '@/services/auth';
import { createBuyerProfileAtomic } from '@/utils/atomicProfileCreator';
import { createOAuthProfileViaEdgeFunction } from '@/services/oauthProfileEdgeFunction';
import { createBuyerViaEdgeFunction } from '@/services/emailSignupEdgeFunction';
import type { BuyerFormData } from './types';
import { isBlockedEmail } from './validation';
import { sendWelcomeEmail } from '@/services/emailService';
import { notifyBuyerSignup } from '@/utils/slack';
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
  user?: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  };
}

/**
 * Complete OAuth user profile - for users who are already authenticated
 * Dashboard app now only handles BUYER auth (creator auth moved to creator app)
 */
export const completeOAuthProfile = async (
  formData: BuyerFormData,
  user: { id: string; email: string; user_metadata?: Record<string, unknown> },
  session?: { access_token: string; refresh_token: string }
): Promise<SignupResult> => {
  try {
    console.log('🔄 Completing OAuth buyer profile for:', user.email);

    // Validate session before proceeding to prevent edge function calls with invalid sessions
    if (!session?.access_token) {
      console.error('❌ No valid session for OAuth profile creation');
      return {
        success: false,
        error: 'Session expired. Please sign in again to complete your profile.'
      };
    }

    const buyerData = formData;

    // Use secure edge function for OAuth profile creation with retry for race conditions
    // During OAuth, there's a brief window where auth.users record isn't visible yet
    // Retry with exponential backoff for foreign key constraint violations
    let profileResult: { success: boolean; error?: string; profile?: unknown } | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      profileResult = await createOAuthProfileViaEdgeFunction('buyer', user.id, {
        id: user.id,
        email: user.email,
        full_name: buyerData.full_name,
        buyer_company: buyerData.buyer_company,
        buyer_role: buyerData.buyer_role,
        linkedin_url: buyerData.linkedin_url || null,
        tier: 'basic',
        requested: false
      }, session);

      // Success or non-retryable error
      if (profileResult.success || !profileResult.error?.includes('foreign key constraint')) {
        break;
      }

      // Retry for foreign key constraint violations (OAuth race condition)
      if (attempt < maxRetries) {
        const delay = 100 * Math.pow(2, attempt - 1); // 100ms, 200ms, 400ms
        console.log(`⏳ OAuth Profile: Foreign key constraint, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

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

    // ✅ Profile creation succeeded - write metadata in non-blocking mode
    //
    // STRATEGY: Attempt to write account_type metadata immediately but don't fail signup if it times out
    //
    // REASONING:
    // - Writing metadata NOW gives fast path for subsequent loads (metadata check is instant)
    // - If write times out, RootRedirect.tsx has fallback logic to write it lazily
    // - Best of both worlds: performance optimization + reliability fallback
    //
    console.log('🔄 Writing account_type metadata (non-blocking)');

    // Non-blocking metadata update - don't await, don't fail signup on error
    supabase.auth.updateUser({
      data: { account_type: 'buyer' }
    }).then(({ error }) => {
      if (error) {
        console.warn('⚠️ Metadata update failed (non-blocking):', error.message);
        console.log('ℹ️ RootRedirect will write metadata lazily on next load');
      } else {
        console.log('✅ Account type metadata written successfully');
      }
    }).catch((error) => {
      console.warn('⚠️ Metadata update exception (non-blocking):', error);
      console.log('ℹ️ RootRedirect will write metadata lazily on next load');
    });

    console.log('✅ OAuth buyer profile created - proceeding to dashboard');
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

// signupCreator() function removed - creator auth moved to creator app

/**
 * Handle OAuth signup - Dashboard app now only handles BUYER auth
 */
export const handleOAuthSignup = async (
  provider: 'google' | 'discord'
): Promise<{ error?: string }> => {
  try {
    console.log(`🔐 BUYER OAuth signup initiated with provider: ${provider}`);

    // Store flow data in sessionStorage (PRIMARY data passing mechanism)
    // Dashboard app now only handles buyer auth (creator auth moved to creator app)
    sessionStorage.setItem('oauth_account_type', 'buyer');
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
