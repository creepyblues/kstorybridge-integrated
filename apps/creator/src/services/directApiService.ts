// Direct API service using fetch instead of Supabase JS library
// This bypasses the hanging Supabase JS client configuration issues

import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

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
  // Get all titles
  async getAllTitles() {
    console.log('🔧 DIRECT API SERVICE: Fetching all titles...');
    try {
      const data = await makeDirectApiCall('titles?select=*&order=created_at.desc');
      console.log('✅ DIRECT API SERVICE: Successfully fetched', data.length, 'titles');
      return data;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch titles:', error);
      throw error;
    }
  },

  // Get paginated titles for infinite scroll
  async getPaginatedTitles(limit: number = 12, offset: number = 0, searchQuery?: string) {
    console.log('🔧 DIRECT API SERVICE: Fetching paginated titles...', { limit, offset, searchQuery });
    try {
      let query = `titles?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;

      // Add search filter if provided
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = searchQuery.trim();
        // Search across multiple fields using Supabase text search
        // Note: Using 'keywords' column instead of 'tags' as per database schema
        query += `&or=(title_name_en.ilike.*${searchTerm}*,title_name_kr.ilike.*${searchTerm}*,synopsis.ilike.*${searchTerm}*,genre.cs.{${searchTerm}},keywords.cs.{${searchTerm}})`;
      }

      const data = await makeDirectApiCall(query);
      console.log('✅ DIRECT API SERVICE: Successfully fetched', data.length, 'paginated titles');
      return {
        titles: data,
        hasMore: data.length === limit, // If we got exactly the limit, there might be more
        total: offset + data.length
      };
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch paginated titles:', error);
      throw error;
    }
  },

  // Get enhanced paginated titles with fuzzy search
  async getEnhancedPaginatedTitles(limit: number = 12, offset: number = 0, searchQuery?: string) {
    console.log('🔧 DIRECT API SERVICE: Fetching enhanced paginated titles...', { limit, offset, searchQuery });
    try {
      // For enhanced search, we need to fetch a larger dataset to apply fuzzy matching
      // Then paginate the results after applying enhanced search logic
      const batchSize = Math.max(limit * 8, 100); // Fetch larger batch for better fuzzy matching
      const data = await makeDirectApiCall(`titles?select=*&order=created_at.desc&limit=${batchSize}&offset=0`);

      console.log(`✅ DIRECT API SERVICE: Successfully fetched ${data.length} titles for enhanced search`);
      return {
        titles: data,
        hasMore: data.length === batchSize, // If we got the full batch, there might be more
        total: data.length,
        enhancedSearch: true // Flag to indicate this needs client-side enhanced search processing
      };
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch enhanced paginated titles:', error);
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
        synopsis
      )&order=created_at.desc`);
      console.log('✅ DIRECT API SERVICE: Successfully fetched', data.length, 'featured titles');
      return data;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch featured titles:', error);
      throw error;
    }
  },

  // Get title by ID
  async getTitleById(titleId: string) {
    console.log('🔧 DIRECT API SERVICE: Fetching title by ID:', titleId);
    try {
      // Query 1: Get the title data
      const data = await makeDirectApiCall(`titles?select=*&title_id=eq.${titleId}&limit=1`);
      if (data.length === 0) {
        throw new Error('Title not found');
      }

      const title = data[0];

      // Query 2: Try to get pitch analysis (may not exist for all titles)
      console.log('📊 DIRECT API SERVICE: Attempting to fetch pitch analysis for:', titleId);
      try {
        const analysisData = await makeDirectApiCall(`title_content_analysis?select=pitch_analysis&title_id=eq.${titleId}&limit=1`);

        if (analysisData.length > 0 && analysisData[0].pitch_analysis) {
          // Attach pitch_analysis to the title object if it exists
          title.pitch_analysis = analysisData[0].pitch_analysis;
          console.log('📊 DIRECT API SERVICE: Pitch analysis data included');
        } else {
          console.log('📊 DIRECT API SERVICE: No pitch analysis found (this is normal)');
        }
      } catch (analysisError) {
        // Not an error if pitch analysis doesn't exist - most titles won't have it
        console.log('📊 DIRECT API SERVICE: No pitch analysis found for this title (this is normal)');
      }

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

  // Get buyer profile by email
  async getBuyerProfile(email: string) {
    console.log('🔧 DIRECT API SERVICE: Fetching buyer profile for:', email);
    try {
      const data = await makeDirectApiCall(`user_buyers?select=*&email=eq.${email}&limit=1`);
      if (data.length === 0) {
        throw new Error('Buyer profile not found');
      }
      console.log('✅ DIRECT API SERVICE: Successfully fetched buyer profile:', data[0].full_name);
      return data[0];
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch buyer profile:', error);
      throw error;
    }
  },

  // Get creator profile by email
  async getCreatorProfile(email: string) {
    console.log('🔧 DIRECT API SERVICE: Fetching creator profile for:', email);
    try {
      const data = await makeDirectApiCall(`user_creators?select=*&email=eq.${email}&limit=1`);
      if (data.length === 0) {
        throw new Error('Creator profile not found');
      }
      console.log('✅ DIRECT API SERVICE: Successfully fetched creator profile:', data[0].full_name);
      return data[0];
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch creator profile:', error);
      throw error;
    }
  },

  // Get creator profile by ID
  async getCreatorById(id: string) {
    console.log('🔧 DIRECT API SERVICE: Fetching creator profile by ID:', id);
    try {
      const data = await makeDirectApiCall(`user_creators?select=*&id=eq.${id}&limit=1`);
      if (data.length === 0) {
        console.log('⚠️ DIRECT API SERVICE: Creator profile not found for ID:', id);
        return null;
      }
      console.log('✅ DIRECT API SERVICE: Successfully fetched creator profile:', data[0].full_name);
      return data[0];
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch creator profile by ID:', error);
      throw error;
    }
  },

  // Get user tier (for buyers)
  async getUserTier(userId: string) {
    console.log('🔧 DIRECT API SERVICE: Fetching user tier for:', userId);
    try {
      const data = await makeDirectApiCall(`user_buyers?select=tier&id=eq.${userId}&limit=1`);
      const tier = data.length > 0 ? data[0].tier : 'basic';
      console.log('✅ DIRECT API SERVICE: User tier:', tier);
      return tier;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch user tier:', error);
      // Default to basic tier if query fails
      return 'basic';
    }
  },

  async updateBuyerProfile(userId: string, updates: Record<string, unknown>) {
    console.log('🔧 DIRECT API SERVICE: Updating buyer profile:', { userId, updates });
    try {
      const data = await makeDirectApiCall(`user_buyers?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      console.log('✅ DIRECT API SERVICE: Buyer profile updated');
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to update buyer profile:', error);
      throw error;
    }
  },

  async updateCreatorProfile(userId: string, updates: Record<string, unknown>) {
    console.log('🔧 DIRECT API SERVICE: Updating creator profile:', { userId, updates });
    try {
      const data = await makeDirectApiCall(`user_creators?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      console.log('✅ DIRECT API SERVICE: Creator profile updated');
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to update creator profile:', error);
      throw error;
    }
  },

  async createTitle(payload: Record<string, unknown>) {
    console.log('🔧 DIRECT API SERVICE: Creating title', payload);
    try {
      const data = await makeDirectApiCall('titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      console.log('✅ DIRECT API SERVICE: Title created');
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to create title:', error);
      throw error;
    }
  },

  async updateTitle(titleId: string, updates: Record<string, unknown>) {
    console.log('🔧 DIRECT API SERVICE: Updating title', { titleId, updates });
    try {
      const data = await makeDirectApiCall(`titles?title_id=eq.${titleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      console.log('✅ DIRECT API SERVICE: Title updated');
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to update title:', error);
      throw error;
    }
  },

  async getTitlesByCreator(userId: string) {
    console.log('🔧 DIRECT API SERVICE: Fetching titles for creator:', userId);
    try {
      const data = await makeDirectApiCall(`titles?select=*&creator_id=eq.${userId}&order=created_at.desc`);
      console.log('✅ DIRECT API SERVICE: Fetched', Array.isArray(data) ? data.length : 0, 'creator titles');
      return data || [];
    } catch (error) {
      console.error('❌ DIRECT API SERVICE: Failed to fetch creator titles:', error);
      throw error;
    }
  }
};

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).directApiService = directApiService;
}
