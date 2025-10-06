/**
 * OAuth Profile Creation via Edge Function
 *
 * **WHEN TO USE**: OAuth signup flows ONLY (Google, Discord, etc.)
 *
 * This service provides secure profile creation for OAuth flows by calling
 * the Supabase Edge Function instead of using browser-side service role credentials.
 *
 * Architecture: Browser → Edge Function → Service Role → Profile Created
 *
 * Key Features:
 * - No browser-side service role key needed (secure)
 * - Same behavior across all environments (local, staging, production)
 * - Eliminates "Multiple GoTrueClient instances" warning
 * - Fast and reliable (edge function optimized)
 *
 * Migration from simpleOAuthProfile.ts:
 * - OLD: Browser → supabaseServiceRole → Direct DB write (security risk)
 * - NEW: Browser → Edge Function → Service Role → DB write (secure)
 */

import { supabase } from '@/integrations/supabase/client';

export interface EdgeFunctionProfileResult {
  success: boolean;
  error?: string;
  profile?: any;
  userExists?: boolean;
}

/**
 * Create OAuth profile via secure edge function
 *
 * @param accountType - 'buyer' or 'creator'
 * @param userId - Authenticated user's ID
 * @param profileData - Profile fields matching database schema
 * @param existingSession - Optional session to use (avoids getSession call that can hang)
 * @returns Profile creation result
 */
export async function createOAuthProfileViaEdgeFunction(
  accountType: 'buyer' | 'creator',
  userId: string,
  profileData: any,
  existingSession?: any
): Promise<EdgeFunctionProfileResult> {
  try {
    // Use provided session or get current session
    let session = existingSession;

    if (!session) {
      const { data: { session: fetchedSession } } = await supabase.auth.getSession();
      session = fetchedSession;
    }

    if (!session) {
      throw new Error('No active session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    console.log('🚀 OAuth Profile: Using secure edge function approach', {
      accountType,
      userId: userId.substring(0, 8),
      email: profileData.email
    });

    // Call edge function with user's auth token
    const response = await fetch(`${supabaseUrl}/functions/v1/create-oauth-profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account_type: accountType,
        user_id: userId,
        profile_data: profileData
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    console.log('✅ OAuth Profile: Edge function succeeded', {
      success: result.success,
      userExists: result.userExists,
      hasProfile: !!result.profile
    });

    return {
      success: result.success,
      error: result.error,
      profile: result.profile,
      userExists: result.userExists
    };
  } catch (error) {
    console.error('❌ OAuth Profile: Edge function failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
