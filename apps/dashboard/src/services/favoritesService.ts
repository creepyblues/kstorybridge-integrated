
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type UserFavorite = Tables<"user_favorites">;
export type UserFavoriteInsert = TablesInsert<"user_favorites">;

// Check if we should use mock data for localhost development
const shouldUseMockData = () => {
  const isLocalhost = window.location.hostname === 'localhost';
  const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
  const isDev = import.meta.env.DEV;
  
  return isLocalhost && bypassEnabled && isDev;
};

// Mock favorites data for localhost development - using real title data
const mockFavorites = [
  {
    id: "fav-1",
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    title_id: "bd688163-0a61-4e67-a125-95644e5be942",
    created_at: "2024-01-15T10:30:00Z",
    titles: {
      title_id: "bd688163-0a61-4e67-a125-95644e5be942",
      title_name_kr: "세렌디피티",
      title_name_en: "serendipity",
      title_url: "https://www.bomtoon.com/comic/ep_list/tfevx/?p_id=gk621&gclid=CjwKCAiApfeQBhAUEiwA7K_UH099SO3w5buRrJLufyzpQsCXZrDXw6o2Own__TAg26uB_YpUU9TvRxoCIWsQAvD_BwE",
      title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff0411885-e2d8-4b4e-8f6e-543406835ca6%2F14401000%EB%B0%B0%EB%84%88.jpg&blockId=61630920-51c6-4dd1-aa18-24867fe4d110",
      views: null,
      likes: null,
      rating: null,
      rating_count: null,
      tags: ["serendipity", "세렌디피티", "Drama", "Growth"],
      art_author: "주요",
      content_format: null,
      pitch: null,
      creator_id: "f21b54bb-945c-42ed-a49a-18824b08d8cc",
      created_at: "2025-07-31T03:19:06.4027+00:00",
      updated_at: "2025-08-07T00:39:40.007195+00:00",
      story_author: "잇뚜",
      comps: null,
      tagline: "",
      description: "Su-ah was born color-blind, but when she finds someone she likes, she gains the ability to see all the colors associated with that person. Eun-woo, also color-blind, sees color through Su-ah, and through each other, their black-and-white world is filled with warm hues.",
      completed: "completed",
      chapters: null,
      perfect_for: null,
      tone: "heartwarming",
      audience: null,
      rights: "Manwha Family",
      art_author_kr: "주요",
      story_author_kr: "잇뚜",
      note: "",
      tagline_kr: null,
      note_kr: null,
      cp: "toons_kr",
      description_kr: "색맹으로 태어났지만, 좋아하는 사람이 생기면 그 사람과 관련된 모든 색을 볼 수 있는 능력을\n가지고 있는 '수아'. 또한 '은우' 역시 색맹이지만 수아를 통해 색을 보고, 흑백 세상에서 서로를 통해\n따뜻한 색들로 채워져 간다.",
      original_author: null,
      original_author_kr: null,
      age_rating: null,
      genre: ["Drama", "Growth"],
      genre_kr: ["드라마", "성장"],
      keywords: ["serendipity", "세렌디피티", "Drama", "Growth"]
    }
  },
  {
    id: "fav-2",
    user_id: "550e8400-e29b-41d4-a716-446655440000", 
    title_id: "3cce946a-e45b-4c36-84b4-fc45b5ccec0e",
    created_at: "2024-01-12T14:20:00Z",
    titles: {
      title_id: "3cce946a-e45b-4c36-84b4-fc45b5ccec0e",
      title_name_kr: "사랑도 튀기면 맛있나요",
      title_name_en: "Is love delicious fried as well?",
      title_url: "https://page.kakao.com/home?seriesId=58439503&orderby=asc",
      title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F064d0237-3eb6-4b0d-9ac9-5ad7e05b6aec%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%EC%A7%80.jpg&blockId=68eca8ae-8266-4774-9a42-934c8f3c27f1",
      views: null,
      likes: null,
      rating: null,
      rating_count: null,
      tags: ["love", "delicious", "fried", "well", "사랑도", "튀기면", "맛있나요", "Dailylife", "romance", "love story", "romantic comedy", "love triangle", "relationship", "marriage", "dating", "heartbreak", "passion", "familycomedy", "healing"],
      art_author: "감자튀김",
      content_format: null,
      pitch: null,
      creator_id: "f21b54bb-945c-42ed-a49a-18824b08d8cc",
      created_at: "2025-07-31T03:19:06.4027+00:00",
      updated_at: "2025-08-07T00:39:40.007195+00:00",
      story_author: "감자튀김",
      comps: null,
      tagline: "",
      description: "Let's forget the hardships with chicken! The love stories of the three siblings, each made with chicken.",
      completed: "completed",
      chapters: null,
      perfect_for: null,
      tone: "romantic",
      audience: null,
      rights: "Manwha Family",
      art_author_kr: "감자튀김",
      story_author_kr: "감자튀김",
      note: "",
      tagline_kr: null,
      note_kr: null,
      cp: "toons_kr",
      description_kr: "힘들었던 일은 치킨으로 잊자! 치킨으로 만들어지는 삼남매 각자의 러브스토리",
      original_author: null,
      original_author_kr: null,
      age_rating: null,
      genre: ["Dailylife", "romance", "familycomedy", "healing"],
      genre_kr: ["일상", "로맨스", "가족코미디", "힐링"],
      keywords: ["love", "delicious", "fried", "well", "사랑도", "튀기면", "맛있나요", "Dailylife", "romance", "love story", "romantic comedy", "love triangle", "relationship", "marriage", "dating", "heartbreak", "passion", "familycomedy", "healing"]
    }
  }
];

export const favoritesService = {
  // Get user's favorites with title details
  async getUserFavorites(userId: string) {
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('❤️ FAVORITES SERVICE: Using mock data for localhost development');
      return mockFavorites.filter(favorite => favorite.user_id === userId);
    }

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
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('❤️ FAVORITES SERVICE: Checking mock favorites for localhost development');
      return mockFavorites.some(favorite => 
        favorite.user_id === userId && favorite.title_id === titleId
      );
    }

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
    // Mock implementation for localhost development
    if (shouldUseMockData()) {
      console.log('❤️ FAVORITES SERVICE: Mock add to favorites for localhost development');
      const newFavorite = {
        id: `mock-fav-${Date.now()}`,
        user_id: userId,
        title_id: titleId,
        created_at: new Date().toISOString()
      };
      mockFavorites.push(newFavorite as any);
      return newFavorite;
    }

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
    // Mock implementation for localhost development
    if (shouldUseMockData()) {
      console.log('❤️ FAVORITES SERVICE: Mock remove from favorites for localhost development');
      const index = mockFavorites.findIndex(fav => 
        fav.user_id === userId && fav.title_id === titleId
      );
      if (index > -1) {
        mockFavorites.splice(index, 1);
      }
      return;
    }

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("title_id", titleId);
    
    if (error) throw error;
  }
};
