import { supabase } from './supabase';
import { debug } from '@/utils/debug';

const DEBUG = import.meta.env.VITE_AUTH_DEBUG === 'true';
const AUTH_TIMEOUT_MS = 10000; // 10 seconds for all auth operations

const log = (message: string, data?: any) => {
  if (DEBUG) {
    debug.log(`[Auth Service] ${message}`, data || '');
  }
};

/**
 * Timeout wrapper for async operations
 * Ensures auth operations fail fast instead of hanging
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Email validation removed - all email addresses allowed for buyer signups
// (Previously blocked consumer domains like Gmail, Yahoo, etc.)

// FunctionsHttpError.message is a generic "Edge Function returned a non-2xx status code".
// The real JSON body lives on the attached Response (supabase-js v2 exposes it via .context).
async function extractEdgeFunctionError(functionError: any): Promise<string> {
  try {
    const ctx = functionError?.context;
    const res = ctx && typeof ctx.json === 'function' ? ctx : ctx?.response;
    if (res && typeof res.json === 'function') {
      const body = await res.clone().json();
      if (body?.error) return body.error;
    }
  } catch {
    // fall through to generic message
  }
  return functionError?.message || 'Unknown error';
}

/**
 * Email/Password Signup for Buyers
 * Sets account_type='buyer' during signup (not after)
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: {
    full_name: string;
    buyer_company?: string;
    buyer_role?: string;
    linkedin_url?: string;
    trial_session_id?: string; // From trial flow
    newsletter_consent?: boolean;
  }
) {
  log('Starting email signup for buyer', { email });

  // Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Verification links land in-app so AuthCallback can restore redirect_after_login
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        account_type: 'buyer', // ✅ Set during signup
        full_name: metadata.full_name,
        newsletter_consent: metadata.newsletter_consent ?? false,
      },
    },
  });

  if (error) {
    log('Email signup error', error);
    throw error;
  }

  if (!data.user) {
    throw new Error('Signup failed - no user returned');
  }

  log('Email signup successful', { userId: data.user.id });

  // Create buyer profile via edge function
  try {
    const { data: profileData, error: functionError } = await supabase.functions.invoke(
      'create-buyer-profile',
      {
        body: {
          user_id: data.user.id,
          email: email.toLowerCase(),
          full_name: metadata.full_name,
          buyer_company: metadata.buyer_company,
          buyer_role: metadata.buyer_role,
          linkedin_url: metadata.linkedin_url,
          tier: 'basic', // Default tier
          trial_session_id: metadata.trial_session_id, // Link trial to signup
          newsletter_consent: metadata.newsletter_consent ?? false,
        },
      }
    );

    if (functionError) {
      const serverError = await extractEdgeFunctionError(functionError);
      log('Profile creation error', { functionError, serverError });
      throw new Error(`Profile creation failed: ${serverError}`);
    }

    // Also check for application-level errors (supabase.functions.invoke returns
    // HTTP 400/500 responses in data, not in error)
    if (profileData && typeof profileData === 'object' && profileData.success === false) {
      log('Profile creation returned error', profileData);
      throw new Error(`Profile creation failed: ${profileData.error || 'Unknown error'}`);
    }

    log('Buyer profile created successfully');
    return { user: data.user, session: data.session };
  } catch (profileError: any) {
    log('Profile creation failed', profileError);
    throw new Error(profileError.message || 'Failed to create buyer profile');
  }
}

/**
 * Email/Password Signin
 */
export async function signInWithEmail(email: string, password: string) {
  log('Starting email signin', { email });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    log('Email signin error', error);
    throw error;
  }

  log('Email signin successful', { userId: data.user?.id });
  return { user: data.user, session: data.session };
}

/**
 * OAuth Signin (Google)
 * For buyers only - work email validation happens in callback
 */
