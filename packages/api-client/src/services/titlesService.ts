import { supabase } from '../client';
import type { Database } from '../types';

export type Title = Database['public']['Tables']['titles']['Row'];
export type TitleInsert = Database['public']['Tables']['titles']['Insert'];
export type TitleUpdate = Database['public']['Tables']['titles']['Update'];

// Shared services should be environment-agnostic
// Mock data functionality moved to app-specific implementations

export const titlesService = {
  // Get all titles (for buyers to browse)
  async getAllTitles(): Promise<Title[]> {
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
  async getTitlesByCreator(creatorId: string): Promise<Title[]> {
    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get titles owned by creator using rights field
  async getTitlesByCreatorRights(userId: string): Promise<Title[]> {
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
  async getTitleById(titleId: string): Promise<Title> {
    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .eq("title_id", titleId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get titles with pitches (for website)
  async getTitlesWithPitches(limit: number = 6): Promise<Title[]> {
    const { data, error } = await supabase
      .from('titles')
      .select('*')
      .not('pitch', 'is', null)
      .neq('pitch', '')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch titles with pitches: ${error.message}`);
    }

    return data || [];
  },

  // Create new title
  async createTitle(title: TitleInsert): Promise<Title> {
    const { data, error } = await supabase
      .from("titles")
      .insert(title)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update title
  async updateTitle(titleId: string, updates: TitleUpdate): Promise<Title> {
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
  async deleteTitle(titleId: string): Promise<void> {
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
  }): Promise<Title[]> {
    let queryBuilder = supabase
      .from("titles")
      .select("*");

    if (query) {
      // Search across all text fields including tags array
      queryBuilder = queryBuilder.or(`title_name_kr.ilike.%${query}%,title_name_en.ilike.%${query}%,author.ilike.%${query}%,story_author.ilike.%${query}%,art_author.ilike.%${query}%,writer.ilike.%${query}%,illustrator.ilike.%${query}%,tagline.ilike.%${query}%,description.ilike.%${query}%,perfect_for.ilike.%${query}%,tone.ilike.%${query}%,audience.ilike.%${query}%,note.ilike.%${query}%,rights.ilike.%${query}%,rights_owner.ilike.%${query}%,tags.cs.{${query}},comps.cs.{${query}}`);
    }

    if (filters?.genre) {
      queryBuilder = queryBuilder.eq("genre", filters.genre as any);
    }

    if (filters?.content_format) {
      queryBuilder = queryBuilder.eq("content_format", filters.content_format as any);
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};