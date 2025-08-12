import { supabase } from '../client';
// Shared services should be environment-agnostic
// Mock data functionality moved to app-specific implementations
export const favoritesService = {
    // Get user's favorites with title information
    async getUserFavorites(userId) {
        try {
            const { data, error } = await supabase
                .from('user_favorites')
                .select(`
          *,
          titles (*)
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                console.warn('Failed to fetch user favorites:', error.message);
                return [];
            }
            return data || [];
        }
        catch (error) {
            console.warn('Favorites service error:', error);
            return [];
        }
    },
    // Check if a title is favorited by user
    async isTitleFavorited(userId, titleId) {
        try {
            const { data, error } = await supabase
                .from('user_favorites')
                .select('id')
                .eq('user_id', userId)
                .eq('title_id', titleId)
                .single();
            if (error) {
                // Not found is expected, other errors should be logged
                if (error.code !== 'PGRST116') {
                    console.warn('Error checking favorite status:', error.message);
                }
                return false;
            }
            return !!data;
        }
        catch (error) {
            console.warn('Error checking favorite status:', error);
            return false;
        }
    },
    // Add title to favorites
    async addToFavorites(userId, titleId) {
        const { data, error } = await supabase
            .from('user_favorites')
            .insert({
            user_id: userId,
            title_id: titleId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    // Remove title from favorites
    async removeFromFavorites(userId, titleId) {
        const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('title_id', titleId);
        if (error)
            throw error;
    },
    // Get favorites count for a user
    async getFavoritesCount(userId) {
        try {
            const { count, error } = await supabase
                .from('user_favorites')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            if (error) {
                console.warn('Error getting favorites count:', error.message);
                return 0;
            }
            return count || 0;
        }
        catch (error) {
            console.warn('Error getting favorites count:', error);
            return 0;
        }
    }
};
