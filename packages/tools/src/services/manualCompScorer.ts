/**
 * Manual Comp Scorer Service
 *
 * Calls the `score-manual-comp` edge function to enrich admin-added comp
 * candidates with the same AI scoring (overall_match_score, dimension_scores,
 * match_reasons, explanation) that AI-generated comps receive.
 *
 * Apps inject their own Supabase client.
 */

import type { SupabaseClientType, SuggestedComp } from '../types';

interface ScoreManualCompPayload {
  title_id: string;
  candidates: Array<{
    comp_title: string;
    comp_year?: number;
    comp_type: string;
    imdb_id?: string;
    imdb_url?: string;
    poster_url?: string;
  }>;
  user_email?: string;
  mode?: 'rich' | 'limited' | 'auto';
}

interface ScoreManualCompResponseBody {
  success: true;
  title_id: string;
  title_name: string;
  mode_used: 'rich' | 'limited';
  scored_comps: SuggestedComp[];
  analysis_summary: string;
  processing_time_ms: number;
  cost_estimate: number;
  engine_version: string;
}

/**
 * Score one or more manual comp candidates against a Korean title using
 * the same AI scoring pipeline as the comps generator.
 *
 * Returns scored comps in the SAME ORDER as the input candidates. The
 * returned comps preserve `imdb_id`, `imdb_url`, `poster_url` from the
 * input and are tagged with `source: 'manual'`.
 */
export async function scoreManualComps(
  supabase: SupabaseClientType,
  titleId: string,
  candidates: SuggestedComp[],
  userEmail?: string,
): Promise<SuggestedComp[]> {
  if (!candidates.length) return [];

  const payload: ScoreManualCompPayload = {
    title_id: titleId,
    candidates: candidates.map((c) => ({
      comp_title: c.comp_title,
      comp_year: c.comp_year,
      comp_type: c.comp_type,
      imdb_id: c.imdb_id,
      imdb_url: c.imdb_url,
      poster_url: c.poster_url,
    })),
    user_email: userEmail,
  };

  const { data, error } = await supabase.functions.invoke<ScoreManualCompResponseBody>(
    'score-manual-comp',
    { body: payload },
  );

  if (error) {
    let errorMessage = 'Failed to score manual comps';
    try {
      if (error.context && typeof error.context.json === 'function') {
        const errorBody = await error.context.json();
        errorMessage = errorBody?.error || error.message || errorMessage;
      } else {
        errorMessage = error.message || errorMessage;
      }
    } catch {
      errorMessage = error.message || errorMessage;
    }
    console.error('[ManualCompScorer] Edge function error:', errorMessage);
    throw new Error(errorMessage);
  }

  if (!data || !Array.isArray(data.scored_comps)) {
    throw new Error('Invalid response from score-manual-comp');
  }

  return data.scored_comps;
}

export function createManualCompScorerService(supabase: SupabaseClientType) {
  return {
    scoreManualComps: (titleId: string, candidates: SuggestedComp[], userEmail?: string) =>
      scoreManualComps(supabase, titleId, candidates, userEmail),
  };
}
