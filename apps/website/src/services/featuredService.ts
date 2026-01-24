import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

export type Title = Database['public']['Tables']['titles']['Row'];
export type Featured = Database['public']['Tables']['featured']['Row'];

export type FeaturedWithTitle = Featured & {
  titles: Title;
};

// Fisher-Yates shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const featuredService = {
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

  async getRandomFeaturedTitles(count: number = 6): Promise<FeaturedWithTitle[]> {
    const allFeatured = await this.getFeaturedTitles();
    return shuffleArray(allFeatured).slice(0, Math.min(count, allFeatured.length));
  }
};