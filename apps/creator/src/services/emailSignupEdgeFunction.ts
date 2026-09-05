/**
 * Email Signup Edge Function Integration
 *
 * **WHEN TO USE**: Email/password signup flows ONLY
 *
 * This service provides secure profile creation for email signup flows by calling
 * Supabase Edge Functions with service role access (server-side).
 *
 * Architecture: Browser → Edge Function → Service Role → Profile Created
 *
 * Key Features:
 * - Uses anon key (no session needed during signup)
 * - Server-side service role bypasses RLS
 * - Consistent with OAuth edge function pattern
 * - Proper error handling and validation
 * - Retry logic for network failures
 *
 * Difference from OAuth:
 * - OAuth: Uses session token (user already authenticated)
 * - Email: Uses anon key (user not authenticated yet - verification pending)
 */

/**
 * Fetch with exponential backoff retry logic
 * Retries on network errors and 5xx server errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Retry on 5xx errors (server errors)
      if (response.status >= 500 && attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt) // 1s, 2s, 4s
        console.warn(`⚠️ Server error (${response.status}), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      return response
    } catch (error) {
      // Retry on network errors
      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt) // 1s, 2s, 4s
        console.warn(`⚠️ Network error, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`, error)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }

  throw new Error('Max retries exceeded')
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
  newsletter_consent?: boolean;
}

export interface EdgeFunctionResult {
  success: boolean;
  error?: string;
  profile?: any;
  message?: string;
}

/**
 * Create buyer profile via edge function (email signup)
 *
 * @param profileData - Buyer profile fields matching database schema
 * @returns Profile creation result
 */
export async function createBuyerViaEdgeFunction(
  profileData: BuyerProfileData
): Promise<EdgeFunctionResult> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('🚀 Email Signup: Creating buyer profile via edge function', {
      userId: profileData.id.substring(0, 8),
      email: profileData.email
    });

    const response = await fetchWithRetry(
      `${supabaseUrl}/functions/v1/create-buyer-profile`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          userId: profileData.id,
          email: profileData.email,
          fullName: profileData.full_name,
          buyerCompany: profileData.buyer_company,
          buyerRole: profileData.buyer_role,
          linkedinUrl: profileData.linkedin_url || null,
          tier: profileData.tier || 'basic',
          requested: profileData.requested || false
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Email Signup: Edge function failed:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    console.log('✅ Email Signup: Buyer profile created successfully via edge function', {
      success: result.success,
      message: result.message
    });

    return {
      success: true,
      profile: result.profile,
      message: result.message
    };
  } catch (error) {
    console.error('❌ Email Signup: Buyer edge function error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create creator profile via edge function (email signup)
 *
 * @param profileData - Creator profile fields matching database schema
 * @returns Profile creation result
 */
export async function createCreatorViaEdgeFunction(
  profileData: CreatorProfileData,
  accessToken: string
): Promise<EdgeFunctionResult> {
  return callCreatorProfileFunction(
    {
      fullName: profileData.full_name,
      penName: profileData.pen_name,
      ipOwnerRole: profileData.ip_owner_role,
      ipOwnerCompany: profileData.ip_owner_company || null,
      websiteUrl: profileData.website_url || null,
      newsletterConsent: profileData.newsletter_consent ?? false,
    },
    accessToken
  );
}

export type ProfileFunctionStatus = 'created' | 'exists';
export type ProfileFunctionCode = 'EMAIL_CONFLICT' | 'AUTH_REQUIRED' | 'INVALID_INPUT' | 'NO_PROFILE_DATA' | 'INSERT_FAILED' | 'INTERNAL' | string;

export interface ProfileFunctionResult extends EdgeFunctionResult {
  status?: ProfileFunctionStatus;
  code?: ProfileFunctionCode;
}

/**
 * Call create-creator-profile as the AUTHENTICATED user (Gate 2).
 *
 * The edge function derives id/email from the JWT. `fields` may be empty — the
 * function then reads user_metadata.pending_creator_profile (email signup handoff).
 * 409 EMAIL_CONFLICT means another auth user already owns this email; callers must
 * not proceed into the app on that.
 */
export async function callCreatorProfileFunction(
  fields: Record<string, unknown>,
  accessToken: string
): Promise<ProfileFunctionResult> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!accessToken) {
      return { success: false, code: 'AUTH_REQUIRED', error: 'No session' };
    }

    const response = await fetchWithRetry(
      `${supabaseUrl}/functions/v1/create-creator-profile`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(fields)
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('❌ Creator profile edge function failed:', response.status, result?.code);
      return {
        success: false,
        code: result?.code || `HTTP_${response.status}`,
        error: result?.error || `HTTP ${response.status}`
      };
    }

    console.log('✅ Creator profile edge function:', result.status);
    return { success: true, status: result.status, profile: result.profile, message: result.message };
  } catch (error) {
    console.error('❌ Creator profile edge function error:', error);
    return { success: false, code: 'NETWORK', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
