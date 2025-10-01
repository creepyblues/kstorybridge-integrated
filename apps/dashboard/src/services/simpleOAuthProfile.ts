/**
 * Simple OAuth Profile Service
 *
 * A lightweight approach to OAuth profile creation that focuses on
 * working around session timeout issues during OAuth callback flow.
 *
 * Updated: Edge function approach implemented for reliable server-side profile creation
 */

import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export interface SimpleProfileResult {
  success: boolean;
  error?: string;
  profile?: any;
  userExists?: boolean;
}

/**
 * Wait for a valid session with polling and exponential backoff
 */
async function waitForValidSession(maxAttempts = 60, initialDelay = 500): Promise<Session | null> {
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session && session.user) {
        const elapsedTime = Date.now() - startTime;

        // Log performance warning if slow
        if (elapsedTime > 5000) {
          console.warn(`⚠️ OAuth session establishment took ${elapsedTime}ms - consider optimizing`);
        }

        return session;
      }

      if (error && attempt > 5) {
        console.warn(`⚠️ Session check error:`, error.message);
      }

      // Exponential backoff with jitter
      const delay = Math.min(initialDelay * Math.pow(1.5, attempt - 1), 3000);
      const jitter = Math.random() * 100; // Add up to 100ms jitter

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }

    } catch (error) {
      if (attempt > 5) {
        console.error(`❌ Session polling failed:`, error);
      }

      if (attempt < maxAttempts) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  const totalTime = Date.now() - startTime;
  console.error(`❌ Failed to establish session after ${maxAttempts} attempts (${Math.round(totalTime / 1000)}s)`);

  return null;
}

/**
 * Simple buyer profile creation for OAuth users
 * Focuses on working around getSession timeouts
 */
