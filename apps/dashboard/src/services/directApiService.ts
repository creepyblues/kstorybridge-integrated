// Direct API service using fetch instead of Supabase JS library
// This bypasses the hanging Supabase JS client configuration issues

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

let sessionAccessToken: string | null = null;

export function setDirectApiAccessToken(token: string | null) {
  sessionAccessToken = token;
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
      const data = await makeDirectApiCall(`titles?select=*&title_id=eq.${titleId}&limit=1`);
      if (data.length === 0) {
        throw new Error('Title not found');
      }
      console.log('✅ DIRECT API SERVICE: Successfully fetched title:', data[0].title_name_en || data[0].title_name_kr);
      return data[0];
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
