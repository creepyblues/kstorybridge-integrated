/**
 * Comps Generator Modal
 *
 * Displays AI-generated comp suggestions with dimension breakdowns.
 * Allows admin to select and save comps to the title.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  compsGeneratorService,
  type CompsGeneratorResponse,
  type SuggestedComp,
} from '@/services/compsGeneratorService';
import { scoreManualComps } from '@kstorybridge/tools';
import { supabase } from '@/lib/supabase';
import { Icon } from '@iconify/react';
import ModalErrorBoundary from '@/components/ModalErrorBoundary';
import { ManualCompSearch } from './ManualCompSearch';

// =====================================================================
// LOADING UX CONFIGURATION
// =====================================================================

const LOADING_PHASES = [
  { id: 'collect', label: 'Collecting title data', duration: 1000 },
  { id: 'analyze', label: 'Analyzing story elements', duration: 2000 },
  { id: 'deconstruct', label: 'Deconstructing narrative DNA', duration: 6000 },
  { id: 'match', label: 'Finding Hollywood comparables', duration: 6000 },
  { id: 'enrich', label: 'Enriching with IMDB data', duration: 2000 },
];

const TOTAL_ESTIMATED_TIME = LOADING_PHASES.reduce((sum, p) => sum + p.duration, 0);

const LOADING_MESSAGES = [
  { emoji: '🎬', text: "Consulting Hollywood's best matchmakers..." },
  { emoji: '🎭', text: 'Teaching AI about K-drama plot twists...' },
  { emoji: '🍿', text: 'Popping fresh comps for your title...' },
  { emoji: '🎯', text: 'Finding shows that would make Netflix jealous...' },
  { emoji: '🔮', text: "Reading the entertainment industry's crystal ball..." },
  { emoji: '📺', text: 'Scanning every binge-worthy show since 2010...' },
  { emoji: '🌏', text: 'Translating Korean magic into Hollywood gold...' },
  { emoji: '⚡', text: 'Speed-dating through the streaming catalog...' },
  { emoji: '🎪', text: 'Assembling the ultimate comp squad...' },
  { emoji: '✨', text: 'Sprinkling some AI magic on your title...' },
];

const FUN_FACTS = [
  'Squid Game became Netflix\'s most-watched series with 1.65B viewing hours',
  'Korean webtoons have inspired 50+ Hollywood adaptations since 2020',
  'The K-content wave (Hallyu) reaches 180+ countries',
  'All of Us Are Dead was greenlit 12 years after its webtoon debut',
  'Sweet Home\'s webtoon had 1.2B views before becoming a Netflix series',
  'Parasite was the first non-English film to win Best Picture at the Oscars',
  'K-dramas are now available in 190+ countries worldwide',
];

interface CompsGeneratorModalProps {
  titleId: string | null;
  titleName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function CompsGeneratorModal({
  titleId,
  titleName,
  open,
  onOpenChange,
  onSaved,
}: CompsGeneratorModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [response, setResponse] = useState<CompsGeneratorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedComps, setSelectedComps] = useState<Set<string>>(new Set());
  const [expandedComps, setExpandedComps] = useState<Set<string>>(new Set());
  const [manualComps, setManualComps] = useState<SuggestedComp[]>([]);
  // Tracks which manual comps are currently being AI-scored (keyed by imdb_id, falls back to comp_title)
  const [scoringComps, setScoringComps] = useState<Set<string>>(new Set());

  // Loading progress state
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [funFact, setFunFact] = useState(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open && titleId) {
      setResponse(null);
      setError(null);
      setSelectedComps(new Set());
      setExpandedComps(new Set());
      setManualComps([]);
      setScoringComps(new Set());
      // Reset loading progress state
      setCurrentPhase(0);
      setCurrentMessage(0);
      setElapsedTime(0);
      setFunFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
      generateComps();
    }
  }, [open, titleId]);

  // Time-based loading progress simulation
  useEffect(() => {
    if (!loading) {
      // Clear timers when loading stops
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      if (messageTimerRef.current) clearInterval(messageTimerRef.current);
      return;
    }

    // Progress timer - updates every 100ms for smooth progress bar
    loadingTimerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 100;

        // Calculate which phase we should be in based on elapsed time
        let accumulated = 0;
        for (let i = 0; i < LOADING_PHASES.length; i++) {
          accumulated += LOADING_PHASES[i].duration;
          if (newTime < accumulated) {
            setCurrentPhase(i);
            break;
          }
        }

        // Cap at 95% until actually complete (to handle variance in actual time)
        return Math.min(newTime, TOTAL_ESTIMATED_TIME * 0.95);
      });
    }, 100);

    // Message rotation timer - changes every 3.5 seconds
    messageTimerRef.current = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3500);

    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      if (messageTimerRef.current) clearInterval(messageTimerRef.current);
    };
  }, [loading]);

  // Calculate progress percentage
  const progressPercent = Math.min(Math.round((elapsedTime / TOTAL_ESTIMATED_TIME) * 100), 95);

  const generateComps = async () => {
    if (!titleId || !user?.email) return;

    setLoading(true);
    setError(null);

    try {
      const result = await compsGeneratorService.generateComps(
        titleId,
        user.email,
        'auto'
      );
      setResponse(result);

      // Pre-select all comps by default
      const allComps = new Set(result.suggested_comps.map((c) => c.comp_title));
      setSelectedComps(allComps);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate comps';
      setError(message);
      console.error('[CompsGenerator] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComp = (compTitle: string) => {
    setSelectedComps((prev) => {
      const next = new Set(prev);
      if (next.has(compTitle)) {
        next.delete(compTitle);
      } else {
        next.add(compTitle);
      }
      return next;
    });
  };

  const handleToggleExpand = (compTitle: string) => {
    setExpandedComps((prev) => {
      const next = new Set(prev);
      if (next.has(compTitle)) {
        next.delete(compTitle);
      } else {
        next.add(compTitle);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allCompTitles = [
      ...(response?.suggested_comps.map((c) => c.comp_title) || []),
      ...manualComps.map((c) => c.comp_title),
    ];
    setSelectedComps(new Set(allCompTitles));
  };

  const handleDeselectAll = () => {
    setSelectedComps(new Set());
  };

  // Stable key for tracking a manual comp across re-renders.
  // Prefers imdb_id (set by OMDB search) and falls back to title.
  const manualCompKey = (comp: SuggestedComp) => comp.imdb_id || comp.comp_title;

  // Handler for adding manual comps. Inserts the unscored comp immediately so
  // the admin sees it in the list, then kicks off AI scoring in the background.
  const handleAddManualComp = (comp: SuggestedComp) => {
    setManualComps((prev) => [...prev, comp]);
    setSelectedComps((prev) => new Set([...prev, comp.comp_title]));

    if (!titleId || !user?.email) return;

    const key = manualCompKey(comp);
    setScoringComps((prev) => new Set(prev).add(key));

    scoreManualComps(supabase, titleId, [comp], user.email)
      .then((scored) => {
        const enriched = scored[0];
        if (!enriched) throw new Error('Empty scoring response');

        setManualComps((prev) =>
          prev.map((c) => (manualCompKey(c) === key ? { ...enriched, source: 'manual' } : c)),
        );

        // Keep the comp selected even if the model returned a different title casing.
        setSelectedComps((prev) => {
          if (enriched.comp_title === comp.comp_title) return prev;
          const next = new Set(prev);
          if (next.has(comp.comp_title)) {
            next.delete(comp.comp_title);
            next.add(enriched.comp_title);
          }
          return next;
        });
      })
      .catch((err) => {
        console.error('[CompsGenerator] Manual comp scoring failed:', err);
        toast({
          title: 'Could not score this comp',
          description: 'Saved without AI details. Try removing and re-adding.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setScoringComps((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      });
  };

  // Handler for removing manual comps
  const handleRemoveManualComp = (compTitle: string) => {
    setManualComps((prev) => prev.filter((c) => c.comp_title !== compTitle));
    setSelectedComps((prev) => {
      const next = new Set(prev);
      next.delete(compTitle);
      return next;
    });
  };

  // Get all imdbIDs for duplicate prevention
  const existingImdbIds = new Set([
    ...((response?.suggested_comps?.map((c) => c.imdb_id).filter(Boolean) ?? []) as string[]),
    ...manualComps.map((c) => c.imdb_id).filter(Boolean) as string[],
  ]);

  // Combined comps (AI + manual)
  const allComps = [
    ...(response?.suggested_comps || []),
    ...manualComps,
  ];

  const totalCompCount = allComps.length;

  const handleSave = async () => {
    if (!titleId || selectedComps.size === 0) return;

    setSaving(true);
    try {
      // Combine AI and manual comps for saving
      const allCompsForSave = [
        ...(response?.suggested_comps || []),
        ...manualComps,
      ];

      // Save both comp titles AND full analysis
      await compsGeneratorService.saveCompsWithAnalysis(
        titleId,
        Array.from(selectedComps),
        allCompsForSave
      );

      toast({
        title: 'Comps Saved',
        description: `${selectedComps.size} comp(s) with full analysis saved to title`,
      });

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save comps';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 55) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 55) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('tv') || type.toLowerCase().includes('series')) {
      return <Icon icon="solar:tv-bold-duotone" className="h-4 w-4" />;
    }
    return <Icon icon="solar:clapperboard-bold-duotone" className="h-4 w-4" />;
  };

  // Reset error boundary when modal reopens
  const handleErrorReset = useCallback(() => {
    setError(null);
    setResponse(null);
    generateComps();
  }, [titleId, user?.email]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <ModalErrorBoundary
          onReset={handleErrorReset}
          fallbackMessage="An error occurred while generating comps. Please try again."
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="solar:stars-bold-duotone" className="h-5 w-5 text-purple-500" aria-hidden="true" />
              Generate Comps
              {titleName && (
                <span className="text-gray-500 font-normal">
                  for "{titleName}"
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Enhanced Loading State */}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-6">
              {/* Rotating entertaining message */}
              <div className="text-center transition-opacity duration-300" key={currentMessage}>
                <span className="text-3xl mb-2 block">{LOADING_MESSAGES[currentMessage].emoji}</span>
                <p className="text-lg font-medium text-gray-700 italic">
                  "{LOADING_MESSAGES[currentMessage].text}"
                </p>
              </div>

              {/* Phase stepper */}
              <div className="w-full max-w-sm space-y-2">
                {LOADING_PHASES.map((phase, index) => {
                  const isComplete = index < currentPhase;
                  const isCurrent = index === currentPhase;
                  const isPending = index > currentPhase;

                  return (
                    <div
                      key={phase.id}
                      className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                        isComplete ? 'text-green-600' :
                        isCurrent ? 'text-purple-600 font-medium' :
                        'text-gray-400'
                      }`}
                    >
                      {/* Status indicator */}
                      <span className="w-5 flex justify-center">
                        {isComplete && (
                          <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-green-500" />
                        )}
                        {isCurrent && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                          </span>
                        )}
                        {isPending && (
                          <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                        )}
                      </span>
                      {/* Phase label */}
                      <span>{phase.label}{isCurrent && '...'}</span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-sm">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Fun fact */}
              <div className="text-center max-w-sm mt-2">
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <p className="text-xs text-purple-600 flex items-start gap-2">
                    <Icon icon="solar:lightbulb-bolt-bold-duotone" className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Did you know?</strong> {funFact}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <Icon icon="solar:danger-circle-bold-duotone" className="h-8 w-8 text-red-500" />
            <div className="text-center">
              <p className="font-medium text-red-600">Generation Failed</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
            <Button onClick={generateComps} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Results */}
        {response && !loading && (
          <>
            {/* Analysis Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Icon icon="solar:info-circle-bold-duotone" className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    Analysis Mode: {response.mode_used === 'rich' ? 'Rich Data' : 'Limited Data'}
                    <span className="font-normal text-gray-500 ml-2">
                      ({response.data_completeness}% data completeness)
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {response.analysis_summary}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Generated in {(response.processing_time_ms / 1000).toFixed(1)}s
                    • Est. cost: ${response.cost_estimate.toFixed(3)}
                  </p>
                </div>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {selectedComps.size} of {totalCompCount} selected
                {manualComps.length > 0 && (
                  <span className="text-gray-400 ml-1">
                    ({manualComps.length} manual)
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={selectedComps.size === totalCompCount}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={selectedComps.size === 0}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            {/* AI-Generated Comp Cards */}
            <div className="space-y-3">
              {response.suggested_comps.map((comp) => (
                <CompCard
                  key={comp.comp_title}
                  comp={{ ...comp, source: comp.source || 'ai' }}
                  selected={selectedComps.has(comp.comp_title)}
                  expanded={expandedComps.has(comp.comp_title)}
                  onToggleSelect={() => handleToggleComp(comp.comp_title)}
                  onToggleExpand={() => handleToggleExpand(comp.comp_title)}
                  getScoreColor={getScoreColor}
                  getScoreBgColor={getScoreBgColor}
                  getTypeIcon={getTypeIcon}
                />
              ))}
            </div>

            {/* Manual Comp Search Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="solar:add-circle-bold-duotone" className="h-5 w-5 text-teal-500" />
                <h4 className="font-medium text-gray-700">Add Manual Comp</h4>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Search IMDB to add Hollywood/global titles not in the AI suggestions
              </p>
              <ManualCompSearch
                onAdd={handleAddManualComp}
                existingImdbIds={existingImdbIds}
                disabled={loading || saving}
              />
            </div>

            {/* Manual Comp Cards */}
            {manualComps.length > 0 && (
              <div className="mt-4 space-y-3">
                {manualComps.map((comp) => (
                  <CompCard
                    key={manualCompKey(comp)}
                    comp={comp}
                    selected={selectedComps.has(comp.comp_title)}
                    expanded={expandedComps.has(comp.comp_title)}
                    scoring={scoringComps.has(manualCompKey(comp))}
                    onToggleSelect={() => handleToggleComp(comp.comp_title)}
                    onToggleExpand={() => handleToggleExpand(comp.comp_title)}
                    onRemove={() => handleRemoveManualComp(comp.comp_title)}
                    getScoreColor={getScoreColor}
                    getScoreBgColor={getScoreBgColor}
                    getTypeIcon={getTypeIcon}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        {response && !loading && (
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || selectedComps.size === 0}
            >
              {saving ? (
                <>
                  <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="solar:check-read-bold-duotone" className="h-4 w-4 mr-2" />
                  Save {selectedComps.size} Comp{selectedComps.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
        </ModalErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================================
// COMP CARD COMPONENT
// =====================================================================

interface CompCardProps {
  comp: SuggestedComp;
  selected: boolean;
  expanded: boolean;
  scoring?: boolean;  // True while AI scoring is in flight (manual comps)
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onRemove?: () => void;  // Optional remove handler for manual comps
  getScoreColor: (score: number) => string;
  getScoreBgColor: (score: number) => string;
  getTypeIcon: (type: string) => JSX.Element;
}

function CompCard({
  comp,
  selected,
  expanded,
  scoring = false,
  onToggleSelect,
  onToggleExpand,
  onRemove,
  getScoreColor,
  getScoreBgColor,
  getTypeIcon,
}: CompCardProps) {
  const isManual = comp.source === 'manual';
  // A manual comp is "scored" once AI scoring has populated dimensions.
  // Unscored = scoring in flight OR scoring failed/skipped.
  const isScored = comp.dimension_scores && comp.dimension_scores.length > 0;

  return (
    <div
      className={`border rounded-lg transition-colors ${
        selected
          ? isManual
            ? 'border-teal-300 bg-teal-50/30'
            : 'border-purple-300 bg-purple-50/30'
          : 'border-gray-200'
      }`}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            className="mt-1"
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Title */}
              <h4 className="font-medium text-gray-900">
                {comp.comp_title}
              </h4>

              {/* Year & Type */}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                {getTypeIcon(comp.comp_type)}
                <span>
                  {comp.comp_year && `${comp.comp_year} • `}
                  {comp.comp_type}
                </span>
              </div>

              {/* Score Badge / Scoring spinner / Manually Added fallback */}
              {scoring ? (
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 inline-flex items-center gap-1">
                  <Icon icon="solar:refresh-circle-bold-duotone" className="h-3 w-3 animate-spin" />
                  Scoring…
                </Badge>
              ) : isManual && !isScored ? (
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                  Manually Added
                </Badge>
              ) : (
                <Badge className={`${getScoreColor(comp.overall_match_score)} text-white`}>
                  {comp.overall_match_score}% Match
                </Badge>
              )}

              {/* Small "Manual" tag alongside score for scored manual comps */}
              {isManual && isScored && !scoring && (
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
                  Manual
                </Badge>
              )}
            </div>

            {/* Explanation */}
            <p className="text-sm text-gray-600 mt-2">
              {comp.explanation}
            </p>

            {/* Match Reasons — show whenever they exist (AI comps or scored manual comps) */}
            {comp.match_reasons && comp.match_reasons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {comp.match_reasons.slice(0, 3).map((reason, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                  >
                    {reason}
                  </span>
                ))}
                {comp.match_reasons.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{comp.match_reasons.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* IMDB Link for manual comps */}
            {isManual && comp.imdb_url && (
              <div className="mt-2">
                <a
                  href={comp.imdb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
                >
                  <Icon icon="solar:link-bold" className="h-3 w-3" />
                  View on IMDB
                </a>
              </div>
            )}
          </div>

          {/* Remove button for manual comps */}
          {isManual && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove comp"
            >
              <Icon icon="solar:trash-bin-trash-bold-duotone" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Dimension Scores — show whenever dimensions exist */}
      {comp.dimension_scores && comp.dimension_scores.length > 0 && (
      <Collapsible open={expanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger asChild>
          <button
            className="w-full px-4 py-2 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {expanded ? (
              <>
                <Icon icon="solar:alt-arrow-up-bold-duotone" className="h-4 w-4" />
                Hide dimension breakdown
              </>
            ) : (
              <>
                <Icon icon="solar:alt-arrow-down-bold-duotone" className="h-4 w-4" />
                Show dimension breakdown
              </>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              {comp.dimension_scores.map((dim) => (
                <div
                  key={dim.dimension}
                  className={`p-2 rounded border ${getScoreBgColor(dim.score)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {compsGeneratorService.formatDimensionName(dim.dimension)}
                    </span>
                    <span className={`text-xs font-bold ${
                      dim.score >= 85 ? 'text-green-600' :
                      dim.score >= 70 ? 'text-blue-600' :
                      dim.score >= 55 ? 'text-yellow-600' :
                      'text-gray-500'
                    }`}>
                      {dim.score}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {dim.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      )}
    </div>
  );
}

export default CompsGeneratorModal;
