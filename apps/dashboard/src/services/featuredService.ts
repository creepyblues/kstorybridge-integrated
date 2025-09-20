import { supabase, withRetry, isNetworkError } from "@/integrations/supabase/client";
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
    const { data, error } = await withRetry(
      () => supabase
        .from('featured')
        .select(`
          *,
          titles (*)
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      {
        maxRetries: 2,
        operationName: 'getMostRecentFeatured',
        retryCondition: isNetworkError
      }
    );

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
    const { data, error } = await withRetry(
      () => supabase
        .from('featured')
        .select(`
          *,
          titles (*)
        `)
        .order('titles(views)', { ascending: false })
        .limit(limit),
      {
        maxRetries: 2,
        operationName: 'getFeaturedByViews',
        retryCondition: isNetworkError
      }
    );

    if (error) {
      throw new Error(`Failed to fetch featured titles by views: ${error.message}`);
    }

    return data || [];
  },

  // Get all featured titles
  async getAllFeatured(): Promise<FeaturedWithTitle[]> {
    const { data, error } = await withRetry(
      () => supabase
        .from('featured')
        .select(`
          *,
          titles (*)
        `)
        .order('created_at', { ascending: false }),
      {
        maxRetries: 2,
        operationName: 'getAllFeatured',
        retryCondition: isNetworkError
      }
    );

    if (error) {
      throw new Error(`Failed to fetch all featured titles: ${error.message}`);
    }

    return data || [];
  },

  // Get featured titles (for homepage-style display)
  async getFeaturedTitles(): Promise<FeaturedWithTitle[]> {
    try {
      console.log('🎬 [VERBOSE] Starting getFeaturedTitles with enhanced retry logic...');
      console.log('🎬 [VERBOSE] Supabase client status:', {
        url: supabase.supabaseUrl,
        key: supabase.supabaseKey?.substring(0, 20) + '...',
        hasAuth: !!supabase.auth
      });

      // First, test basic table access with short timeout
      console.log('🎬 [VERBOSE] Testing basic featured table access...');
      try {
        const testPromise = supabase
          .from('featured')
          .select('id')
          .limit(1);

        const testTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Basic table test timeout')), 10000)
        );

        const { data: testData, error: testError } = await Promise.race([
          testPromise,
          testTimeoutPromise
        ]);

        console.log('🎬 [VERBOSE] Basic table access test result:', {
          hasData: !!testData,
          dataLength: testData?.length,
          hasError: !!testError,
          errorMessage: testError?.message,
          errorCode: testError?.code
        });

        if (testError) {
          console.error('🎬 [VERBOSE] Featured table is not accessible:', testError);
          console.log('🎬 [VERBOSE] Error details:', {
            code: testError.code,
            message: testError.message,
            details: testError.details,
            hint: testError.hint
          });

          // Only use fallback for specific errors, not all errors
          if (testError.code === '42501' || testError.message?.includes('permission') || testError.message?.includes('policy')) {
            console.log('🎬 [VERBOSE] RLS policy blocking access - using fallback to recent titles');
            return await this.getFallbackFeaturedTitles();
          } else if (testError.code === '42P01' || testError.message?.includes('does not exist')) {
            console.log('🎬 [VERBOSE] Table does not exist - using fallback to recent titles');
            return await this.getFallbackFeaturedTitles();
          } else {
            console.log('🎬 [VERBOSE] Other error - proceeding to try full query');
            // Continue to full query for other types of errors
          }
        }
      } catch (testException) {
        console.error('🎬 [VERBOSE] Exception during basic table test:', testException);
        console.log('🎬 [VERBOSE] Exception details:', {
          name: testException.name,
          message: testException.message,
          code: testException.code
        });

        // Only use fallback for specific cases, let other errors through
        if (testException.message?.includes('relation') || testException.message?.includes('does not exist')) {
          console.log('🎬 [VERBOSE] Featured table does not exist - implementing fallback to recent titles');
          return await this.getFallbackFeaturedTitles();
        } else {
          console.log('🎬 [VERBOSE] Continuing to full query despite test exception');
          // Continue to full query
        }
      }

      console.log('🎬 [VERBOSE] Basic table access successful, proceeding with full query...');

      // Add timeout to the main query as well
      const mainQueryPromise = withRetry(
        () => {
          console.log('🎬 [VERBOSE] Executing supabase query to featured table...');
          return supabase
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
              synopsis
            )
          `)
          .order('created_at', { ascending: false })
        },
        {
          maxRetries: 1,
          baseDelay: 500,
          operationName: 'getFeaturedTitles',
          retryCondition: isNetworkError
        }
      );

      const mainTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          console.warn('⏰ [VERBOSE] Main featured query timeout (15s)');
          reject(new Error('Main featured query timeout'));
        }, 15000)
      );

      const { data, error } = await Promise.race([mainQueryPromise, mainTimeoutPromise]);

      console.log('🎬 [VERBOSE] Query completed. Analyzing result...');
      console.log('🎬 [VERBOSE] Error status:', !!error);
      console.log('🎬 [VERBOSE] Data status:', !!data);

      if (error) {
        console.error('❌ [VERBOSE] Failed to fetch featured titles after retries:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        console.log('🎬 [VERBOSE] Using fallback due to error');
        return await this.getFallbackFeaturedTitles();
      }

      if (!data) {
        console.warn('⚠️ [VERBOSE] Query succeeded but data is null/undefined');
        console.log('🎬 [VERBOSE] Using fallback due to null data');
        return await this.getFallbackFeaturedTitles();
      }

      console.log(`✅ [VERBOSE] Successfully loaded ${data.length} featured titles`);
      console.log('🎬 [VERBOSE] Sample data structure:');
      if (data.length > 0) {
        console.log('🎬 [VERBOSE] First item:', {
          featuredId: data[0].id,
          titleId: data[0].title_id,
          hasTitle: !!data[0].titles,
          titleStructure: data[0].titles ? Object.keys(data[0].titles) : 'NO_TITLE'
        });
      }

      return data;
    } catch (error) {
      console.error('❌ [VERBOSE] Featured titles service caught exception:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        fullError: error
      });

      // Handle timeout errors specifically
      if (error.message?.includes('timeout')) {
        console.log('🎬 [VERBOSE] Query timeout detected - using fallback due to slow database response');
      } else {
        console.log('🎬 [VERBOSE] Using fallback due to other exception');
      }

      return await this.getFallbackFeaturedTitles();
    }
  },

  // Fallback method when featured table doesn't exist
  async getFallbackFeaturedTitles(): Promise<FeaturedWithTitle[]> {
    try {
      console.log('🎬 [VERBOSE] Using fallback: fetching recent titles as featured content');

      // Add timeout to fallback query as well
      const fallbackQueryPromise = supabase
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
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const fallbackTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          console.warn('⏰ [VERBOSE] Fallback query timeout (10s)');
          reject(new Error('Fallback query timeout'));
        }, 10000)
      );

      console.log('🎬 [VERBOSE] Executing fallback query with 10s timeout...');
      const { data: recentTitles, error } = await Promise.race([
        fallbackQueryPromise,
        fallbackTimeoutPromise
      ]);

      if (error) {
        console.error('🎬 [VERBOSE] Fallback query failed:', error);
        return this.getHardcodedFallbackTitles();
      }

      if (!recentTitles?.length) {
        console.log('🎬 [VERBOSE] No titles found for fallback, using hardcoded data');
        return this.getHardcodedFallbackTitles();
      }

      // Transform recent titles to featured format
      const fallbackFeatured: FeaturedWithTitle[] = recentTitles.map((title, index) => ({
        id: `fallback-${index}`,
        title_id: title.title_id,
        note: 'Recent addition to our catalog',
        created_at: title.created_at,
        updated_at: title.created_at,
        titles: title
      }));

      console.log(`🎬 [VERBOSE] Fallback successful: created ${fallbackFeatured.length} featured items from recent titles`);
      return fallbackFeatured;

    } catch (error) {
      console.error('🎬 [VERBOSE] Fallback method failed:', error);
      console.log('🎬 [VERBOSE] Using hardcoded fallback data');
      return this.getHardcodedFallbackTitles();
    }
  },

  // Ultimate fallback with hardcoded data to ensure something always shows
  getHardcodedFallbackTitles(): FeaturedWithTitle[] {
    console.log('🎬 [VERBOSE] Using hardcoded fallback data to ensure page loads');

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
          title_image: null,
          tagline: 'Discover amazing Korean stories and content',
          genre: ['drama', 'romance'],
          content_format: 'webtoon',
          story_author: 'Various Authors',
          pitch: null,
          tone: 'engaging',
          comps: ['Popular K-Drama', 'Bestselling Webtoon'],
          synopsis: 'Explore our curated collection of Korean content, featuring compelling stories from talented creators across various genres and formats.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any
      }
    ];

    return hardcodedTitles;
  }
};