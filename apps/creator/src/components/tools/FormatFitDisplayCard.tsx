/**
 * Format Fit Display Card
 *
 * Displays saved format fit analysis results on the title detail page.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Icon } from '@iconify/react';
import {
  formatFitService,
  type FormatFitRecord,
  type FormatType,
  type FormatAnalysis,
  type FormatFitDimension,
} from '@/services/formatFitService';

interface FormatFitDisplayCardProps {
  formatFit: FormatFitRecord | null;
  onAnalyze?: () => void;
}

export function FormatFitDisplayCard({ formatFit, onAnalyze }: FormatFitDisplayCardProps) {
  const [expandedFormat, setExpandedFormat] = useState<FormatType | null>(null);

  const handleToggleExpand = (format: FormatType) => {
    setExpandedFormat((prev) => (prev === format ? null : format));
  };

  // If no format fit data, show empty state with analyze button
  if (!formatFit) {
    return (
      <Card className="bg-gray-50 border-gray-200 shadow-none rounded-xl">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon icon="solar:chart-bold-duotone" className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Format Fit Analysis</p>
              <p className="text-xs text-gray-500">No analysis generated yet</p>
            </div>
          </div>
          {onAnalyze && (
            <Button onClick={onAnalyze} size="sm" variant="outline" className="border-gray-300">
              <Icon icon="solar:chart-bold" className="h-4 w-4 mr-1" />
              Analyze
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Convert FormatFitRecord to FormatFitScores for getBestFormat
  const scores = {
    film: formatFit.film_score,
    tv_series: formatFit.tv_series_score,
    animation: formatFit.animation_score,
    microdrama: formatFit.microdrama_score,
    audio_drama: formatFit.audio_drama_score,
  };
  const bestFormat = formatFitService.getBestFormat(scores);

  // Build array of format scores with proper typing
  const formats: FormatType[] = ['film', 'tv_series', 'animation', 'microdrama', 'audio_drama'];

  const getScore = (format: FormatType): number => {
    switch (format) {
      case 'film': return formatFit.film_score;
      case 'tv_series': return formatFit.tv_series_score;
      case 'animation': return formatFit.animation_score;
      case 'microdrama': return formatFit.microdrama_score;
      case 'audio_drama': return formatFit.audio_drama_score;
    }
  };

  const getAnalysis = (format: FormatType): FormatAnalysis | null => {
    switch (format) {
      case 'film': return formatFit.film_analysis;
      case 'tv_series': return formatFit.tv_series_analysis;
      case 'animation': return formatFit.animation_analysis;
      case 'microdrama': return formatFit.microdrama_analysis;
      case 'audio_drama': return formatFit.audio_drama_analysis;
    }
  };

  const formatScores = formats.map((format) => ({
    format,
    score: getScore(format),
    analysis: getAnalysis(format),
  })).filter((f) => f.score !== null && f.score !== undefined);

  return (
    <Card className="bg-white border-gray-200 shadow-none rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="solar:chart-bold-duotone" className="h-5 w-5 text-purple-500" />
            <h4 className="font-medium text-gray-900">Format Fit Analysis</h4>
          </div>
          {onAnalyze && (
            <Button onClick={onAnalyze} size="sm" variant="ghost">
              <Icon icon="solar:refresh-circle-bold" className="h-4 w-4 mr-1" />
              Re-analyze
            </Button>
          )}
        </div>

        {/* Best Format Highlight */}
        {bestFormat && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  icon={formatFitService.FORMAT_ICONS[bestFormat.format] || 'solar:document-bold'}
                  className="h-5 w-5 text-purple-600"
                />
                <div>
                  <p className="text-sm font-medium text-purple-900">Best Format Match</p>
                  <p className="text-xs text-purple-700">
                    {formatFitService.FORMAT_DISPLAY_NAMES[bestFormat.format]}
                  </p>
                </div>
              </div>
              <Badge className="bg-purple-600 text-white text-sm px-3">
                {bestFormat.score}%
              </Badge>
            </div>
          </div>
        )}

        {/* Format Scores Grid */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {formatScores.map(({ format, score }) => {
            const bgColor = formatFitService.getFitLevelBgColor(score);
            const textColor = formatFitService.getFitLevelColor(score);
            const isBest = bestFormat?.format === format;

            return (
              <button
                key={format}
                onClick={() => handleToggleExpand(format)}
                className={`p-2 rounded-lg border text-center transition-all ${
                  expandedFormat === format
                    ? 'ring-2 ring-purple-400'
                    : isBest
                    ? 'ring-1 ring-purple-300'
                    : ''
                }`}
                style={{ backgroundColor: bgColor, borderColor: bgColor }}
              >
                <Icon
                  icon={formatFitService.FORMAT_ICONS[format] || 'solar:document-bold'}
                  className={`h-4 w-4 mx-auto mb-1 ${textColor}`}
                />
                <p className="text-xs font-medium text-gray-700 truncate">
                  {formatFitService.FORMAT_DISPLAY_NAMES[format].split(' ')[0]}
                </p>
                <p className={`text-sm font-bold ${textColor}`}>{score}%</p>
              </button>
            );
          })}
        </div>

        {/* Expanded Format Details */}
        {formatScores.map(({ format, score, analysis }) => {
          const isExpanded = expandedFormat === format;
          if (!analysis) return null;

          const dimensionScores = analysis.dimensions || [];
          const strengths = analysis.strengths || [];
          const challenges = analysis.challenges || [];
          const fitLevel = formatFitService.getFitLevel(score);

          return (
            <Collapsible key={format} open={isExpanded}>
              <CollapsibleContent>
                <div className="border border-gray-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon
                      icon={formatFitService.FORMAT_ICONS[format] || 'solar:document-bold'}
                      className="h-5 w-5 text-gray-600"
                    />
                    <h5 className="font-medium text-gray-900">
                      {formatFitService.FORMAT_DISPLAY_NAMES[format]}
                    </h5>
                    <Badge
                      className={`text-xs ${
                        fitLevel === 'excellent'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : fitLevel === 'good'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : fitLevel === 'moderate'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {formatFitService.getFitLevelLabel(score)}
                    </Badge>
                  </div>

                  {/* Dimension Scores */}
                  {dimensionScores.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {dimensionScores.map((dim) => {
                        const dimFitLevel = formatFitService.getFitLevel(dim.score);
                        return (
                          <div
                            key={dim.dimension}
                            className="p-2 rounded border bg-gray-50 border-gray-200 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-700">
                                {formatFitService.formatDimensionName(dim.dimension as FormatFitDimension)}
                              </span>
                              <span
                                className={`font-bold ${
                                  dimFitLevel === 'excellent'
                                    ? 'text-green-600'
                                    : dimFitLevel === 'good'
                                    ? 'text-blue-600'
                                    : dimFitLevel === 'moderate'
                                    ? 'text-amber-600'
                                    : 'text-gray-500'
                                }`}
                              >
                                {dim.score}%
                              </span>
                            </div>
                            <p className="text-gray-600">{dim.reason}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Strengths & Challenges */}
                  <div className="grid grid-cols-2 gap-3">
                    {strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                          <Icon icon="solar:check-circle-bold" className="h-3 w-3" />
                          Strengths
                        </p>
                        <ul className="space-y-1">
                          {strengths.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-xs text-gray-600">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {challenges.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                          <Icon icon="solar:danger-triangle-bold" className="h-3 w-3" />
                          Challenges
                        </p>
                        <ul className="space-y-1">
                          {challenges.slice(0, 3).map((c, i) => (
                            <li key={i} className="text-xs text-gray-600">
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setExpandedFormat(null)}
                    className="w-full mt-3 pt-2 border-t border-gray-100 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <Icon icon="solar:alt-arrow-up-bold-duotone" className="h-3 w-3" />
                    Close details
                  </button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Analyzed date */}
        {formatFit.created_at && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            Analyzed {new Date(formatFit.created_at).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default FormatFitDisplayCard;
