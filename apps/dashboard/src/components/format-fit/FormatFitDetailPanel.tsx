/**
 * Format Fit Detail Panel
 *
 * Full format fit analysis display for title detail pages.
 * Shows all 5 format scores with expandable detailed analysis.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  formatFitService,
  type FormatFitRecord,
  type FormatAnalysis,
  type FormatType,
  FORMAT_DISPLAY_NAMES,
  FORMAT_DESCRIPTIONS,
  getFitLevelLabel,
  formatDimensionName,
} from '@/services/formatFitService';
import { Icon } from '@iconify/react';

interface FormatFitDetailPanelProps {
  titleId: string;
  className?: string;
}

const FORMAT_ICONS: Record<FormatType, React.ReactNode> = {
  film: <Icon icon="solar:clapperboard-bold-duotone" className="h-5 w-5" />,
  tv_series: <Icon icon="solar:tv-bold-duotone" className="h-5 w-5" />,
  animation: <Icon icon="solar:pallete-bold-duotone" className="h-5 w-5" />,
  microdrama: <Icon icon="solar:smartphone-bold-duotone" className="h-5 w-5" />,
  audio_drama: <Icon icon="solar:headphones-bold-duotone" className="h-5 w-5" />,
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-gray-500';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-gray-400';
};

export function FormatFitDetailPanel({
  titleId,
  className = '',
}: FormatFitDetailPanelProps) {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<FormatFitRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFormats, setExpandedFormats] = useState<Set<FormatType>>(new Set());

  useEffect(() => {
    fetchFormatFit();
  }, [titleId]);

  const fetchFormatFit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await formatFitService.getFormatFit(titleId);
      setRecord(data);
      // Auto-expand the best format if we have data
      if (data) {
        const bestFormat = getBestFormatFromRecord(data);
        setExpandedFormats(new Set([bestFormat]));
      }
    } catch (err) {
      console.error('[FormatFitDetailPanel] Error:', err);
      setError('Failed to load format fit analysis');
    } finally {
      setLoading(false);
    }
  };

  const getBestFormatFromRecord = (rec: FormatFitRecord): FormatType => {
    const scores: Record<FormatType, number> = {
      film: rec.film_score,
      tv_series: rec.tv_series_score,
      animation: rec.animation_score,
      microdrama: rec.microdrama_score,
      audio_drama: rec.audio_drama_score,
    };
    return Object.entries(scores).reduce((best, [format, score]) =>
      score > scores[best as FormatType] ? (format as FormatType) : best,
      'film' as FormatType
    );
  };

  const toggleFormat = (format: FormatType) => {
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

  // Loading state
  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="py-8 flex items-center justify-center">
          <Icon icon="solar:refresh-circle-bold-duotone" className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`${className}`}>
        <CardContent className="py-8 flex flex-col items-center justify-center gap-2">
          <Icon icon="solar:danger-circle-bold-duotone" className="h-6 w-6 text-red-500" />
          <p className="text-sm text-gray-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchFormatFit}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!record) {
    return (
      <Card className={`${className}`}>
        <CardContent className="py-8 flex flex-col items-center justify-center gap-2">
          <Icon icon="solar:info-circle-bold-duotone" className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-500">Format fit analysis not available</p>
        </CardContent>
      </Card>
    );
  }

  const bestFormat = getBestFormatFromRecord(record);
  const scores: Record<FormatType, number> = {
    film: record.film_score,
    tv_series: record.tv_series_score,
    animation: record.animation_score,
    microdrama: record.microdrama_score,
    audio_drama: record.audio_drama_score,
  };

  const getAnalysis = (format: FormatType): FormatAnalysis | null => {
    switch (format) {
      case 'film':
        return record.film_analysis;
      case 'tv_series':
        return record.tv_series_analysis;
      case 'animation':
        return record.animation_analysis;
      case 'microdrama':
        return record.microdrama_analysis;
      case 'audio_drama':
        return record.audio_drama_analysis;
      default:
        return null;
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon icon="solar:cup-star-bold-duotone" className="h-5 w-5 text-purple-500" />
          Format Fit Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best Format Highlight */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              {FORMAT_ICONS[bestFormat]}
            </div>
            <div className="flex-1">
              <p className="text-sm text-purple-600 font-medium">Best Format Match</p>
              <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {FORMAT_DISPLAY_NAMES[bestFormat]}
                <Badge className="bg-purple-500 text-white">
                  {scores[bestFormat]}%
                </Badge>
              </span>
            </div>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-5 gap-2">
          {(['film', 'tv_series', 'animation', 'microdrama', 'audio_drama'] as FormatType[]).map(
            (format) => {
              const score = scores[format];
              const isBest = format === bestFormat;

              return (
                <button
                  key={format}
                  onClick={() => toggleFormat(format)}
                  className={`p-2 rounded-lg border text-center transition-all hover:shadow-md ${
                    isBest
                      ? 'border-purple-300 bg-purple-50'
                      : expandedFormats.has(format)
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-center mb-1 text-gray-600">
                    {FORMAT_ICONS[format]}
                  </div>
                  <p className="text-[10px] text-gray-500 mb-0.5 leading-tight">
                    {FORMAT_DISPLAY_NAMES[format]}
                  </p>
                  <p className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</p>
                </button>
              );
            }
          )}
        </div>

        {/* Detailed Analysis Cards */}
        <div className="space-y-2">
          {(['film', 'tv_series', 'animation', 'microdrama', 'audio_drama'] as FormatType[]).map(
            (format) => {
              const score = scores[format];
              const analysis = getAnalysis(format);
              const isExpanded = expandedFormats.has(format);
              const isBest = format === bestFormat;

              if (!analysis) return null;

              return (
                <div
                  key={format}
                  className={`border rounded-lg transition-colors ${
                    isBest ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'
                  }`}
                >
                  {/* Header */}
                  <Collapsible open={isExpanded} onOpenChange={() => toggleFormat(format)}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${isBest ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            {FORMAT_ICONS[format]}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{FORMAT_DISPLAY_NAMES[format]}</span>
                              {isBest && (
                                <Badge className="bg-purple-500 text-white text-[10px] px-1.5 py-0">
                                  Best
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{FORMAT_DESCRIPTIONS[format]}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className={`text-xl font-bold ${getScoreColor(score)}`}>
                              {score}%
                            </span>
                            <p className="text-[10px] text-gray-400">
                              {getFitLevelLabel(score)}
                            </p>
                          </div>
                          {isExpanded ? (
                            <Icon icon="solar:alt-arrow-up-bold-duotone" className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Icon icon="solar:alt-arrow-down-bold-duotone" className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-100">
                        {/* Summary */}
                        <p className="text-sm text-gray-600">{analysis.summary}</p>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${getScoreBgColor(score)}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>

                        {/* Dimension Scores */}
                        {analysis.dimensions && analysis.dimensions.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-gray-700 mb-2">
                              Dimension Breakdown
                            </h5>
                            <div className="grid grid-cols-2 gap-1.5">
                              {analysis.dimensions.map((dim) => (
                                <div
                                  key={dim.dimension}
                                  className="flex items-center justify-between text-xs p-1.5 bg-gray-50 rounded"
                                >
                                  <span className="text-gray-600 truncate">
                                    {formatDimensionName(dim.dimension)}
                                  </span>
                                  <span className={`font-medium ${getScoreColor(dim.score)}`}>
                                    {dim.score}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Strengths & Challenges */}
                        <div className="grid grid-cols-2 gap-3">
                          {analysis.strengths && analysis.strengths.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                                <Icon icon="solar:check-read-bold-duotone" className="h-3 w-3" />
                                Strengths
                              </h5>
                              <ul className="space-y-0.5">
                                {analysis.strengths.slice(0, 3).map((s, i) => (
                                  <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1">
                                    <span className="text-green-500">+</span>
                                    <span className="line-clamp-2">{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.challenges && analysis.challenges.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
                                <Icon icon="solar:danger-circle-bold-duotone" className="h-3 w-3" />
                                Challenges
                              </h5>
                              <ul className="space-y-0.5">
                                {analysis.challenges.slice(0, 3).map((c, i) => (
                                  <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1">
                                    <span className="text-red-500">-</span>
                                    <span className="line-clamp-2">{c}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Recommendations */}
                        {analysis.recommendations && analysis.recommendations.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-blue-700 mb-1">
                              Recommendations
                            </h5>
                            <ul className="space-y-0.5">
                              {analysis.recommendations.slice(0, 2).map((r, i) => (
                                <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1">
                                  <span className="text-blue-500">→</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Microdrama-specific insights */}
                        {format === 'microdrama' && analysis.format_specific && (
                          <div className="bg-purple-50 rounded p-2 border border-purple-200">
                            <h5 className="text-xs font-medium text-purple-700 mb-1.5">
                              Microdrama Insights
                            </h5>
                            <div className="grid grid-cols-3 gap-2 text-[11px]">
                              <div>
                                <span className="text-gray-500">Cliffhanger:</span>
                                <span className="font-medium text-gray-700 ml-1">
                                  {analysis.format_specific.cliffhanger_potential}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Episode Fit:</span>
                                <span className="font-medium text-gray-700 ml-1">
                                  {analysis.format_specific.episode_structure_fit}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Vertical:</span>
                                <span className="font-medium text-gray-700 ml-1">
                                  {analysis.format_specific.vertical_filming_compatibility}%
                                </span>
                              </div>
                            </div>
                            {analysis.format_specific.trope_alignment &&
                              analysis.format_specific.trope_alignment.length > 0 && (
                                <div className="mt-1.5">
                                  <span className="text-gray-500 text-[11px]">Tropes: </span>
                                  <span className="text-gray-700 text-[11px]">
                                    {analysis.format_specific.trope_alignment
                                      .slice(0, 3)
                                      .map((t) => t.replace(/_/g, ' '))
                                      .join(', ')}
                                  </span>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            }
          )}
        </div>

        {/* Metadata */}
        {record.data_completeness !== undefined && (
          <div className="text-[10px] text-gray-400 text-center pt-2 border-t">
            Analysis based on {record.data_completeness}% data completeness
            {record.analysis_version && ` • v${record.analysis_version}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FormatFitDetailPanel;
