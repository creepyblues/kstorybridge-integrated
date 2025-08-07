
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Title = Tables<"titles">;
export type TitleInsert = TablesInsert<"titles">;
export type TitleUpdate = TablesUpdate<"titles">;

// Check if we should use mock data for localhost development
const shouldUseMockData = () => {
  const isLocalhost = window.location.hostname === 'localhost';
  const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
  const isDev = import.meta.env.DEV;
  
  console.log('🔍 Mock data check:', {
    hostname: window.location.hostname,
    isLocalhost,
    bypassEnabled,
    isDev,
    shouldUse: isLocalhost && bypassEnabled && isDev
  });
  
  return isLocalhost && bypassEnabled && isDev;
};

// Mock titles data for localhost development - Real data from database
const mockTitles: Title[] = [
  {
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
  },
  {
    title_id: "eda7e1d9-211a-4c9e-bd26-8eda72f58030",
    title_name_kr: "영블러드",
    title_name_en: "Young Blood",
    title_url: "https://www.bomtoon.com/detail/young_blood",
    title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F67a243d0-c88f-4571-a915-ea2a82589c51%2F300_430.jpg&blockId=f9e61928-b726-4f8d-b437-4504e533e1ca",
    views: null,
    likes: null,
    rating: null,
    rating_count: null,
    tags: ["young", "blood", "영블러드"],
    art_author: "다와서",
    content_format: null,
    pitch: null,
    creator_id: "f21b54bb-945c-42ed-a49a-18824b08d8cc",
    created_at: "2025-07-31T03:19:06.4027+00:00",
    updated_at: "2025-08-07T00:39:40.007195+00:00",
    story_author: "다와서",
    comps: null,
    tagline: "",
    description: "During high school, Yeon-woo's mother, unable to bear the burden of her family, remarried and became Woo-hyuk's stepmother.\nYeon-woo, struggling financially, unable to afford even cup ramen or kimbap, turns to her mother for help, but all she receives is a sharply drawn line between them.\nYeon-woo, now a stranger to her mother, uses Woo-hyuk's blushing face to swear revenge on them.\nAs adults, Woo-hyuk and Yeon-woo reunite through a friend.\nYeon-woo's persistent efforts lead to repeated encounters, and a drunken Woo-hyuk forces them to have a romantic night together.\nYeon-woo calmly threatens Woo-hyuk with a photo she'd taken, intending to exact revenge on the wounds she'd inflicted.",
    completed: null,
    chapters: null,
    perfect_for: null,
    tone: "intense",
    audience: null,
    rights: "Manwha Family",
    art_author_kr: "다와서",
    story_author_kr: "다와서",
    note: "",
    tagline_kr: null,
    note_kr: null,
    cp: "toons_kr",
    description_kr: "고등학생 시절, 연우의 어머니는 지긋지긋한 연우네 가족을 벗어나 재혼을 해 우혁의 새엄마가 되었다.\n돈이 없어 컵라면에 김밥도 먹지 못하는 연우가 현실이 벅차 엄마에게 도움을 청하지만, 돌아온 것은 명확히 그어지는 그들간의 경계선 뿐.\n엄마와 남이 되어버린 연우는 자신을 보며 얼굴을 붉히는 우혁을 이용해 그들에게 복수를 다짐하게 된다.\n성인이 된 후, 친구를 통해 오랜만에 재회하게 된 우혁과 연우.\n연우의 끈질긴 노력으로 둘은 자꾸만 마주치게 되고, 술에 취한 우혁의 힘으로 둘은 첫날밤을 보내게 된다.\n연우는 찍어둔 사진을 걸고 태연하게 우혁을 협박하며, 지난 시간 쌓여온 상처에 대한 복수를 시작하려 한다.",
    original_author: null,
    original_author_kr: null,
    age_rating: null,
    genre: ["BL"],
    genre_kr: ["BL"],
    keywords: ["young", "blood", "영블러드"]
  },
  {
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
  },
  {
    title_id: "d5d4bd2b-7772-4905-8fbe-bcb21991491b",
    title_name_kr: "나 홀로 섬에",
    title_name_en: "Alone on the island",
    title_url: "https://series.naver.com/comic/detail.series?productNo=6393990",
    title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7367f965-5456-4d8a-8b6c-903940f2a8d2%2F%EB%82%98%ED%99%80%EB%A1%9C.jpg&blockId=ed10c85b-9a0c-47fe-85b5-fd303d59057d",
    views: null,
    likes: null,
    rating: null,
    rating_count: null,
    tags: ["island", "alone", "Boy", "Thriller"],
    art_author: "짱9",
    content_format: null,
    pitch: null,
    creator_id: "f21b54bb-945c-42ed-a49a-18824b08d8cc",
    created_at: "2025-07-31T03:19:06.4027+00:00",
    updated_at: "2025-08-07T00:39:40.007195+00:00",
    story_author: "신갓김치",
    comps: null,
    tagline: "",
    description: "Geo and his family go camping on an island.\nOn what seemed like a fun-filled camping day, a storm forces the family to abandon their campsite.\nThe storm forces them to settle down at the only inhabited pension.\nSoon after, ominous incidents unfold.\nEveryone here is suspicious!\nIn this eerie pension...\nOn this terrifying uninhabited island...\nWill Geo and his family make it out alive?",
    completed: "ONGOING",
    chapters: null,
    perfect_for: null,
    tone: "suspenseful",
    audience: null,
    rights: "Manwha Family",
    art_author_kr: "짱9",
    story_author_kr: "신갓김치",
    note: "",
    tagline_kr: null,
    note_kr: null,
    cp: "toons_kr",
    description_kr: "가족과 섬으로 캠핑을 온 '지오'\n즐거울 것만 같았던 캠핑 날, 폭풍우를 만난 가족은 그 곳에 발을 들일 수 밖에 없었다.\n폭풍우로 인해 유일하게 사람이 사는 펜션에서 숙식을 해결하기로 하는데..\n곧이어 닥쳐오는 불길한 사건 사고들\n이곳에 있는 모든 인간들이 수상하다..!\n과연 음산한 펜션에서..\n끔찍한 이 무인도에서..\n지오와 가족들은 살아서 나갈 수 있을까?",
    original_author: null,
    original_author_kr: null,
    age_rating: null,
    genre: ["Boy", "Thriller"],
    genre_kr: ["소년", "스릴러"],
    keywords: ["island", "alone", "Boy", "Thriller"]
  },
  {
    title_id: "93519f7f-5859-48c7-9130-1c829b07b382",
    title_name_kr: "무식아",
    title_name_en: "Moosick",
    title_url: null,
    title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7aaa1010-f1f3-4fcb-a71c-a8e7e7dcd1e8%2F005-1_%EB%B3%B5%EC%82%AC.png&blockId=1c0453f2-5066-4fb2-9efd-c0d6caa15aef",
    views: null,
    likes: null,
    rating: null,
    rating_count: null,
    tags: ["moosick", "무식아", "gags", "episodes"],
    art_author: "현용민",
    content_format: null,
    pitch: null,
    creator_id: "f21b54bb-945c-42ed-a49a-18824b08d8cc",
    created_at: "2025-07-31T03:19:06.4027+00:00",
    updated_at: "2025-08-07T00:39:40.007195+00:00",
    story_author: "현용민",
    comps: null,
    tagline: "",
    description: "A slapstick comedy about the newly adult protagonist Han Moo-sik, his family, and those around him!\n\nThe episodic gag comic that formed the basis for \"The Laughing Gag Club.\"",
    completed: "completed",
    chapters: null,
    perfect_for: null,
    tone: "funny",
    audience: null,
    rights: "Manwha Family",
    art_author_kr: "현용민",
    story_author_kr: "현용민",
    note: "",
    tagline_kr: null,
    note_kr: null,
    cp: "toons_kr",
    description_kr: "갓 성인이 된 주인공 한무식과 그의 가족, 그리고 주변 사람들로부터 벌어지는 반전 슬랩스틱 코미디!\n'웃지 않는 개그반'의 토대가 된 에피소드 개그 만화",
    original_author: null,
    original_author_kr: null,
    age_rating: null,
    genre: ["gags", "episodes"],
    genre_kr: ["개그", "에피소드"],
    keywords: ["moosick", "무식아", "gags", "episodes"]
  }
] as Title[];

