/**
 * Comps Generator Modal
 *
 * Displays AI-generated comp suggestions with dimension breakdowns.
 * Allows admin to select and save comps to the title.
 */

import { useState, useEffect } from 'react';
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
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Film,
  Tv,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';

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

  // Reset state when modal opens
  useEffect(() => {
    if (open && titleId) {
      setResponse(null);
      setError(null);
      setSelectedComps(new Set());
      setExpandedComps(new Set());
      generateComps();
    }
  }, [open, titleId]);

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
    if (response) {
      setSelectedComps(new Set(response.suggested_comps.map((c) => c.comp_title)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedComps(new Set());
  };

  const handleSave = async () => {
    if (!titleId || selectedComps.size === 0 || !response) return;

    setSaving(true);
    try {
      // Save both comp titles AND full analysis
      await compsGeneratorService.saveCompsWithAnalysis(
        titleId,
        Array.from(selectedComps),
        response.suggested_comps
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
      return <Tv className="h-4 w-4" />;
    }
    return <Film className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Generate Comps
            {titleName && (
              <span className="text-gray-500 font-normal">
                for "{titleName}"
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <div className="text-center">
              <p className="font-medium">Analyzing title...</p>
              <p className="text-sm text-gray-500">
                This may take 10-15 seconds
              </p>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>1. Collecting title data...</p>
              <p>2. Deconstructing story elements...</p>
              <p>3. Finding Hollywood comparables...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
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
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
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
                {selectedComps.size} of {response.suggested_comps.length} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={selectedComps.size === response.suggested_comps.length}
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

            {/* Comp Cards */}
            <div className="space-y-3">
              {response.suggested_comps.map((comp) => (
                <CompCard
                  key={comp.comp_title}
                  comp={comp}
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save {selectedComps.size} Comp{selectedComps.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
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
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  getScoreColor: (score: number) => string;
  getScoreBgColor: (score: number) => string;
  getTypeIcon: (type: string) => JSX.Element;
}

function CompCard({
  comp,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  getScoreColor,
  getScoreBgColor,
  getTypeIcon,
}: CompCardProps) {
  return (
    <div
      className={`border rounded-lg transition-colors ${
        selected ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'
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

              {/* Score Badge */}
              <Badge className={`${getScoreColor(comp.overall_match_score)} text-white`}>
                {comp.overall_match_score}% Match
              </Badge>
            </div>

            {/* Explanation */}
            <p className="text-sm text-gray-600 mt-2">
              {comp.explanation}
            </p>

            {/* Match Reasons */}
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
          </div>
        </div>
      </div>

      {/* Expandable Dimension Scores */}
      <Collapsible open={expanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger asChild>
          <button
            className="w-full px-4 py-2 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide dimension breakdown
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
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
    </div>
  );
}

export default CompsGeneratorModal;
