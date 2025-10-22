
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Title = Tables<"titles">;
export type TitleInsert = TablesInsert<"titles">;
export type TitleUpdate = TablesUpdate<"titles">;

export const titlesService = {
  // Get all titles (optimized for admin list view)
  async getAllTitles() {
    const { data, error } = await supabase
      .from("titles")
      .select(`
        title_id,
        title_name_en,
        title_name_kr,
        title_image,
        genre,
        content_format,
        tone,
        keywords,
        comps,
        pitch,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get paginated titles for better performance
  async getTitlesPaginated(page: number = 1, limit: number = 50) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("titles")
      .select(`
        title_id,
        title_name_en,
        title_name_kr,
        title_image,
        genre,
        content_format,
        tone,
        keywords,
        comps,
        pitch,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    return { data: data || [], count: count || 0, totalPages: Math.ceil((count || 0) / limit) };
  },

  // Get titles by creator (for creators to manage their own)
  async getTitlesByCreator(creatorId: string) {
    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
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

  // Get essential titles data for listing (minimal fields for performance)
  async getTitlesEssential() {
    const { data, error } = await supabase
      .from("titles")
      .select(`
        title_id,
        title_name_en,
        title_name_kr,
        genre,
        pitch,
        updated_at
      `)
      .order("updated_at", { ascending: false });
    
    if (error) throw error;
    return data;
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
      queryBuilder = queryBuilder.or(`title_name_kr.ilike.%${query}%,title_name_en.ilike.%${query}%,original_author.ilike.%${query}%,story_author.ilike.%${query}%,art_author.ilike.%${query}%,tagline.ilike.%${query}%,synopsis.ilike.%${query}%,perfect_for.ilike.%${query}%,tone.ilike.%${query}%,audience.ilike.%${query}%,note.ilike.%${query}%,rights.ilike.%${query}%,keywords.cs.{${query}},comps.cs.{${query}}`);
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
