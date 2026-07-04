/**
 * Format Spotlight Service (Website)
 *
 * Fetches format spotlight data using the website's Supabase client.
 * Mirrors the dashboard's getFormatSpotlightData but for public/promo use.
 */

import { supabase } from '@/integrations/supabase/client';
import type { FormatType, FormatAnalysis } from '@kstorybridge/tools';
import {
  getFitLevel,
  getFitLevelLabel,
  FORMAT_DISPLAY_NAMES,
  FORMAT_ICONS,
  FORMAT_DESCRIPTIONS,
} from '@kstorybridge/tools';

// Re-export for page/component use
export type { FormatType, FormatAnalysis };
export type { MicrodramaSpecificInsights } from '@kstorybridge/tools';
export { getFitLevel, getFitLevelLabel, FORMAT_DISPLAY_NAMES, FORMAT_ICONS, FORMAT_DESCRIPTIONS };

export interface SpotlightTitleData {
  title_id: string;
  title_name_en: string | null;
  title_name_kr: string | null;
  title_image: string | null;
  genre: string[] | null;
  content_format: string | null;
  tone: string | null;
  story_author: string | null;
  art_author: string | null;
  rating: number | null;
  views: number | null;
}

export interface SpotlightItem {
  title: SpotlightTitleData;
  analysis: FormatAnalysis;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function getFormatSpotlightData(
  formatType: FormatType,
  minScore: number = 50
): Promise<SpotlightItem[]> {
  const scoreKey = `${formatType}_score`;
  const analysisKey = `${formatType}_analysis`;

  // Read from the public-safe view (anon has no direct grant on title_format_fit).
  const { data: fitData, error: fitError } = await db
    .from('public_title_format_fit')
    .select('title_id, film_score, tv_series_score, animation_score, microdrama_score, audio_drama_score, film_analysis, tv_series_analysis, animation_analysis, microdrama_analysis, audio_drama_analysis');

  if (fitError) {
    console.error('[FormatSpotlight] Fetch error:', fitError);
    throw new Error('Failed to fetch format spotlight data');
  }

  const rows = (fitData || []) as Record<string, unknown>[];

  const filtered = rows
    .filter((row) => {
      const score = row[scoreKey] as number | null;
      return score !== null && score >= minScore;
    })
    .sort((a, b) => {
      const scoreA = (a[scoreKey] as number) || 0;
      const scoreB = (b[scoreKey] as number) || 0;
      return scoreB - scoreA;
    });

  if (filtered.length === 0) return [];

  const titleIds = filtered.map((r) => r.title_id as string);
  // Read from the public-safe view (anon has no direct grant on titles).
  const { data: titles, error: titlesError } = await db
    .from('public_titles')
    .select('title_id, title_name_en, title_name_kr, title_image, genre, content_format, tone, story_author, art_author, rating, views')
    .in('title_id', titleIds);

  if (titlesError) {
    console.error('[FormatSpotlight] Titles fetch error:', titlesError);
    throw new Error('Failed to fetch title details');
  }

  const titleRows = (titles || []) as SpotlightTitleData[];
  const titlesMap = new Map(titleRows.map((t) => [t.title_id, t]));

  return filtered
    .map((row) => {
      const titleData = titlesMap.get(row.title_id as string) as SpotlightTitleData | undefined;
      if (!titleData) return null;
      const analysis = row[analysisKey] as FormatAnalysis | undefined;
      if (!analysis) return null;
      return { title: titleData, analysis };
    })
    .filter((item): item is SpotlightItem => item !== null);
}
