import { supabase } from "@/integrations/supabase/client";
import type { Title } from "./titlesService";

export type Featured = {
  id: string;
  title_id: string;
  note: string | null;
  created_at: string;
  updated_at: string;
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
      throw new Error(`Failed to fetch featured titles: ${error.message}`);
    }

    return data || [];
  },

  // Add a title to featured
  async addFeaturedTitle(titleId: string, note?: string): Promise<Featured> {
    const { data, error } = await supabase
      .from('featured')
      .insert({
        title_id: titleId,
        note: note || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add featured title: ${error.message}`);
    }

    return data;
  },

  // Remove a title from featured
  async removeFeaturedTitle(featuredId: string): Promise<void> {
    const { error } = await supabase
      .from('featured')
      .delete()
      .eq('id', featuredId);

    if (error) {
      throw new Error(`Failed to remove featured title: ${error.message}`);
    }
  },

  // Update featured title note
  async updateFeaturedNote(featuredId: string, note: string): Promise<Featured> {
    const { data, error } = await supabase
      .from('featured')
      .update({ note, updated_at: new Date().toISOString() })
      .eq('id', featuredId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update featured title note: ${error.message}`);
    }

    return data;
  },

  // Check if a title is already featured
  async isTitleFeatured(titleId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('featured')
      .select('id')
      .eq('title_id', titleId)
      .limit(1);

    if (error) {
      throw new Error(`Failed to check if title is featured: ${error.message}`);
    }

    return (data && data.length > 0) || false;
  }
};