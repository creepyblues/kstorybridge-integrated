
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Title = Tables<"titles">;
export type TitleInsert = TablesInsert<"titles">;
export type TitleUpdate = TablesUpdate<"titles">;

// 🔧 LOCALHOST CONFIG: Always use real Supabase data for titles
// Only user authentication/tier data should be mocked on localhost
const shouldUseMockData = () => {
  // Titles should always come from real Supabase, even on localhost
  return false;
};

// Mock titles data for localhost development - Enhanced real data from database
const mockTitles: Title[] = [
  {
    title_id: "29fff781-6fa0-40c2-81a8-bfa939c46087", // Sora's Eyes - FEATURED
    title_name_kr: "소라의 눈",
    title_name_en: "Sora's Eyes",
    title_url: "https://manta.net/en/series/sora-s-eyes?seriesId=1221",
    title_image: "https://static.mantacdn.net/2022-05-27/g8/g8zwdnyCnk02p08q.jpg",
    views: 1000000,
    likes: 23000,
    rating: 4.5,
    rating_count: 1924,
    tags: ["contemporary", "supernatural", "horror", "LGBTQ+", "webtoon", "visual storytelling", "episodic structure", "cliffhangers", "visual effects potential", "character designs"],
    art_author: "Summer",
    content_format: "webtoon",
    pitch: null,
    creator_id: "e05e353c-60c7-4253-a7da-e0da35f3cf44",
    created_at: "2025-07-24T00:50:14.296063+00:00",
    updated_at: "2025-08-10T07:02:03.190042+00:00",
    story_author: "Summer",
    comps: ["The Grudge", "Train to Busan"],
    tagline: "Contemporary supernatural horror, in which a young man must save the most important person to him from the Grudge of an ancient god",
    synopsis: "\"Just stay alive, young master.\" Sora has descended from the mountains to guard the sickly Jungha. The two have a set of rules to guide them: One, Sora decides what is considered an emergency. Two, Jungha must listen to Sora in an emergency. Three, Jungha must not bully Sora. Will they be able to stick to them?",
    completed: "ONGOING",
    chapters: 68,
    perfect_for: "DRAMA SERIES",
    tone: "EXCITING",
    audience: "ADULTS 18-34",
    rights: "MANTA/RIDI",
    art_author_kr: null,
    story_author_kr: null,
    note: "Perfect for horror/thriller streaming adaptation",
    tagline_kr: null,
    note_kr: null,
    cp: "RIDI",
    description_kr: null,
    original_author: null,
    original_author_kr: null,
    age_rating: "18+",
    genre: ["LGBTQ+"],
    genre_kr: null,
    keywords: ["contemporary", "supernatural", "horror", "LGBTQ+", "webtoon", "visual storytelling", "episodic structure", "cliffhangers", "visual effects potential", "character designs"]
  },
  {
    title_id: "0cfbbe46-e4b3-4d29-925a-a5e9e88bcdab", // Devil at the Crossroads - FEATURED
    title_name_kr: "악마는 교차로에서",
    title_name_en: "Devil at the Crossroads",
    title_url: "https://manta.net/en/series/devil-at-the-crossroads?seriesId=2089",
    title_image: "https://static.mantacdn.net/2023-02-02/nj/njX5Gm4Sz0QX0Iaw.jpg",
    views: 1000000,
    likes: 15000,
    rating: 4.7,
    rating_count: 2847,
    tags: ["supernatural", "adventure", "quirky", "comedy", "LGBTQ+", "webtoon", "visual storytelling", "episodic structure", "cliffhangers", "visual effects potential", "character designs"],
    art_author: "Nangjun",
    content_format: "webtoon",
    pitch: "https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/pitch-pdfs/0cfbbe46-e4b3-4d29-925a-a5e9e88bcdab/pitch.pdf",
    creator_id: "e05e353c-60c7-4253-a7da-e0da35f3cf44",
    created_at: "2025-07-24T00:50:14.296063+00:00",
    updated_at: "2025-08-10T07:02:03.190042+00:00",
    story_author: "Nangjun",
    comps: ["Little Demon", "What We Do in the Shadows"],
    tagline: "A quirky comedy that would be perfect for an animated adult comedy or a live action comedy. Grounded supernatural adventure adds to the fun",
    synopsis: "An accidental deal with the devil goes awry. Veterinary student Yoon Ha discovers he has a fear of blood! To solve his problem, he makes a deal with the demon Samael in exchange for his soul, which goes terribly wrong. Now Yoon must help Samael recover his demonic powers... but evil spirits keep showing up, lusting after Yoon's body?!",
    completed: "ONGOING",
    chapters: 16,
    perfect_for: "COMEDY SERIES",
    tone: "WILD",
    audience: "ADULTS 18-34",
    rights: "MANTA/RIDI",
    art_author_kr: null,
    story_author_kr: null,
    note: "Excellent adaptation potential for streaming platforms",
    tagline_kr: null,
    note_kr: null,
    cp: "RIDI",
    description_kr: null,
    original_author: null,
    original_author_kr: null,
    age_rating: "18+",
    genre: ["LGBTQ+"],
    genre_kr: null,
    keywords: ["supernatural", "adventure", "quirky", "comedy", "LGBTQ+", "webtoon", "visual storytelling", "episodic structure", "cliffhangers", "visual effects potential", "character designs"]
  },
  {
    title_id: "1813044e-306f-4479-87cb-bb212b502e1f", // Werewolves Going Crazy Over Me - FEATURED
    title_name_kr: "늑대들이 나에게 미쳐가고 있어",
    title_name_en: "Werewolves Going Crazy Over Me",
    title_url: "https://manta.net/en/series/werewolves-going-crazy-over-me?seriesId=2107",
    title_image: "https://static.mantacdn.net/2025-05-19/QL/QLcKK2HlSxpPNVq0.jpg",
    views: 2000000,
    likes: 32000,
    rating: 4.8,
    rating_count: 4156,
    tags: ["supernatural", "medical", "drama", "werewolves", "webtoon", "visual storytelling", "episodic structure", "cliffhangers", "visual effects potential", "character designs"],
    art_author: "Manta Comics",
    content_format: "webtoon",
    pitch: "https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/pitch-pdfs/1813044e-306f-4479-87cb-bb212b502e1f/pitch.pdf",
    creator_id: "e05e353c-60c7-4253-a7da-e0da35f3cf44",
    created_at: "2025-07-24T00:50:14.296063+00:00",
    updated_at: "2025-08-10T07:02:03.190042+00:00",
    story_author: "Manta Comics",
    comps: ["Vampire Diaries", "Grey's Anatomy"],
    tagline: "A medical drama mixed with a supernatural soap – a truly original idea",
    synopsis: "A dangerous love affair with a werewolf. Single mother Olivia finds Damian dying on the streets and takes him home. Before long, the two are sharing a passionate kiss. Damian soon realizes the side effects of the drug suppressing his werewolf instincts vanish when he is with her. Now he must find a way to keep her around, no matter the cost.",
    completed: "ONGOING",
    chapters: 23,
    perfect_for: "DRAMA SERIES",
    tone: "EXCITING",
    audience: "ADULTS 18-34",
    rights: "MANTA/RIDI",
    art_author_kr: null,
    story_author_kr: null,
    note: "High adaptation potential for TV series",
    tagline_kr: null,
    note_kr: null,
    cp: "RIDI",
    description_kr: null,
    original_author: null,
    original_author_kr: null,
    age_rating: "18+",
    genre: ["SUPERNATURAL"],
    genre_kr: null,
    keywords: ["supernatural", "medical", "drama", "werewolves", "webtoon", "visual storytelling", "episodic structure", "cliffhangers", "visual effects potential", "character designs"]
  },
  {
    title_id: "3cce946a-e45b-4c36-84b4-fc45b5ccec0e",
    title_name_kr: "사랑도 튀기면 맛있나요",
    title_name_en: "Is love delicious fried as well?",
    title_url: "https://page.kakao.com/home?seriesId=58439503&orderby=asc",
    title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F064d0237-3eb6-4b0d-9ac9-5ad7e05b6aec%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%EC%A7%80.jpg&blockId=68eca8ae-8266-4774-9a42-934c8f3c27f1",
    views: 125000,
    likes: 9500,
    rating: 4.3,
    rating_count: 1847,
    tags: ["family", "love", "comedy", "food", "siblings", "romance", "healing"],
    art_author: "감자튀김",
    content_format: "webtoon",
    pitch: null,
    creator_id: "f21b54bb-945c-42ed-a49a-18824b08d8cc",
    created_at: "2025-07-31T03:19:06.4027+00:00",
    updated_at: "2025-08-11T23:36:23.106064+00:00",
    story_author: "감자튀김",
    comps: ["What's Wrong with Secretary Kim", "Fight My Way"],
    tagline: "A delicious family comedy about love and fried chicken",
    synopsis: "Let's forget the hardships with chicken! The love stories of the three siblings, each made with chicken.",
    completed: "completed",
    chapters: 32,
    perfect_for: "COMEDY SERIES",
    tone: "romantic",
    audience: "ADULTS 18-34",
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
    age_rating: "전체이용가",
    genre: ["Dailylife", "romance", "familycomedy", "healing"],
    genre_kr: ["일상", "로맨스", "가족코미디", "힐링"],
    keywords: ["family", "love", "comedy", "food", "siblings", "romance", "healing"]
  },
  {
    title_id: "ee251fb4-4cd0-4e79-bf9f-0b372c5b0c92",
    title_name_kr: "한 번도 상처받지 않은 것처럼",
    title_name_en: "Like You've Never Been Hurt",
    title_url: "https://page.kakao.com/home?seriesId=52030547",
    title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F16a0a932-8a5e-4c58-a9c6-4b54a8b8a5de%2F%EC%9D%BC%EB%9F%AC%EC%8A%A4%ED%8A%B8_%EC%82%AC%EC%9D%B4%EC%A6%88%EC%A1%B0%EC%A0%88%EB%B3%B82.png&blockId=6504e624-2938-4ece-9064-33321a1dc8ac",
    views: 3891000,
    likes: 9900,
    rating: 4.2,
    rating_count: 2156,
    tags: ["college", "romance", "second chances", "healing", "growth", "relationships", "drama"],
    art_author: "김용용",
    content_format: "webtoon",
    pitch: null,
    creator_id: "f21b54bb-945c-42ed-a49a-18824b08d8cc",
    created_at: "2025-07-31T03:19:06.4027+00:00",
    updated_at: "2025-08-11T23:36:23.106064+00:00",
    story_author: "김용용",
    comps: ["Nevertheless", "Romance is a Bonus Book"],
    tagline: "A heartfelt college romance about second chances",
    synopsis: "After her first college club experience ended badly, Lee Ji's attitude toward relationships shifts and she becomes obsessed with club life. However, as she spends time with her club senior, Pyo Seon-woo, she finds herself drawn to him. However, memories of her previous club experience cause her to avoid him. Can these two truly become a club?",
    completed: "completed",
    chapters: 47,
    perfect_for: "DRAMA SERIES",
    tone: "intense",
    audience: "ADULTS 18-34",
    rights: "Manwha Family",
    art_author_kr: "김용용",
    story_author_kr: "김용용",
    note: "",
    tagline_kr: null,
    note_kr: null,
    cp: "toons_kr",
    description_kr: "대학 첫 CC가 좋지 않게 끝난 '이지'는 연애에 대해 부정적으로 변하고, 동아리 생활에만 몰두를 하게 된다.\n하지만 동아리 선배인 '표선우'와 함께 지내다 보니 점점 끌리지만 이전 CC 생활이 떠오르면서 그를 피하게 된다.\n이 둘은 과연 CC가 될 수 있을까?",
    original_author: null,
    original_author_kr: null,
    age_rating: "전체이용가",
    genre: ["Dailylife", "romance", "drama", "growth", "story"],
    genre_kr: ["일상", "로맨스", "드라마", "성장", "스토리"],
    keywords: ["college", "romance", "second chances", "healing", "growth", "relationships", "drama"]
  },
  {
    title_id: "81e5096e-e76d-4b2f-acf9-4119e706a9e7",
    title_name_kr: "더 익스트림",
    title_name_en: "The Extreme",
    title_url: "https://page.kakao.com/home?seriesId=58427682",
    title_image: "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Febaf31dd-9893-4196-b873-0a86f4a44041%2F%EC%84%B8%EB%A1%9C_%EB%B0%B0%EB%84%88.jpg&blockId=ed128a68-fcca-4936-8fc4-ef7a99a73b7f",
    views: 1725000,
    likes: 9900,
    rating: 4.7,
    rating_count: 3456,
    tags: ["sports", "perseverance", "disability", "skateboarding", "coming-of-age", "inspiration"],
    art_author: "W",
    content_format: "webtoon",
    pitch: null,
    creator_id: "f21b54bb-945c-42ed-a49a-18824b08d8cc",
    created_at: "2025-07-31T03:19:06.4027+00:00",
    updated_at: "2025-08-11T23:36:23.106064+00:00",
    story_author: "후드맛",
    comps: ["Tony Hawk: Until the Wheels Fall Off", "Skate Kitchen"],
    tagline: "An inspiring story of perseverance and extreme sports",
    synopsis: "Han Si-woo lost his left leg in a childhood accident. He suffered trauma from the stigma and bullying that plagued him throughout his school years, but he was introduced to skateboarding after being fitted with a smart prosthetic leg. His incredible balance and skill earned him a spot in the skateboarding crew, \"Extreme Crew.\" Within the crew, Si-woo faces formidable rivals, and even outside the crew, numerous obstacles threaten Si-woo. Can Si-woo overcome all this and prove his potential by competing in the national team trials? This is a coming-of-age story about a one-legged boy with a prosthetic leg, an extreme sports team.",
    completed: "ONGOING",
    chapters: 42,
    perfect_for: "SPORTS SERIES",
    tone: "intense",
    audience: "TEENS 13-17",
    rights: "Manwha Family",
    art_author_kr: "W",
    story_author_kr: "후드맛",
    note: "",
    tagline_kr: null,
    note_kr: null,
    cp: "toons_kr",
    description_kr: "어릴 적 사고로 왼쪽 다리를 잃은 한시우.\n학창시절 내내 따라다니던 낙인과 놀림으로 트라우마를 겪었지만, 스마트 의족을 착용하며 스케이트 보드에 입문하게 된다.\n엄청난 균형 감각을 선보이며 실력을 인정받아 들어가게 된 보드 크루, '익스트림 크루'.\n크루 내에는 강력한 라이벌들이 있고, 크루 밖에도 수많은 방해들이 시우를 붙잡는다.\n과연 시우는 이 모든 것을 이겨내고 국대 선발전에 출전하여 자신의 능력을 입증할 수 있을까?\n의족을 차고 있는 외발 소년의 익스트림 스포츠 성장 드라마",
    original_author: null,
    original_author_kr: null,
    age_rating: "전체이용가",
    genre: ["Boy", "Drama"],
    genre_kr: ["소년", "드라마"],
    keywords: ["sports", "perseverance", "disability", "skateboarding", "coming-of-age", "inspiration"]
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
      queryBuilder = queryBuilder.or(`title_name_kr.ilike.%${query}%,title_name_en.ilike.%${query}%,author.ilike.%${query}%,story_author.ilike.%${query}%,art_author.ilike.%${query}%,writer.ilike.%${query}%,illustrator.ilike.%${query}%,tagline.ilike.%${query}%,description.ilike.%${query}%,perfect_for.ilike.%${query}%,tone.ilike.%${query}%,audience.ilike.%${query}%,note.ilike.%${query}%,rights.ilike.%${query}%,rights_owner.ilike.%${query}%,tags.cs.{${query}},comps.cs.{${query}}`);
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