export const titlesService = {
  // Get all titles (for buyers to browse)
  async getAllTitles() {
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('📚 TITLES SERVICE: Using mock data for localhost development');
      return mockTitles;
    }

    try {
      const { data, error } = await supabase
        .from("titles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.warn('Failed to fetch titles:', error.message);
        return []; // Return empty array instead of throwing
      }
      return data || [];
    } catch (error) {
      console.warn('Titles service error:', error);
      return []; // Return empty array on any error
    }
  },

  // Get titles by creator (for creators to manage their own)
  async getTitlesByCreator(creatorId: string) {
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('📚 TITLES SERVICE: Using mock creator titles for localhost development');
      return mockTitles.filter(title => title.creator_id === creatorId);
    }

    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get titles owned by creator using rights field
  async getTitlesByCreatorRights(userId: string) {
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('📚 TITLES SERVICE: Using mock rights titles for localhost development');
      return mockTitles.filter(title => title.rights === userId);
    }

    try {
      const { data, error } = await supabase
        .from("titles")
        .select("*")
        .eq("rights", userId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.warn('Failed to fetch creator titles:', error.message);
        return []; // Return empty array instead of throwing
      }
      return data || [];
    } catch (error) {
      console.warn('Creator titles service error:', error);
      return []; // Return empty array on any error
    }
  },

  // Get single title by ID
  async getTitleById(titleId: string) {
    // Return mock data for localhost development
    if (shouldUseMockData()) {
      console.log('📚 TITLES SERVICE: Getting single title mock data for localhost development');
      const title = mockTitles.find(title => title.title_id === titleId);
      if (!title) {
        throw new Error(`Title not found: ${titleId}`);
      }
      return title;
    }

    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .eq("title_id", titleId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new title
  async createTitle(title: TitleInsert) {
    const { data, error } = await supabase
      .from("titles")
      .insert(title)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update title
  async updateTitle(titleId: string, updates: TitleUpdate) {
    const { data, error } = await supabase
      .from("titles")
      .update(updates)
      .eq("title_id", titleId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete title
  async deleteTitle(titleId: string) {
    const { error } = await supabase
      .from("titles")
      .delete()
      .eq("title_id", titleId);
    
    if (error) throw error;
  },

  // Search titles with comprehensive text search
  async searchTitles(query: string, filters?: {
    genre?: string;
    content_format?: string;
  }) {
    let queryBuilder = supabase
      .from("titles")
      .select("*");

    if (query) {
      // Search across all text fields including tags array
      queryBuilder = queryBuilder.or(`title_name_kr.ilike.%${query}%,title_name_en.ilike.%${query}%,author.ilike.%${query}%,story_author.ilike.%${query}%,art_author.ilike.%${query}%,writer.ilike.%${query}%,illustrator.ilike.%${query}%,tagline.ilike.%${query}%,description.ilike.%${query}%,perfect_for.ilike.%${query}%,comps.ilike.%${query}%,tone.ilike.%${query}%,audience.ilike.%${query}%,note.ilike.%${query}%,rights.ilike.%${query}%,rights_owner.ilike.%${query}%,tags.cs.{${query}}`);
    }

    if (filters?.genre) {
      queryBuilder = queryBuilder.eq("genre", filters.genre as any);
    }

    if (filters?.content_format) {
      queryBuilder = queryBuilder.eq("content_format", filters.content_format as any);
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
