/**
 * useCompsGenerator Hook
 *
 * React hook for the Comps Generator tool.
 * Manages state for generating and saving Hollywood/global comparable titles.
 */

import { useState, useCallback } from 'react';
import type {
  SupabaseClientType,
  CompsGeneratorResponse,
  SuggestedComp,
} from '../types';
import {
  generateComps,
  saveCompsWithAnalysis,
  getCompsWithAnalysis,
} from '../services/compsGeneratorService';

export interface UseCompsGeneratorOptions {
  supabase: SupabaseClientType;
  titleId: string;
  userEmail: string;
}

export interface UseCompsGeneratorReturn {
  // State
  loading: boolean;
  generating: boolean;
  saving: boolean;
  error: string | null;
  response: CompsGeneratorResponse | null;
  selectedComps: Set<string>;
  existingComps: SuggestedComp[];

  // Actions
  generate: (mode?: 'rich' | 'limited' | 'auto') => Promise<void>;
  toggleComp: (compTitle: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  saveSelected: () => Promise<void>;
  loadExisting: () => Promise<void>;
  reset: () => void;
}

export function useCompsGenerator({
  supabase,
  titleId,
  userEmail,
}: UseCompsGeneratorOptions): UseCompsGeneratorReturn {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<CompsGeneratorResponse | null>(null);
  const [selectedComps, setSelectedComps] = useState<Set<string>>(new Set());
  const [existingComps, setExistingComps] = useState<SuggestedComp[]>([]);

  // Load existing comps from database
  const loadExisting = useCallback(async () => {
    setLoading(true);
    try {
      const { analysis } = await getCompsWithAnalysis(supabase, titleId);
      setExistingComps(analysis);
    } catch (err) {
      console.error('[useCompsGenerator] Load existing error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, titleId]);

  // Generate new comps
  const generate = useCallback(async (mode: 'rich' | 'limited' | 'auto' = 'auto') => {
    setGenerating(true);
    setError(null);

    try {
      const result = await generateComps(supabase, titleId, userEmail, mode);
      setResponse(result);

      // Pre-select all generated comps
      const allTitles = result.suggested_comps.map(c => c.comp_title);
      setSelectedComps(new Set(allTitles));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate comps';
      setError(message);
      console.error('[useCompsGenerator] Generate error:', err);
    } finally {
      setGenerating(false);
    }
  }, [supabase, titleId, userEmail]);

  // Toggle comp selection
  const toggleComp = useCallback((compTitle: string) => {
    setSelectedComps(prev => {
      const next = new Set(prev);
      if (next.has(compTitle)) {
        next.delete(compTitle);
      } else {
        next.add(compTitle);
      }
      return next;
    });
  }, []);

  // Select all comps
  const selectAll = useCallback(() => {
    if (response?.suggested_comps) {
      const allTitles = response.suggested_comps.map(c => c.comp_title);
      setSelectedComps(new Set(allTitles));
    }
  }, [response]);

  // Deselect all comps
  const deselectAll = useCallback(() => {
    setSelectedComps(new Set());
  }, []);

  // Save selected comps to database
  const saveSelected = useCallback(async () => {
    if (!response?.suggested_comps || selectedComps.size === 0) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveCompsWithAnalysis(
        supabase,
        titleId,
        Array.from(selectedComps),
        response.suggested_comps
      );

      // Reload existing to show merged results
      await loadExisting();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save comps';
      setError(message);
      console.error('[useCompsGenerator] Save error:', err);
    } finally {
      setSaving(false);
    }
  }, [supabase, titleId, response, selectedComps, loadExisting]);

  // Reset state
  const reset = useCallback(() => {
    setGenerating(false);
    setSaving(false);
    setError(null);
    setResponse(null);
    setSelectedComps(new Set());
  }, []);

  return {
    loading,
    generating,
    saving,
    error,
    response,
    selectedComps,
    existingComps,
    generate,
    toggleComp,
    selectAll,
    deselectAll,
    saveSelected,
    loadExisting,
    reset,
  };
}
