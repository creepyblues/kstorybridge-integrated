/**
 * Format Fit Analyzer Modal (Creator App)
 *
 * AI-powered analysis of how well a title fits different content formats:
 * Film, TV Series, Animation, Microdrama, Audio Drama
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import {
  formatFitService,
  type FormatFitResponse,
  type FormatAnalysis,
  type FormatType,
  FORMAT_DISPLAY_NAMES,
  getFitLevelLabel,
  formatDimensionName,
} from '@/services/formatFitService';
import { Icon } from '@iconify/react';

interface FormatFitAnalyzerModalProps {
  titleId: string | null;
  titleName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const FORMAT_ICONS_MAP: Record<FormatType, React.ReactNode> = {
  film: <Icon icon="solar:clapperboard-bold-duotone" className="h-5 w-5" />,
  tv_series: <Icon icon="solar:tv-bold-duotone" className="h-5 w-5" />,
  animation: <Icon icon="solar:pallete-bold-duotone" className="h-5 w-5" />,
  microdrama: <Icon icon="solar:smartphone-bold-duotone" className="h-5 w-5" />,
  audio_drama: <Icon icon="solar:headphones-bold-duotone" className="h-5 w-5" />,
};

export function FormatFitAnalyzerModal({
  titleId,
  titleName,
  open,
  onOpenChange,
  onComplete,
}: FormatFitAnalyzerModalProps) {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<FormatFitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFormats, setExpandedFormats] = useState<Set<FormatType>>(new Set());

  // Reset state when modal opens
  useEffect(() => {
    if (open && titleId) {
      setResponse(null);
      setError(null);
      setExpandedFormats(new Set());
      generateAnalysis();
    }
  }, [open, titleId]);

  const generateAnalysis = async () => {
    if (!titleId || !user?.email) return;

    setLoading(true);
    setError(null);

    try {
      const result = await formatFitService.analyzeFormatFit(
        titleId,
        user.email,
        'auto'
      );
      setResponse(result);
      setExpandedFormats(new Set([result.best_format]));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze format fit';
      setError(message);
      console.error('[FormatFitAnalyzer] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (format: FormatType) => {
    setExpandedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(format)) {
        next.delete(format);
      } else {
        next.add(format);
      }
      return next;
    });
  };

  const handleClose = () => {
    if (response) {
      onComplete?.();
    }
    onOpenChange(false);
  };

  const getScoreBarColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:stars-bold-duotone" className="h-5 w-5 text-purple-500" />
            Format Fit Analysis
            {titleName && (
              <span className="text-gray-500 font-normal">
                for "{titleName}"
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis of how well this title fits different content formats.
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-purple-500" />
            <div className="text-center">
              <p className="font-medium">Analyzing title for format fit...</p>
              <p className="text-sm text-gray-500">
                This may take 15-20 seconds
              </p>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>1. Collecting title data...</p>
              <p>2. Deconstructing story elements...</p>
              <p>3. Scoring across 5 formats...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <Icon icon="solar:danger-circle-bold-duotone" className="h-8 w-8 text-red-500" />
            <div className="text-center">
              <p className="font-medium text-red-600">Analysis Failed</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
            <Button onClick={generateAnalysis} variant="outline" className="border-gray-300">
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
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Analysis Mode: {response.mode_used === 'rich' ? 'Rich Data' : 'Limited Data'}
                    <span className="font-normal text-gray-500 ml-2">
                      ({response.data_completeness}% data completeness)
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Generated in {(response.processing_time_ms / 1000).toFixed(1)}s
                    {' '}• Est. cost: ${response.cost_estimate.toFixed(3)}
                  </p>
                </div>
              </div>
            </div>

            {/* Best Format Highlight */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Icon icon="solar:cup-star-bold-duotone" className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Best Format Match</p>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {FORMAT_ICONS_MAP[response.best_format]}
                    {FORMAT_DISPLAY_NAMES[response.best_format]}
                    <Badge className="bg-purple-500 text-white ml-2">
                      {response.best_format_score}%
                    </Badge>
                  </p>
                </div>
              </div>
            </div>

            {/* Format Score Overview */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {(['film', 'tv_series', 'animation', 'microdrama', 'audio_drama'] as FormatType[]).map((format) => {
                const score = response.scores[format];
                const isBest = format === response.best_format;
                return (
                  <div
                    key={format}
                    className={`p-3 rounded-lg border text-center cursor-pointer transition-all hover:border-gray-400 ${
                      isBest
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => handleToggleExpand(format)}
                  >
                    <div className="flex justify-center mb-2 text-gray-600">
                      {FORMAT_ICONS_MAP[format]}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {FORMAT_DISPLAY_NAMES[format]}
                    </p>
                    <p className={`text-xl font-bold ${
                      score >= 80 ? 'text-green-600' :
                      score >= 60 ? 'text-blue-600' :
                      score >= 40 ? 'text-amber-600' :
                      'text-gray-500'
                    }`}>
                      {score}
                    </p>
                    <p className="text-xs text-gray-400">
                      {getFitLevelLabel(score).replace(' Fit', '')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Detailed Format Cards */}
            <div className="space-y-3">
              {(['film', 'tv_series', 'animation', 'microdrama', 'audio_drama'] as FormatType[]).map((format) => {
                const analysis = response[`${format}_analysis`] as FormatAnalysis;
                const isExpanded = expandedFormats.has(format);
                const isBest = format === response.best_format;

                return (
                  <FormatCard
                    key={format}
                    format={format}
                    analysis={analysis}
                    expanded={isExpanded}
                    isBest={isBest}
                    onToggleExpand={() => handleToggleExpand(format)}
                    getScoreBarColor={getScoreBarColor}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Footer */}
        {response && !loading && (
          <DialogFooter className="mt-6">
            <Button onClick={handleClose} className="bg-black text-white hover:bg-gray-800">
              <Icon icon="solar:check-read-bold-duotone" className="h-4 w-4 mr-2" />
              Done
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =====================================================================
// FORMAT CARD COMPONENT
// =====================================================================

interface FormatCardProps {
  format: FormatType;
  analysis: FormatAnalysis;
  expanded: boolean;
  isBest: boolean;
  onToggleExpand: () => void;
  getScoreBarColor: (score: number) => string;
}

function FormatCard({
  format,
  analysis,
  expanded,
  isBest,
  onToggleExpand,
  getScoreBarColor,
}: FormatCardProps) {
  return (
    <div
      className={`border rounded-lg transition-colors ${
        isBest ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'
      }`}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isBest ? 'bg-purple-100' : 'bg-gray-100'}`}>
              {FORMAT_ICONS_MAP[format]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">
                  {FORMAT_DISPLAY_NAMES[format]}
                </h4>
                {isBest && (
                  <Badge className="bg-purple-500 text-white text-xs">
                    Best Match
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {analysis.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`text-2xl font-bold ${
                analysis.overall_score >= 80 ? 'text-green-600' :
                analysis.overall_score >= 60 ? 'text-blue-600' :
                analysis.overall_score >= 40 ? 'text-amber-600' :
                'text-gray-500'
              }`}>
                {analysis.overall_score}%
              </p>
              <p className="text-xs text-gray-400">
                {getFitLevelLabel(analysis.overall_score)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getScoreBarColor(analysis.overall_score)}`}
              style={{ width: `${analysis.overall_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <Collapsible open={expanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger asChild>
          <button
            className="w-full px-4 py-2 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {expanded ? (
              <>
                <Icon icon="solar:alt-arrow-up-bold-duotone" className="h-4 w-4" />
                Hide details
              </>
            ) : (
              <>
                <Icon icon="solar:alt-arrow-down-bold-duotone" className="h-4 w-4" />
                Show details
              </>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 space-y-4">
            {/* Dimension Scores */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Dimension Scores</h5>
              <div className="grid grid-cols-2 gap-2">
                {analysis.dimensions.map((dim) => (
                  <div
                    key={dim.dimension}
                    className={`p-2 rounded border ${
                      dim.score >= 80 ? 'bg-green-50 border-green-200' :
                      dim.score >= 60 ? 'bg-blue-50 border-blue-200' :
                      dim.score >= 40 ? 'bg-amber-50 border-amber-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {formatDimensionName(dim.dimension)}
                      </span>
                      <span className={`text-xs font-bold ${
                        dim.score >= 80 ? 'text-green-600' :
                        dim.score >= 60 ? 'text-blue-600' :
                        dim.score >= 40 ? 'text-amber-600' :
                        'text-gray-500'
                      }`}>
                        {dim.score}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{dim.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Challenges */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                  <Icon icon="solar:check-read-bold-duotone" className="h-4 w-4" />
                  Strengths
                </h5>
                <ul className="space-y-1">
                  {analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-green-500">+</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                  <Icon icon="solar:danger-circle-bold-duotone" className="h-4 w-4" />
                  Challenges
                </h5>
                <ul className="space-y-1">
                  {analysis.challenges.map((challenge, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-red-500">-</span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-blue-700 mb-2">Recommendations</h5>
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-blue-500">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Microdrama-specific insights */}
            {format === 'microdrama' && analysis.format_specific && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <h5 className="text-sm font-medium text-purple-700 mb-2">
                  Microdrama-Specific Insights
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Cliffhanger Potential:</span>
                    <span className="font-medium text-gray-700 ml-1">
                      {analysis.format_specific.cliffhanger_potential}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Episode Structure Fit:</span>
                    <span className="font-medium text-gray-700 ml-1">
                      {analysis.format_specific.episode_structure_fit}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Vertical Filming:</span>
                    <span className="font-medium text-gray-700 ml-1">
                      {analysis.format_specific.vertical_filming_compatibility}%
                    </span>
                  </div>
                  {analysis.format_specific.trope_alignment?.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Matching Tropes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.format_specific.trope_alignment.map((trope, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {trope.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default FormatFitAnalyzerModal;
