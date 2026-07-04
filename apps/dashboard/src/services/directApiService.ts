// Direct API service using fetch instead of Supabase JS library
// This bypasses potential hanging issues with the Supabase JS client

import { supabase } from '@/lib/supabase';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Xvhpwj9CpHUOIeFAJHm3ZQ_WdQvqJDS';

let sessionAccessToken: string | null = null;

// Session expiration handling
let sessionValidationInProgress: Promise<boolean> | null = null;
let sessionExpiredHandled = false; // Prevent multiple redirects per page load

export function setDirectApiAccessToken(token: string | null) {
  sessionAccessToken = token;
}

/**
 * Verifies if the session is truly expired by checking multiple times
 * Prevents false positives and handles race conditions
 */
async function verifySessionExpired(): Promise<boolean> {
  // Prevent concurrent validation checks
  if (sessionValidationInProgress) {
    console.log('🔄 Session validation already in progress, waiting for result...');
    return sessionValidationInProgress;
  }

  // Prevent handling same expiration multiple times
  if (sessionExpiredHandled) {
    console.log('⚠️ Session expiration already handled, skipping');
    return true;
  }

  const validation = async (): Promise<boolean> => {
    console.log('🔍 Verifying session expiration with 2 checks...');

    // Check session validity twice with small delay
    for (let i = 0; i < 2; i++) {
      try {
        const { data } = await supabase.auth.getSession();

        if (data?.session) {
          console.log(`✅ Session valid on check ${i + 1}/2`);
          return false; // Session is valid
        }

        // Wait 200ms before next check (avoid false positives)
        if (i < 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      } catch (error) {
        console.warn(`⚠️ Session check ${i + 1} failed:`, error);
        // Continue to next check
      }
    }

    console.log('❌ Session definitely expired after 2 checks');
    sessionExpiredHandled = true; // Set flag to prevent multiple redirects
    return true; // Definitely expired
  };

  sessionValidationInProgress = validation();
  const result = await sessionValidationInProgress;
  sessionValidationInProgress = null;
  return result;
}

// Helper function to make direct API calls
async function makeDirectApiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${sessionAccessToken ?? SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const { headers: optionHeaders, method, ...restOptions } = options;
  const mergedHeaders = {
    ...defaultHeaders,
    ...(optionHeaders as Record<string, string> | undefined)
  };

  if (import.meta.env.DEV) {
    console.log('[DirectAPI] request', {
      endpoint,
      method: method ?? 'GET',
      hasSessionToken: !!sessionAccessToken
    });
  }

  const response = await fetch(url, {
    method: method ?? 'GET',
    headers: mergedHeaders,
    ...restOptions
  });

  // Handle JWT expiration (401 Unauthorized)
  if (response.status === 401) {
    const errorText = await response.text();

    // Only handle if it's JWT expired (not other 401 auth errors)
    if (errorText.includes('JWT expired') || errorText.includes('PGRST301')) {
      console.log('🔐 JWT expired detected, verifying session...');

      const isExpired = await verifySessionExpired();

      if (isExpired) {
        console.log('🚪 Session confirmed expired, forcing logout...');

        try {
          // Dynamically import toast to avoid circular dependencies
          const { toast } = await import('@/hooks/use-toast');
          toast({
            title: 'Session Expired',
            description: 'Signing you out for security...',
            variant: 'destructive'
          });

          // Wait for user to see the toast
          await new Promise(r => setTimeout(r, 1500));

          // Force logout (will redirect via useAuth)
          await supabase.auth.signOut();
        } catch (toastError) {
          console.warn('⚠️ Could not show toast, proceeding with logout:', toastError);
          // Still logout even if toast fails
          await supabase.auth.signOut();
        }

        throw new Error('Session expired - please sign in again');
      } else {
        console.log('✅ Session still valid, treating as temporary auth error');
      }
    }

    // If not JWT expired or session still valid, throw normal error
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

export const directApiService = {
  // Get title by ID
  async getTitleById(titleId: string) {
    console.log('🔧 DIRECT API SERVICE: Fetching title by ID:', titleId);
    try {
      // Query: Get the title data
      const data = await makeDirectApiCall(`titles?select=*&title_id=eq.${titleId}&limit=1`);
      if (data.length === 0) {
        throw new Error('Title not found');
      }

      const title = data[0];
      console.log('✅ DIRECT API SERVICE: Successfully fetched title:', title.title_name_en || title.title_name_kr);
      return title;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch title by ID:', error);
      throw error;
    }
  },

  // Get user favorites
  async getUserFavorites(userId: string) {
    console.log('🔧 DIRECT API SERVICE: Fetching user favorites for:', userId);
    try {
      const data = await makeDirectApiCall(`user_favorites?select=*,titles(*)&user_id=eq.${userId}&order=created_at.desc`);
      console.log('✅ DIRECT API SERVICE: Successfully fetched', data.length, 'favorites');
      return data;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch user favorites:', error);
      throw error;
    }
  },

  // Check if title is favorited by user
  async isTitleFavorited(userId: string, titleId: string) {
    console.log('🔧 DIRECT API SERVICE: Checking if title is favorited:', { userId, titleId });
    try {
      const data = await makeDirectApiCall(`user_favorites?select=id&user_id=eq.${userId}&title_id=eq.${titleId}&limit=1`);
      const isFavorited = data.length > 0;
      console.log('✅ DIRECT API SERVICE: Title favorited status:', isFavorited);
      return isFavorited;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to check favorite status:', error);
      throw error;
    }
  },

  // Add title to favorites
  async addToFavorites(userId: string, titleId: string) {
    console.log('🔧 DIRECT API SERVICE: Adding to favorites:', { userId, titleId });
    try {
      const data = await makeDirectApiCall('user_favorites', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, title_id: titleId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ DIRECT API SERVICE: Successfully added to favorites');
      return data[0];
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to add to favorites:', error);
      throw error;
    }
  },

  // Remove title from favorites
  async removeFromFavorites(userId: string, titleId: string) {
    console.log('🔧 DIRECT API SERVICE: Removing from favorites:', { userId, titleId });
    try {
      await makeDirectApiCall(`user_favorites?user_id=eq.${userId}&title_id=eq.${titleId}`, {
        method: 'DELETE'
      });
      console.log('✅ DIRECT API SERVICE: Successfully removed from favorites');
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to remove from favorites:', error);
      throw error;
    }
  },

  // Get featured titles
  async getFeaturedTitles() {
    console.log('🔧 DIRECT API SERVICE: Fetching featured titles...');
    try {
      const data = await makeDirectApiCall(`featured?select=*,titles(
        title_id,
        title_name_en,
        title_name_kr,
        title_image,
        tagline,
        genre,
        content_format,
        story_author,
        pitch,
        tone,
        comps,
        synopsis,
        verified
      )&order=created_at.desc`);
      console.log('✅ DIRECT API SERVICE: Successfully fetched', data.length, 'featured titles');
      return data;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch featured titles:', error);
      throw error;
    }
  }
};

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).directApiService = directApiService;
}
