
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type UserFavorite = Tables<"user_favorites">;
export type UserFavoriteInsert = TablesInsert<"user_favorites">;

// Check if we should use mock data for localhost development
const shouldUseMockData = () => {
  const isLocalhost = window.location.hostname === 'localhost';
  const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
  const isDev = import.meta.env.DEV;
  
  return isLocalhost && bypassEnabled && isDev;
};

// Mock favorites data for localhost development
const mockFavorites = [
  {
    id: "fav-1",
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    title_id: "1",
    created_at: "2024-01-15T10:30:00Z",
    titles: {
      title_id: "1",
      title_name_en: "Mystic Academy Chronicles",
      title_name_kr: "신비한 아카데미 연대기",
      genre: ["Fantasy"],
      author: "Kim Min-jun",
      synopsis: "A young student discovers magical powers at a prestigious academy where ancient secrets lurk in every corner. Join the adventure as mysteries unfold and friendships are tested.",
      title_image: "/covers/mystic-academy.jpg",
      rating: 4.8,
      views: 25400,
      likes: 3200,
      content_format: "Webtoon",
      tags: ["Magic", "School Life", "Adventure", "Coming of Age"],
      creator_id: "550e8400-e29b-41d4-a716-446655440000",
      rights: "550e8400-e29b-41d4-a716-446655440000",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    }
  },
  {
    id: "fav-2",
    user_id: "550e8400-e29b-41d4-a716-446655440000", 
    title_id: "3",
    created_at: "2024-01-12T14:20:00Z",
    titles: {
      title_id: "3",
      title_name_en: "Digital Detective",
      title_name_kr: "디지털 탐정",
      genre: ["Mystery"],
      author: "Lee Hyun-woo",
      synopsis: "In a cyberpunk future, a detective uses AI and virtual reality to solve crimes that blur the line between digital and physical reality.",
      title_image: "/covers/digital-detective.jpg", 
      rating: 4.7,
      views: 31500,
      likes: 4100,
      content_format: "Webtoon",
      tags: ["Cyberpunk", "Mystery", "Technology", "Thriller"],
      creator_id: "550e8400-e29b-41d4-a716-446655440000",
      rights: "550e8400-e29b-41d4-a716-446655440000",
      created_at: "2024-01-03T00:00:00Z",
      updated_at: "2024-01-03T00:00:00Z"
    }
  }
];

export const favoritesService = {
  // Get user's favorites with title details
  async getUserFavorites(userId: string) {
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('❤️ FAVORITES SERVICE: Using mock data for localhost development');
      return mockFavorites.filter(favorite => favorite.user_id === userId);
    }

    const { data, error } = await supabase
      .from("user_favorites")
      .select(`
        *,
        titles (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Check if a title is favorited by the user
  async isTitleFavorited(userId: string, titleId: string) {
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('❤️ FAVORITES SERVICE: Checking mock favorites for localhost development');
      return mockFavorites.some(favorite => 
        favorite.user_id === userId && favorite.title_id === titleId
      );
    }

    const { data, error } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("title_id", titleId)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  },

  // Add title to favorites
  async addToFavorites(userId: string, titleId: string) {
    // Mock implementation for localhost development
    if (shouldUseMockData()) {
      console.log('❤️ FAVORITES SERVICE: Mock add to favorites for localhost development');
      const newFavorite = {
        id: `mock-fav-${Date.now()}`,
        user_id: userId,
        title_id: titleId,
        created_at: new Date().toISOString()
      };
      mockFavorites.push(newFavorite as any);
      return newFavorite;
    }

    const { data, error } = await supabase
      .from("user_favorites")
      .insert({ user_id: userId, title_id: titleId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Remove title from favorites
  async removeFromFavorites(userId: string, titleId: string) {
    // Mock implementation for localhost development
    if (shouldUseMockData()) {
      console.log('❤️ FAVORITES SERVICE: Mock remove from favorites for localhost development');
      const index = mockFavorites.findIndex(fav => 
        fav.user_id === userId && fav.title_id === titleId
      );
      if (index > -1) {
        mockFavorites.splice(index, 1);
      }
      return;
    }

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("title_id", titleId);
    
    if (error) throw error;
  }
};
