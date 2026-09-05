import { supabase } from './supabase';
import { recordSessionActivity } from './sessionInactivity';
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

/** Result of a profile-existence lookup. Never collapse 'error' into 'missing'. */
export type ProfileLookup = 'exists' | 'missing' | 'error';

/**
 * Supabase auth error for an email that already has an account.
 * Only seen when enumeration protection is OFF; hosted currently has it ON.
 */
export function isDuplicateSignupError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === 'user_already_exists' || /already (registered|exists)/i.test(error.message || '');
}

/**
 * With enumeration protection ON, signUp() for an existing confirmed email returns
 * a fake user: random id, `identities: []`, no session, no error. A real
 * confirmation-required signup returns `identities.length === 1` (verified against
 * the hosted project 2026-09-05). `session === null` is NOT a discriminator.
 */
export function isObfuscatedDuplicateSignup(user: { identities?: unknown[] | null } | null | undefined): boolean {
  return !!user && Array.isArray(user.identities) && user.identities.length === 0;
}

/**
 * Email/Password Signup for Buyers
 * Sets account_type='buyer' during signup (not after)
 *
 * Returns `{ status: 'duplicate' }` when the email already has an account
 * (explicit error or obfuscated response). The caller must show the same
 * generic copy as a real signup — never reveal that the email exists.
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
    /** Internal path to land on after auth (survives the email-verification tab switch) */
    redirect_after_login?: string;
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
        // The verification link opens in a new tab where sessionStorage is empty,
        // so the intended destination rides along in user metadata too.
        ...(metadata.redirect_after_login ? { redirect_after_login: metadata.redirect_after_login } : {}),
        // Gate 2 handoff: with email confirmation ON there is no session at signup, so
        // the profile is created by create-buyer-profile at the first authenticated
        // moment (verification landing) from this namespace. The edge function
        // revalidates it and clears only this key.
        [PENDING_BUYER_PROFILE_KEY]: {
          full_name: metadata.full_name,
          buyer_company: metadata.buyer_company ?? null,
          buyer_role: metadata.buyer_role ?? null,
          linkedin_url: metadata.linkedin_url ?? null,
          newsletter_consent: metadata.newsletter_consent ?? false,
          trial_session_id: metadata.trial_session_id ?? null,
        },
      },
    },
  });

  if (error) {
    if (isDuplicateSignupError(error)) {
      // Never surface "this email exists" to the browser; the UI shows the same
      // generic "check your email" copy as a real signup.
      log('Email signup: duplicate email (explicit error)');
      return { status: 'duplicate' as const, user: null, session: null };
    }
    log('Email signup error', error);
    throw error;
  }

  if (!data.user) {
    throw new Error('Signup failed - no user returned');
  }

  if (isObfuscatedDuplicateSignup(data.user)) {
    // Hosted Supabase (enumeration protection on) returns a fake user with a random
    // id and identities: [] for an existing email. Do NOT call the profile edge
    // function with that id.
    log('Email signup: duplicate email (obfuscated response)');
    return { status: 'duplicate' as const, user: null, session: null };
  }

  log('Email signup successful', { userId: data.user.id });

  if (!data.session) {
    // Email confirmation required: no JWT yet, so the profile cannot be created here.
    // AuthCallback creates it from pending_buyer_profile when the verification link lands.
    log('Email signup: confirmation pending, profile deferred to verification');
    return { status: 'created' as const, user: data.user, session: null };
  }

  // Confirmation off: we are authenticated right now — create the profile immediately.
  const result = await createBuyerProfileFromPending();
  if (result.status === 'created' || result.status === 'exists') {
    log('Buyer profile created successfully');
    return { status: 'created' as const, user: data.user, session: data.session };
  }
  log('Profile creation failed', result);
  if (result.status === 'conflict') throw new EmailConflictError();
  throw new Error(`Profile creation failed: ${(result as { error?: string }).error || result.status}`);
}

