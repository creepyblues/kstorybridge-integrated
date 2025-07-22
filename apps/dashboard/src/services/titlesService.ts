
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Title = Tables<"titles">;
export type TitleInsert = TablesInsert<"titles">;
export type TitleUpdate = TablesUpdate<"titles">;

export const titlesService = {
  // Get all titles (for buyers to browse)
  async getAllTitles() {
    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
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

  // Search titles
  async searchTitles(query: string, filters?: {
    genre?: string;
    content_format?: string;
  }) {
    let queryBuilder = supabase
      .from("titles")
      .select("*");

    if (query) {
      queryBuilder = queryBuilder.or(`title_name_kr.ilike.%${query}%,title_name_en.ilike.%${query}%,author.ilike.%${query}%`);
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