export async function signInWithOAuth(accountType: 'buyer' = 'buyer', flow: 'signin' | 'signup' = 'signin') {
  log('Starting OAuth flow', { accountType, flow });

  // Store context in sessionStorage (survives redirect on same domain)
  sessionStorage.setItem('oauth_account_type', accountType);
  sessionStorage.setItem('oauth_flow', flow);

  // 🚨 CRITICAL: No URL parameters in OAuth callback (per CLAUDE.md and global rules)
  // Use sessionStorage only - URL params interfere with Supabase PKCE validation
  const callbackUrl = `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      // NO custom state parameter - let Supabase handle PKCE
    },
  });

  if (error) {
    log('OAuth initiation error', error);
    throw error;
  }

  log('OAuth redirect initiated');
  return data;
}

/**
 * Complete OAuth Profile (Buyer)
 * Called after OAuth callback when user completes profile form
 */
export async function completeOAuthProfile(
  userId: string,
  email: string,
  metadata: {
    full_name: string;
    buyer_company?: string;
    buyer_role?: string;
    linkedin_url?: string;
    trial_session_id?: string; // From trial flow
    newsletter_consent?: boolean;
  },
  session?: any
) {
  log('Completing OAuth profile for buyer', { userId, email });

  // Create buyer profile via edge function
  try {
    const { data: profileData, error: functionError } = await supabase.functions.invoke(
      'create-buyer-profile',
      {
        body: {
          user_id: userId,
          email: email.toLowerCase(),
          full_name: metadata.full_name,
          buyer_company: metadata.buyer_company,
          buyer_role: metadata.buyer_role,
          linkedin_url: metadata.linkedin_url,
          tier: 'basic', // Default tier
          trial_session_id: metadata.trial_session_id, // Link trial to signup
          newsletter_consent: metadata.newsletter_consent ?? false,
        },
      }
    );

    if (functionError) {
      const serverError = await extractEdgeFunctionError(functionError);
      log('OAuth profile creation error', { functionError, serverError });
      throw new Error(`Profile creation failed: ${serverError}`);
    }

    // Check for application-level errors (HTTP 400/500 returned in data, not error)
    if (profileData && typeof profileData === 'object' && profileData.success === false) {
      log('OAuth profile creation returned error', profileData);
      throw new Error(`Profile creation failed: ${profileData.error || 'Unknown error'}`);
    }

    log('OAuth buyer profile created successfully');

    // Update metadata with account_type (use provided session if available)
    if (session?.access_token) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { account_type: 'buyer', newsletter_consent: metadata.newsletter_consent ?? false },
      });
      if (updateError) {
        // Log but don't throw - profile was created successfully, metadata update is secondary
        log('Account type metadata update failed', updateError);
        console.warn('Failed to update account_type metadata:', updateError.message);
      } else {
        log('Account type metadata updated');
      }
    }

    return { success: true };
  } catch (profileError: any) {
    log('OAuth profile creation failed', profileError);
    throw new Error(profileError.message || 'Failed to create buyer profile');
  }
}

/**
 * Sign Out
 */
export async function signOut() {
  log('Signing out');

  const { error } = await supabase.auth.signOut();

  if (error) {
    log('Sign out error', error);
    throw error;
  }

  // Clear session storage
  sessionStorage.removeItem('oauth_account_type');
  sessionStorage.removeItem('oauth_flow');

  log('Sign out successful');
}

/**
 * Check if profile exists in user_buyers table
 * With timeout protection to prevent OAuth callback hangs
 */
export async function checkBuyerProfileExists(userId: string): Promise<boolean> {
  log('Checking buyer profile existence', { userId });

  try {
    const result = await withTimeout(
      supabase
        .from('user_buyers')
        .select('id')
        .eq('id', userId)
        .maybeSingle() as unknown as Promise<any>,
      AUTH_TIMEOUT_MS,
      'Profile existence check'
    );

    const { data, error } = result as any;

    if (error) {
      log('Profile check error', error);
      return false;
    }

    const exists = !!data;
    log('Profile existence check', { exists });
    return exists;
  } catch (error: any) {
    log('Profile check failed', error);
    // Fail-safe: Return false on timeout or error
    // OAuth flow will treat user as new and redirect to signup
    return false;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Password reset request
 */
export async function resetPassword(email: string) {
  log('Requesting password reset', { email });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    log('Password reset error', error);
    throw error;
  }

  log('Password reset email sent');
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  log('Updating password');

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    log('Password update error', error);
    throw error;
  }

  log('Password updated successfully');
}
