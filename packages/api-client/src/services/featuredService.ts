import { supabase } from '../client';
import type { Title } from './titlesService';

// Featured table types (temporarily defined until database types are updated)
export type Featured = {
  id: string;
  title_id: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type FeaturedInsert = Omit<Featured, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type FeaturedWithTitle = Featured & {
  titles: Title;
};

export const featuredService = {
  // Get most recently added featured title
  async getMostRecentFeatured(): Promise<FeaturedWithTitle | null> {
    const { data, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (*)
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw new Error(`Failed to fetch most recent featured title: ${error.message}`);
    }

    return data;
  },

  // Get featured titles sorted by views (for top rated)
  async getFeaturedByViews(limit: number = 5): Promise<FeaturedWithTitle[]> {
    const { data, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (*)
      `)
      .order('titles(views)', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch featured titles by views: ${error.message}`);
    }

    return data || [];
  },

  // Get all featured titles
  async getAllFeatured(): Promise<FeaturedWithTitle[]> {
    const { data, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch all featured titles: ${error.message}`);
    }

    return data || [];
  },

  // Get featured titles (for homepage-style display)
  async getFeaturedTitles(): Promise<FeaturedWithTitle[]> {
    try {
      const { data, error } = await supabase
        .from('featured')
        .select(`
          *,
          titles (
            title_id,
            title_name_en,
            title_name_kr,
            title_image,
            tagline,
            genre,
            content_format,
            story_author,
            pitch
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch featured titles:', error.message);
        return []; // Return empty array instead of throwing
      }

      return data || [];
    } catch (error) {
      console.warn('Featured titles service error:', error);
      return []; // Return empty array on any error
    }
  },

  // Create new featured title
  async createFeatured(featured: FeaturedInsert): Promise<Featured> {
    const { data, error } = await supabase
      .from('featured')
      .insert(featured)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update featured title
  async updateFeatured(id: string, updates: Partial<FeaturedInsert>): Promise<Featured> {
    const { data, error } = await supabase
      .from('featured')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete featured title
  async deleteFeatured(id: string): Promise<void> {
    const { error } = await supabase
      .from('featured')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};