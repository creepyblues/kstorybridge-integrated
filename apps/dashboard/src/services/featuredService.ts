import { supabase } from "@/lib/supabase";
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
  async getAllFeatured(): Promise<FeaturedWithTitle[]> {
    const { data, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (
          *,
          title_content_analysis (
            pitch_analysis
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch all featured titles: ${error.message}`);
    }

    return data || [];
  },

  async addFeaturedTitle(titleId: string, note?: string): Promise<void> {
    const { error } = await supabase
      .from('featured')
      .insert({
        title_id: titleId,
        note: note || null
      });

    if (error) {
      throw new Error(`Failed to add featured title: ${error.message}`);
    }
  },

  async removeFeaturedTitle(featuredId: string): Promise<void> {
    const { error } = await supabase
      .from('featured')
      .delete()
      .eq('id', featuredId);

    if (error) {
      throw new Error(`Failed to remove featured title: ${error.message}`);
    }
  },

  async updateFeaturedNote(featuredId: string, note: string): Promise<void> {
    const { error } = await supabase
      .from('featured')
      .update({
        note,
        updated_at: new Date().toISOString()
      })
      .eq('id', featuredId);

    if (error) {
      throw new Error(`Failed to update featured note: ${error.message}`);
    }
  },

  async isTitleFeatured(titleId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('featured')
      .select('id')
      .eq('title_id', titleId)
      .maybeSingle();

    if (error) {
      console.error('Error checking if title is featured:', error);
      return false;
    }

    return !!data;
  }
};
