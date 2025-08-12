
// Auto-generated TypeScript interfaces for localhost mock data
// Generated on: 2025-08-12T06:09:04.592Z

export interface MockUserBuyer {
  id: string;
  email: string;
  full_name: string;
  tier: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

export interface MockTitle {
  title_id: string;
  title_name_en?: string;
  title_name_kr: string;
  title_image?: string;
  views?: number;
  likes?: number;
  genre?: string;
  content_format?: string;
  story_author?: string;
  art_author?: string;
  tagline?: string;
  description?: string;
  pitch?: string;
  created_at: string;
  updated_at: string;
}

export interface MockFeaturedTitle {
  id: string;
  title_id: string;
  note?: string;
  created_at: string;
  updated_at: string;
  titles: MockTitle;
}

export interface LocalhostMockData {
  timestamp: string;
  user_buyers: MockUserBuyer | null;
  featured_titles: MockFeaturedTitle[];
  titles: MockTitle[];
  extraction_summary: {
    user_found: boolean;
    featured_count: number;
    titles_count: number;
  };
}
