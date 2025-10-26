import { supabase } from './supabase';

const DEBUG = import.meta.env.VITE_AUTH_DEBUG === 'true';

const log = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[Auth Service] ${message}`, data || '');
  }
};

/**
 * Consumer email domains to block for buyer signups
 * Buyers must use work email addresses
 */
const CONSUMER_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'yandex.com',
  'zoho.com',
];

/**
 * Validate email is not from a consumer domain (buyers only)
 */
function validateWorkEmail(email: string): void {
  const domain = email.split('@')[1]?.toLowerCase();
  if (CONSUMER_EMAIL_DOMAINS.includes(domain)) {
    throw new Error('Please use a work email address. Personal email domains are not allowed for buyer accounts.');
  }
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
  }
) {
  log('Starting email signup for buyer', { email });

  // Validate work email
  validateWorkEmail(email);

  // Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        account_type: 'buyer', // ✅ Set during signup
        full_name: metadata.full_name,
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
    const { error: functionError } = await supabase.functions.invoke(
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
        },
      }
    );

    if (functionError) {
      log('Profile creation error', functionError);
      throw new Error(`Profile creation failed: ${functionError.message}`);
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

  // Redirect URL with account_type and flow as URL parameters
  const callbackUrl = `${window.location.origin}/auth/callback?account_type=${accountType}&flow=${flow}`;

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
  },
  session?: any
) {
  log('Completing OAuth profile for buyer', { userId, email });

  // Validate work email
  validateWorkEmail(email);

  // Create buyer profile via edge function
  try {
    const { error: functionError } = await supabase.functions.invoke(
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
        },
      }
    );

    if (functionError) {
      log('OAuth profile creation error', functionError);
      throw new Error(`Profile creation failed: ${functionError.message}`);
    }

    log('OAuth buyer profile created successfully');

    // Update metadata with account_type (use provided session if available)
    if (session?.access_token) {
      await supabase.auth.updateUser({
        data: { account_type: 'buyer' },
      });
      log('Account type metadata updated');
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
 */
export async function checkBuyerProfileExists(userId: string): Promise<boolean> {
  log('Checking buyer profile existence', { userId });

  try {
    const { data, error } = await supabase
      .from('user_buyers')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      log('Profile check error', error);
      return false;
    }

    const exists = !!data;
    log('Profile existence check', { exists });
    return exists;
  } catch (error) {
    log('Profile check failed', error);
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
