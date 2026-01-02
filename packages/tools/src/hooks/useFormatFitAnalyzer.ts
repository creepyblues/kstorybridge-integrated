/**
 * useFormatFitAnalyzer Hook
 *
 * React hook for the Format Fit Analyzer tool.
 * Manages state for analyzing title adaptation fit across 5 formats.
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  SupabaseClientType,
  FormatFitResponse,
  FormatFitRecord,
  FormatType,
} from '../types';
import {
  analyzeFormatFit,
  getFormatFit,
  getBestFormat,
} from '../services/formatFitService';

export interface UseFormatFitAnalyzerOptions {
  supabase: SupabaseClientType;
  titleId: string;
  userEmail: string;
  autoLoad?: boolean; // Load existing analysis on mount (default: true)
}

export interface UseFormatFitAnalyzerReturn {
  // State
  loading: boolean;
  analyzing: boolean;
  error: string | null;
  response: FormatFitResponse | null;
  existingRecord: FormatFitRecord | null;
  bestFormat: { format: FormatType; score: number } | null;
  hasExistingAnalysis: boolean;

  // Actions
  analyze: (mode?: 'rich' | 'limited' | 'auto') => Promise<void>;
  loadExisting: () => Promise<void>;
  reset: () => void;
}

export function useFormatFitAnalyzer({
  supabase,
  titleId,
  userEmail,
  autoLoad = true,
}: UseFormatFitAnalyzerOptions): UseFormatFitAnalyzerReturn {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<FormatFitResponse | null>(null);
  const [existingRecord, setExistingRecord] = useState<FormatFitRecord | null>(null);

  // Calculate best format from response or existing record
  const bestFormat = response
    ? getBestFormat(response.scores)
    : existingRecord
      ? getBestFormat({
          film: existingRecord.film_score,
          tv_series: existingRecord.tv_series_score,
          animation: existingRecord.animation_score,
          microdrama: existingRecord.microdrama_score,
          audio_drama: existingRecord.audio_drama_score,
        })
      : null;

  const hasExistingAnalysis = existingRecord !== null;

  // Load existing analysis from database
  const loadExisting = useCallback(async () => {
    setLoading(true);
    try {
      const record = await getFormatFit(supabase, titleId);
      setExistingRecord(record);
    } catch (err) {
      console.error('[useFormatFitAnalyzer] Load existing error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, titleId]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadExisting();
    }
  }, [autoLoad, loadExisting]);

  // Analyze title for format fit
  const analyze = useCallback(async (mode: 'rich' | 'limited' | 'auto' = 'auto') => {
    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeFormatFit(supabase, titleId, userEmail, mode);
      setResponse(result);

      // Edge function auto-saves, so reload existing record
      await loadExisting();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze format fit';
      setError(message);
      console.error('[useFormatFitAnalyzer] Analyze error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [supabase, titleId, userEmail, loadExisting]);

  // Reset state
  const reset = useCallback(() => {
    setAnalyzing(false);
    setError(null);
    setResponse(null);
  }, []);

  return {
    loading,
    analyzing,
    error,
    response,
    existingRecord,
    bestFormat,
    hasExistingAnalysis,
    analyze,
    loadExisting,
    reset,
  };
}
