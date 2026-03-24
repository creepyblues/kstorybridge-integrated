import type { Title } from '@/services/titlesService';
import type { PitchAnalysis } from '@/types/pitchAnalysis';
import type { UserTier } from '@/contexts/TierContext';
import type { User } from '@supabase/supabase-js';

export type PublicTitle = {
  title_id: string;
  title_name_en: string | null;
  title_name_kr: string;
  slug: string | null;
  title_image: string | null;
  tagline: string | null;
  synopsis: string | null;
  genre: string[] | string | null;
  content_format: string | null;
  comps: string[] | null;
  views: number | null;
  rating: number | null;
  rating_count: number | null;
  chapters: number | null;
  completed: boolean | null;
  rights_available: string[] | null;
  note: string | null;
  story_author: string | null;
  art_author: string | null;
  tone: string | null;
  audience: string | null;
  age_rating: string | null;
};

export type AuthState = 'anon' | 'authenticated';

export interface UnifiedTitleDetailProps {
  title: PublicTitle | Title;
  authState: AuthState;
  user: User | null;
  tier?: UserTier;
  pitchAnalysis?: PitchAnalysis | null;
  isFavorited?: boolean;
  favoriteLoading?: boolean;
  onFavoriteToggle?: () => void;
  onCtaClick?: (position: string) => void;
}

export type SimilarTitle = {
  title_id: string;
  title_name_en: string | null;
  title_name_kr: string;
  slug: string | null;
  title_image: string | null;
  genre: string[] | string | null;
  content_format: string | null;
};

export const formatLabel = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
