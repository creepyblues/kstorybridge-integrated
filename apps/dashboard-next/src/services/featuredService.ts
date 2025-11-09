import { supabase } from '@/lib/supabase';
import type { Title } from './titlesService';

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
    try {
      const { data, error } = await supabase
        .from('featured')
        .select(`
          *,
          titles (*)
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw new Error(`Failed to fetch most recent featured title: ${error.message}`);
      }

      return data as FeaturedWithTitle | null;
    } catch (error: any) {
      console.error('❌ Get most recent featured error:', error);
      return null;
    }
  },

  // Get featured titles sorted by views
  async getFeaturedByViews(limit: number = 5): Promise<FeaturedWithTitle[]> {
    try {
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

      return (data as FeaturedWithTitle[]) || [];
    } catch (error: any) {
      console.error('❌ Get featured by views error:', error);
      return [];
    }
  },

  // Get all featured titles with title data
  async getAllFeatured(): Promise<FeaturedWithTitle[]> {
    try {
      const { data, error } = await supabase
        .from('featured')
        .select(`
          *,
          titles (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch featured titles: ${error.message}`);
      }

      return (data as FeaturedWithTitle[]) || [];
    } catch (error: any) {
      console.error('❌ Featured service error:', error);
      throw error;
    }
  },

  // Get featured titles for homepage display (with fallback logic)
  async getFeaturedTitles(): Promise<FeaturedWithTitle[]> {
    try {
      console.log('🎬 [Featured] Fetching featured titles...');

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
            pitch,
            tone,
            comps,
            synopsis,
            verified,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [Featured] Failed to fetch featured titles:', error);
        return await this.getFallbackFeaturedTitles();
      }

      if (!data || data.length === 0) {
        console.log('⚠️ [Featured] No featured titles found, using fallback');
        return await this.getFallbackFeaturedTitles();
      }

      console.log(`✅ [Featured] Successfully loaded ${data.length} featured titles`);
      return data as FeaturedWithTitle[];
    } catch (error: any) {
      console.error('❌ [Featured] Exception occurred:', error);
      return await this.getFallbackFeaturedTitles();
    }
  },

  // Fallback method when featured table doesn't exist or has no data
  async getFallbackFeaturedTitles(): Promise<FeaturedWithTitle[]> {
    try {
      console.log('🎬 [Featured] Using fallback: fetching recent titles as featured content');

      const { data: recentTitles, error } = await supabase
        .from('titles')
        .select(`
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
          synopsis,
          verified,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !recentTitles?.length) {
        console.error('🎬 [Featured] Fallback query failed:', error);
        return this.getHardcodedFallbackTitles();
      }

      // Transform recent titles to featured format
      const fallbackFeatured: FeaturedWithTitle[] = recentTitles.map((title, index) => ({
        id: `fallback-${index}`,
        title_id: title.title_id,
        note: 'Recent addition to our catalog',
        created_at: title.created_at || new Date().toISOString(),
        updated_at: title.created_at || new Date().toISOString(),
        titles: title,
      }));

      console.log(`🎬 [Featured] Fallback successful: created ${fallbackFeatured.length} featured items`);
      return fallbackFeatured;
    } catch (error: any) {
      console.error('🎬 [Featured] Fallback method failed:', error);
      return this.getHardcodedFallbackTitles();
    }
  },

  // Ultimate fallback with hardcoded data
  getHardcodedFallbackTitles(): FeaturedWithTitle[] {
    console.log('🎬 [Featured] Using hardcoded fallback data');

    const hardcodedTitles: FeaturedWithTitle[] = [
      {
        id: 'hardcoded-1',
        title_id: 'sample-1',
        note: 'Featured content from our collection',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        titles: {
          title_id: 'sample-1',
          title_name_en: 'Korean Content Collection',
          title_name_kr: '한국 콘텐츠 컬렉션',
          title_image: undefined,
          tagline: 'Discover amazing Korean stories and content',
          genre: ['drama', 'romance'],
          content_format: 'webtoon',
          author: 'Various Authors',
          pitch: undefined,
          tone: 'engaging',
          comps: ['Popular K-Drama', 'Bestselling Webtoon'],
          synopsis:
            'Explore our curated collection of Korean content, featuring compelling stories from talented creators across various genres and formats.',
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ];

    return hardcodedTitles;
  },

  // Add a title to featured
  async addFeaturedTitle(titleId: string, note?: string): Promise<void> {
    try {
      const { error } = await supabase.from('featured').insert({
        title_id: titleId,
        note: note || null,
      });

      if (error) {
        throw new Error(`Failed to add featured title: ${error.message}`);
      }
    } catch (error: any) {
      console.error('❌ Add featured error:', error);
      throw error;
    }
  },

  // Remove a title from featured
  async removeFeaturedTitle(featuredId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('featured')
        .delete()
        .eq('id', featuredId);

      if (error) {
        throw new Error(`Failed to remove featured title: ${error.message}`);
      }
    } catch (error: any) {
      console.error('❌ Remove featured error:', error);
      throw error;
    }
  },

  // Update note for a featured title
  async updateFeaturedNote(featuredId: string, note: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('featured')
        .update({
          note,
          updated_at: new Date().toISOString(),
        })
        .eq('id', featuredId);

      if (error) {
        throw new Error(`Failed to update featured note: ${error.message}`);
      }
    } catch (error: any) {
      console.error('❌ Update featured note error:', error);
      throw error;
    }
  },

  // Check if a title is already featured
  async isTitleFeatured(titleId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('featured')
        .select('id')
        .eq('title_id', titleId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to check if title is featured: ${error.message}`);
      }

      return !!data;
    } catch (error: any) {
      console.error('❌ Check featured error:', error);
      return false;
    }
  },
};
