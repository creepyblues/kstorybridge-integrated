
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type UserFavorite = Tables<"user_favorites">;
export type UserFavoriteInsert = TablesInsert<"user_favorites">;

export const favoritesService = {
  // Get user's favorites with title details
  async getUserFavorites(userId: string) {
    const { data, error } = await supabase
      .from("user_favorites")
      .select(`
        *,
        titles (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Check if a title is favorited by the user
  async isTitleFavorited(userId: string, titleId: string) {
    const { data, error } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("title_id", titleId)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  },

  // Add title to favorites
  async addToFavorites(userId: string, titleId: string) {
    const { data, error } = await supabase
      .from("user_favorites")
      .insert({ user_id: userId, title_id: titleId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Remove title from favorites
  async removeFromFavorites(userId: string, titleId: string) {
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("title_id", titleId);
    
    if (error) throw error;
  }
};
