
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Title = Tables<"titles">;
export type TitleInsert = TablesInsert<"titles">;
export type TitleUpdate = TablesUpdate<"titles">;

// Check if we should use mock data for localhost development
const shouldUseMockData = () => {
  const isLocalhost = window.location.hostname === 'localhost';
  const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
  const isDev = import.meta.env.DEV;
  
  return isLocalhost && bypassEnabled && isDev;
};

// Mock titles data for localhost development
const mockTitles: Title[] = [
  {
    title_id: "1",
    title_name_en: "Mystic Academy Chronicles",
    title_name_kr: "신비한 아카데미 연대기",
    genre: "Fantasy",
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
  },
  {
    title_id: "2",
    title_name_en: "Corporate Love Simulator",
    title_name_kr: "회사 연애 시뮬레이터",
    genre: "Romance",
    author: "Park So-young",
    synopsis: "Navigate office romance in this heartwarming story about finding love in the most unexpected places. Will career ambitions clash with matters of the heart?",
    title_image: "/covers/corporate-love.jpg",
    rating: 4.6,
    views: 18200,
    likes: 2100,
    content_format: "Webnovel",
    tags: ["Office Romance", "Comedy", "Modern Life"],
    creator_id: "550e8400-e29b-41d4-a716-446655440000",
    rights: "550e8400-e29b-41d4-a716-446655440000",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z"
  },
  {
    title_id: "3", 
    title_name_en: "Digital Detective",
    title_name_kr: "디지털 탐정",
    genre: "Mystery",
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
] as Title[];

export const titlesService = {
  // Get all titles (for buyers to browse)
  async getAllTitles() {
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('📚 TITLES SERVICE: Using mock data for localhost development');
      return mockTitles;
    }

    try {
      const { data, error } = await supabase
        .from("titles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.warn('Failed to fetch titles:', error.message);
        return []; // Return empty array instead of throwing
      }
      return data || [];
    } catch (error) {
      console.warn('Titles service error:', error);
      return []; // Return empty array on any error
    }
  },

  // Get titles by creator (for creators to manage their own)
  async getTitlesByCreator(creatorId: string) {
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('📚 TITLES SERVICE: Using mock creator titles for localhost development');
      return mockTitles.filter(title => title.creator_id === creatorId);
    }

    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get titles owned by creator using rights field
  async getTitlesByCreatorRights(userId: string) {
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('📚 TITLES SERVICE: Using mock rights titles for localhost development');
      return mockTitles.filter(title => title.rights === userId);
    }

    try {
      const { data, error } = await supabase
        .from("titles")
        .select("*")
        .eq("rights", userId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.warn('Failed to fetch creator titles:', error.message);
        return []; // Return empty array instead of throwing
      }
      return data || [];
    } catch (error) {
      console.warn('Creator titles service error:', error);
      return []; // Return empty array on any error
    }
  },

  // Get single title by ID
  async getTitleById(titleId: string) {
    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .eq("title_id", titleId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new title
  async createTitle(title: TitleInsert) {
    const { data, error } = await supabase
      .from("titles")
      .insert(title)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update title
  async updateTitle(titleId: string, updates: TitleUpdate) {
    const { data, error } = await supabase
      .from("titles")
      .update(updates)
      .eq("title_id", titleId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete title
  async deleteTitle(titleId: string) {
    const { error } = await supabase
      .from("titles")
      .delete()
      .eq("title_id", titleId);
    
    if (error) throw error;
  },

  // Search titles with comprehensive text search
  async searchTitles(query: string, filters?: {
    genre?: string;
    content_format?: string;
  }) {
    let queryBuilder = supabase
      .from("titles")
      .select("*");

    if (query) {
      // Search across all text fields including tags array
      queryBuilder = queryBuilder.or(`title_name_kr.ilike.%${query}%,title_name_en.ilike.%${query}%,author.ilike.%${query}%,story_author.ilike.%${query}%,art_author.ilike.%${query}%,writer.ilike.%${query}%,illustrator.ilike.%${query}%,tagline.ilike.%${query}%,description.ilike.%${query}%,perfect_for.ilike.%${query}%,comps.ilike.%${query}%,tone.ilike.%${query}%,audience.ilike.%${query}%,note.ilike.%${query}%,rights.ilike.%${query}%,rights_owner.ilike.%${query}%,tags.cs.{${query}}`);
    }

    if (filters?.genre) {
      queryBuilder = queryBuilder.eq("genre", filters.genre as any);
    }

    if (filters?.content_format) {
      queryBuilder = queryBuilder.eq("content_format", filters.content_format as any);
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
