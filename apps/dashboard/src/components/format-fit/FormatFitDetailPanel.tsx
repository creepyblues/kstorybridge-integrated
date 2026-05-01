/**
 * Format Fit Detail Panel — Redesigned
 * Shows format cards; details appear only when selected.
 * Teal color scheme, bigger fonts, % on all scores.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const FORMAT_ICONS: Record<FormatType, string> = {
  film: 'solar:clapperboard-bold-duotone',
  tv_series: 'solar:tv-bold-duotone',
  animation: 'solar:magic-stick-3-bold-duotone',
  microdrama: 'solar:smartphone-bold-duotone',
  audio_drama: 'solar:microphone-large-bold-duotone',
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-[#4C9C9B]';
  if (score >= 40) return 'text-amber-600';
  return 'text-gray-500';
};


const getCardBorder = (_score: number, isSelected: boolean, isBest: boolean): string => {
  if (isSelected && isBest) return 'border-[#4C9C9B] bg-[#4C9C9B]/5 ring-2 ring-[#4C9C9B]/20';
  if (isSelected) return 'border-gray-400 bg-gray-50 ring-2 ring-gray-200';
  if (isBest) return 'border-[#4C9C9B]/50 bg-[#4C9C9B]/5';
  return 'border-gray-200 bg-white hover:border-gray-300';
};

export function FormatFitDetailPanel({ titleId, className = '' }: FormatFitDetailPanelProps) {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<FormatFitRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FormatType | null>(null);

  useEffect(() => {
    fetchFormatFit();
  }, [titleId]);

  const fetchFormatFit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await formatFitService.getFormatFit(titleId);
      setRecord(data);
      if (data) {
        setSelectedFormat(getBestFormat(data));
      }
    } catch (err) {
      console.error('[FormatFitDetailPanel] Error:', err);
      setError('Failed to load format fit analysis');
    } finally {
      setLoading(false);
    }
  };

  const getBestFormat = (rec: FormatFitRecord): FormatType => {
    const scores: Record<FormatType, number> = {
      film: rec.film_score, tv_series: rec.tv_series_score, animation: rec.animation_score,
      microdrama: rec.microdrama_score, audio_drama: rec.audio_drama_score,
    };
    return Object.entries(scores).reduce((best, [f, s]) =>
      s > scores[best as FormatType] ? (f as FormatType) : best, 'film' as FormatType);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <Icon icon="solar:refresh-circle-bold-duotone" className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex flex-col items-center justify-center gap-2">
          <Icon icon="solar:danger-circle-bold-duotone" className="h-6 w-6 text-red-500" />
          <p className="text-sm text-gray-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchFormatFit}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!record) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex flex-col items-center justify-center gap-2">
          <Icon icon="solar:info-circle-bold-duotone" className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-500">Format fit analysis not available</p>
        </CardContent>
      </Card>
    );
  }

  const bestFormat = getBestFormat(record);
  const scores: Record<FormatType, number> = {
    film: record.film_score, tv_series: record.tv_series_score, animation: record.animation_score,
    microdrama: record.microdrama_score, audio_drama: record.audio_drama_score,
  };
  const formats: FormatType[] = ['film', 'tv_series', 'animation', 'microdrama', 'audio_drama'];

  const getAnalysis = (format: FormatType): FormatAnalysis | null => {
    const map: Record<FormatType, FormatAnalysis | null> = {
      film: record.film_analysis, tv_series: record.tv_series_analysis,
      animation: record.animation_analysis, microdrama: record.microdrama_analysis,
      audio_drama: record.audio_drama_analysis,
    };
    return map[format];
  };

  const analysis = selectedFormat ? getAnalysis(selectedFormat) : null;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* Header with teal accent */}
        <div className="border-l-4 border-[#4C9C9B] pl-4 mb-5">
          <div className="flex items-center gap-2">
            <Icon icon="solar:cup-star-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
            <h3 className="text-lg font-semibold text-gray-900">Format Fit Analysis</h3>
          </div>
        </div>

        {/* Format Cards — click to select */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-6">
          {formats.map((format) => {
            const score = scores[format];
            const isBest = format === bestFormat;
            const isSelected = format === selectedFormat;

            return (
              <button
                key={format}
                onClick={() => setSelectedFormat(format === selectedFormat ? null : format)}
                className={`p-2 sm:p-3 rounded-xl border text-center transition-all cursor-pointer ${getCardBorder(score, isSelected, isBest)}`}
              >
                <div className="flex justify-center mb-2">
                  <Icon icon={FORMAT_ICONS[format]} className={`h-6 w-6 sm:h-8 sm:w-8 ${isSelected ? 'text-[#4C9C9B]' : 'text-gray-500'}`} />
                </div>
                <p className={`text-xs sm:text-sm font-medium mb-1 leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                  {FORMAT_DISPLAY_NAMES[format]}
                </p>
                <p className={`text-xl sm:text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}%
                </p>
                {isBest && (
                  <Badge className="bg-[#4C9C9B] text-white text-[10px] px-1.5 py-0 mt-1">
                    Best
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Format Detail */}
        {selectedFormat && analysis && (
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#4C9C9B]/10">
                  <Icon icon={FORMAT_ICONS[selectedFormat]} className="h-6 w-6 text-[#4C9C9B]" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{FORMAT_DISPLAY_NAMES[selectedFormat]}</h4>
                  <p className="text-sm text-gray-500">{FORMAT_DESCRIPTIONS[selectedFormat]}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className={`text-3xl font-bold ${getScoreColor(scores[selectedFormat])}`}>
                  {scores[selectedFormat]}%
                </span>
                <p className="text-xs text-gray-500">{getFitLevelLabel(scores[selectedFormat])}</p>
              </div>
            </div>

            {/* Summary */}
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">{analysis.summary}</p>

            {/* Dimensions */}
            {analysis.dimensions && analysis.dimensions.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Dimension Breakdown</h5>
                <div className="grid grid-cols-2 gap-2">
                  {analysis.dimensions.map((dim) => (
                    <div key={dim.dimension} className="flex items-center justify-between text-sm p-2 bg-white rounded-lg">
                      <span className="text-gray-600">{formatDimensionName(dim.dimension)}</span>
                      <span className={`font-semibold ${getScoreColor(dim.score)}`}>{dim.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {analysis.strengths && analysis.strengths.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                    <Icon icon="solar:check-read-bold-duotone" className="h-4 w-4" /> Strengths
                  </h5>
                  <ul className="space-y-1">
                    {analysis.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">+</span><span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.challenges && analysis.challenges.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <Icon icon="solar:danger-circle-bold-duotone" className="h-4 w-4" /> Challenges
                  </h5>
                  <ul className="space-y-1">
                    {analysis.challenges.slice(0, 3).map((c, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5">-</span><span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-[#4C9C9B] mb-2">Recommendations</h5>
                <ul className="space-y-1">
                  {analysis.recommendations.slice(0, 3).map((r, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                      <span className="text-[#4C9C9B] mt-0.5">→</span><span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        {record.data_completeness !== undefined && (
          <div className="text-xs text-gray-400 text-center pt-3 mt-4 border-t">
            Analysis based on {record.data_completeness}% data completeness
            {record.analysis_version && ` · v${record.analysis_version}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FormatFitDetailPanel;