export async function createSimpleOAuthBuyerProfile(profileData: {
  id: string;
  email: string;
  full_name: string;
  buyer_company: string;
  buyer_role: string;
  linkedin_url?: string | null;
  tier?: string;
  requested?: boolean;
}): Promise<SimpleProfileResult> {
  try {
    // 🔧 EDGE FUNCTION APPROACH: Use server-side edge function for reliable profile creation
    try {
      // Wait for valid session to get access token
      const session = await waitForValidSession();

      if (!session) {
        console.error('❌ Failed to establish valid session for edge function call');
        return {
          success: false,
          error: 'Session establishment failed. Please try signing in again.'
        };
      }

      // Call the unified OAuth profile creation edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
      const response = await fetch(`${supabaseUrl}/functions/v1/create-oauth-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_type: 'buyer',
          user_id: profileData.id,
          profile_data: profileData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Edge function failed:', result);
        throw new Error(result.error || 'Edge function call failed');
      }

      return {
        success: true,
        profile: result.profile,
        userExists: result.userExists || false
      };
    } catch (edgeError) {
      console.error('❌ Edge function failed, falling back to session polling:', edgeError);
      // Fall through to session polling approach
    }

    // Fallback: Wait for valid session before attempting profile creation
    const session = await waitForValidSession();

    if (!session) {
      console.error('❌ Failed to establish valid session within timeout period');
      return {
        success: false,
        error: 'Session establishment failed. Please try signing in again.'
      };
    }

    // Prepare profile data
    const profileToCreate = {
      id: profileData.id,
      email: profileData.email.toLowerCase(),
      full_name: profileData.full_name,
      buyer_company: profileData.buyer_company,
      buyer_role: profileData.buyer_role,
      linkedin_url: profileData.linkedin_url || null,
      tier: profileData.tier || 'basic',
      requested: profileData.requested || false,
      created_at: new Date().toISOString()
    };

    // Try to create the profile directly

    const { data: newProfile, error: createError } = await supabase
      .from('user_buyers')
      .insert(profileToCreate)
      .select()
      .single();

    if (createError) {
      // If it's a duplicate key error, the profile might have been created by triggers
      if (createError.code === '23505') {
        const { data: conflictProfile, error: conflictError } = await supabase
          .from('user_buyers')
          .select('*')
          .eq('id', profileData.id)
          .single();

        if (!conflictError && conflictProfile) {
          return {
            success: true,
            profile: conflictProfile,
            userExists: true
          };
        }
      }

      // RLS policy violations should now be handled by enhanced OAuth-friendly policies
      if (createError.code === '42501' || createError.message?.includes('row-level security')) {
        console.error('🚨 RLS policy violation - check OAuth-friendly policies are applied');
        return {
          success: false,
          error: `Profile creation failed due to permission issue. Please try again.`
        };
      }

      console.error('❌ Profile creation failed:', createError);
      return {
        success: false,
        error: `Profile creation failed: ${createError.message}. Your account may have been created - try signing in.`
      };
    }

    return {
      success: true,
      profile: newProfile,
      userExists: false
    };

  } catch (error) {
    console.error('❌ Simple OAuth profile creation error:', error);
    return {
      success: false,
      error: `Account creation encountered an issue: ${error instanceof Error ? error.message : 'Unknown error'}. Please try signing in.`
    };
  }
}

/**
 * Simple creator profile creation for OAuth users
 */
export async function createSimpleOAuthCreatorProfile(profileData: {
  id: string;
  email: string;
  full_name: string;
  pen_name: string;
  ip_owner_role?: string | null;
  ip_owner_company?: string | null;
  website_url?: string | null;
}): Promise<SimpleProfileResult> {
  try {
    // 🔧 EDGE FUNCTION APPROACH: Use server-side edge function for reliable profile creation
    try {
      // Wait for valid session to get access token
      const session = await waitForValidSession();

      if (!session) {
        console.error('❌ Failed to establish valid session for edge function call');
        return {
          success: false,
          error: 'Session establishment failed. Please try signing in again.'
        };
      }

      // Call the unified OAuth profile creation edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
      const response = await fetch(`${supabaseUrl}/functions/v1/create-oauth-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_type: 'creator',
          user_id: profileData.id,
          profile_data: profileData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Edge function failed:', result);
        throw new Error(result.error || 'Edge function call failed');
      }

      return {
        success: true,
        profile: result.profile,
        userExists: result.userExists || false
      };
    } catch (edgeError) {
      console.error('❌ Edge function failed, falling back to session polling:', edgeError);
      // Fall through to session polling approach
    }

    // Fallback: Wait for valid session before attempting any operations
    const session = await waitForValidSession();

    if (!session) {
      console.error('❌ Failed to establish valid session within timeout period');
      return {
        success: false,
        error: 'Session establishment failed. Please try signing in again.'
      };
    }

    // First, check if profile already exists
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_creators')
        .select('*')
        .eq('email', profileData.email.toLowerCase())
        .maybeSingle();

      if (!checkError && existingProfile) {
        return {
          success: true,
          profile: existingProfile,
          userExists: true
        };
      }
    } catch (checkException) {
      console.warn('⚠️ Profile check failed, proceeding with creation:', checkException);
    }

    // Prepare profile data
    const profileToCreate = {
      id: profileData.id,
      email: profileData.email.toLowerCase(),
      full_name: profileData.full_name,
      pen_name: profileData.pen_name,
      ip_owner_role: profileData.ip_owner_role,
      ip_owner_company: profileData.ip_owner_company,
      website_url: profileData.website_url,
      invitation_status: 'invited',
      created_at: new Date().toISOString()
    };

    // Try to create the profile directly
    const { data: newProfile, error: createError } = await supabase
      .from('user_creators')
      .insert(profileToCreate)
      .select()
      .single();

    if (createError) {
      // If it's a duplicate key error, the profile might have been created by triggers
      if (createError.code === '23505') {
        const { data: conflictProfile, error: conflictError } = await supabase
          .from('user_creators')
          .select('*')
          .eq('id', profileData.id)
          .single();

        if (!conflictError && conflictProfile) {
          return {
            success: true,
            profile: conflictProfile,
            userExists: true
          };
        }
      }

      // RLS policy violations should now be handled by enhanced OAuth-friendly policies
      if (createError.code === '42501' || createError.message?.includes('row-level security')) {
        console.error('🚨 RLS policy violation for creator - check OAuth-friendly policies are applied');
        return {
          success: false,
          error: `Creator profile creation failed due to permission issue. Please try again.`
        };
      }

      console.error('❌ Creator profile creation failed:', createError);
      return {
        success: false,
        error: `Creator profile creation failed: ${createError.message}. Your account may have been created - try signing in.`
      };
    }

    return {
      success: true,
      profile: newProfile,
      userExists: false
    };

  } catch (error) {
    console.error('❌ Simple OAuth creator profile creation error:', error);
    return {
      success: false,
      error: `Creator account creation encountered an issue: ${error instanceof Error ? error.message : 'Unknown error'}. Please try signing in.`
    };
  }
}