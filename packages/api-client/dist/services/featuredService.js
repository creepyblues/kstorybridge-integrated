import { supabase } from '../client';
export const featuredService = {
    // Get most recently added featured title
    async getMostRecentFeatured() {
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
    async getFeaturedByViews(limit = 5) {
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
    async getAllFeatured() {
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
    async getFeaturedTitles() {
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
        }
        catch (error) {
            console.warn('Featured titles service error:', error);
            return []; // Return empty array on any error
        }
    },
    // Create new featured title
    async createFeatured(featured) {
        const { data, error } = await supabase
            .from('featured')
            .insert(featured)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    // Update featured title
    async updateFeatured(id, updates) {
        const { data, error } = await supabase
            .from('featured')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    // Delete featured title
    async deleteFeatured(id) {
        const { error } = await supabase
            .from('featured')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
};