export const PENDING_BUYER_PROFILE_KEY = 'pending_buyer_profile';

/** Another auth user already owns this email in user_buyers. The UI must not enter the app. */
export class EmailConflictError extends Error {
  code = 'EMAIL_CONFLICT' as const;
  constructor() {
    super('This email is already attached to a different KStoryBridge account. Sign in with that account\'s method, or contact support.');
    this.name = 'EmailConflictError';
  }
}

export type ProfileCreateOutcome =
  | { status: 'created' | 'exists'; profile?: Record<string, unknown> }
  | { status: 'conflict' }
  | { status: 'no_data' }
  | { status: 'error'; error?: string };

/**
 * Create the CURRENT user's buyer profile via the JWT-bound edge function.
 * `fields` empty ⇒ the function reads user_metadata.pending_buyer_profile.
 * Never throws; callers branch on `status`.
 */
export async function createBuyerProfileFromPending(fields: Record<string, unknown> = {}): Promise<ProfileCreateOutcome> {
  const { data, error: functionError } = await supabase.functions.invoke('create-buyer-profile', { body: fields });

  if (functionError) {
    // supabase-js surfaces non-2xx as FunctionsHttpError with the Response in context
    const ctx: Response | undefined = (functionError as { context?: Response }).context;
    let payload: { code?: string; error?: string } = {};
    try { payload = ctx ? await ctx.clone().json() : {}; } catch { /* ignore */ }
    if (payload.code === 'EMAIL_CONFLICT') return { status: 'conflict' };
    if (payload.code === 'NO_PROFILE_DATA') return { status: 'no_data' };
    const serverError = payload.error || (await extractEdgeFunctionError(functionError));
    log('Profile creation error', { code: payload.code, serverError });
    return { status: 'error', error: serverError };
  }

  if (data && typeof data === 'object') {
    if (data.success === false) {
      if (data.code === 'EMAIL_CONFLICT') return { status: 'conflict' };
      if (data.code === 'NO_PROFILE_DATA') return { status: 'no_data' };
      return { status: 'error', error: data.error };
    }
    if (data.status === 'created' || data.status === 'exists') return { status: data.status, profile: data.profile };
  }
  return { status: 'error', error: 'Unexpected response' };
}

/**
 * Email/Password Signin
 */
export async function signInWithEmail(email: string, password: string) {
  log('Starting email signin', { email });
  recordSessionActivity();

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
  recordSessionActivity();

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

  // Create buyer profile via the JWT-bound edge function. Identity comes from the
  // session token; only the form fields travel in the body.
  try {
    const result = await createBuyerProfileFromPending({
      full_name: metadata.full_name,
      buyer_company: metadata.buyer_company ?? null,
      buyer_role: metadata.buyer_role ?? null,
      linkedin_url: metadata.linkedin_url ?? null,
      trial_session_id: metadata.trial_session_id ?? null,
      newsletter_consent: metadata.newsletter_consent ?? false,
    });

    if (result.status === 'conflict') {
      throw new EmailConflictError();
    }
    if (result.status !== 'created' && result.status !== 'exists') {
      log('OAuth profile creation error', result);
      throw new Error(`Profile creation failed: ${(result as { error?: string }).error || result.status}`);
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
    if (profileError instanceof EmailConflictError) throw profileError;
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
export async function lookupBuyerProfile(userId: string): Promise<ProfileLookup> {
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
      // NOT "missing": callers must show a retry UI, never route an existing
      // user into profile creation on a failed query.
      log('Profile check error', error);
      return 'error';
    }

    const exists: ProfileLookup = data ? 'exists' : 'missing';
    log('Profile existence check', { exists });
    return exists;
  } catch (error: any) {
    // Timeout or network failure. This is NOT "missing": callers must show a
    // retry UI, never route an existing user into profile creation.
    log('Profile check failed', error);
    return 'error';
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
