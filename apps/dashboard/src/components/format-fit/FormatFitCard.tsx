/**
 * Format Fit Card
 *
 * Compact component that displays format fit scores on title cards.
 * Shows either the best format or all 5 formats in a mini bar chart.
 */

import { useState } from 'react';
import {
  type FormatType,
  type FormatFitScores,
  FORMAT_DISPLAY_NAMES,
  getFitLevel,
  getFitLevelLabel,
  getBestFormat,
} from '@/services/formatFitService';
import { Icon } from '@iconify/react';

interface FormatFitCardProps {
  scores: FormatFitScores;
  variant?: 'compact' | 'mini' | 'bars';
  className?: string;
}

const FORMAT_ICONS: Record<FormatType, React.ReactNode> = {
  film: <Icon icon="solar:clapperboard-bold-duotone" className="h-3 w-3" />,
  tv_series: <Icon icon="solar:tv-bold-duotone" className="h-3 w-3" />,
  animation: <Icon icon="solar:pallete-bold-duotone" className="h-3 w-3" />,
  microdrama: <Icon icon="solar:smartphone-bold-duotone" className="h-3 w-3" />,
  audio_drama: <Icon icon="solar:headphones-bold-duotone" className="h-3 w-3" />,
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-gray-400';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-gray-300';
};

/**
 * Compact variant - shows best format badge
 */
function CompactVariant({ scores }: { scores: FormatFitScores }) {
  const { format, score } = getBestFormat(scores);
  const fitLevel = getFitLevel(score);

  // Build tooltip text
  const tooltipText = ['film', 'tv_series', 'animation', 'microdrama', 'audio_drama']
    .map((f) => `${FORMAT_DISPLAY_NAMES[f as FormatType]}: ${scores[f as FormatType]}%`)
    .join('\n');

  return (
    <div
      title={`Format Fit Scores:\n${tooltipText}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-default ${
        fitLevel === 'excellent'
          ? 'bg-green-100 text-green-700'
          : fitLevel === 'good'
          ? 'bg-blue-100 text-blue-700'
          : fitLevel === 'moderate'
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {FORMAT_ICONS[format]}
      <span>{FORMAT_DISPLAY_NAMES[format]}</span>
      <span className="font-bold">{score}</span>
    </div>
  );
}

/**
 * Mini variant - shows just the best format icon and score
 */
function MiniVariant({ scores }: { scores: FormatFitScores }) {
  const { format, score } = getBestFormat(scores);

  return (
    <div
      title={`Best fit: ${FORMAT_DISPLAY_NAMES[format]} (${getFitLevelLabel(score)})`}
      className={`inline-flex items-center gap-0.5 ${getScoreColor(score)}`}
    >
      {FORMAT_ICONS[format]}
      <span className="text-xs font-bold">{score}</span>
    </div>
  );
}

/**
 * Bars variant - shows all 5 formats as mini bars
 */
function BarsVariant({ scores }: { scores: FormatFitScores }) {
  const [hoveredFormat, setHoveredFormat] = useState<FormatType | null>(null);
  const { format: bestFormat } = getBestFormat(scores);

  return (
    <div className="flex items-end gap-0.5 h-6">
      {(['film', 'tv_series', 'animation', 'microdrama', 'audio_drama'] as FormatType[]).map(
        (format) => {
          const score = scores[format];
          const isBest = format === bestFormat;
          const isHovered = format === hoveredFormat;

          return (
            <div
              key={format}
              title={`${FORMAT_DISPLAY_NAMES[format]}: ${score}% (${getFitLevelLabel(score)})`}
              className="relative cursor-default"
              onMouseEnter={() => setHoveredFormat(format)}
              onMouseLeave={() => setHoveredFormat(null)}
            >
              <div
                className={`w-3 rounded-t transition-all ${getScoreBgColor(score)} ${
                  isBest ? 'opacity-100' : 'opacity-60'
                } ${isHovered ? 'opacity-100' : ''}`}
                style={{ height: `${Math.max((score / 100) * 24, 4)}px` }}
              />
            </div>
          );
        }
      )}
    </div>
  );
}

export function FormatFitCard({
  scores,
  variant = 'compact',
  className = '',
}: FormatFitCardProps) {
  // Check if we have any scores
  const hasScores = Object.values(scores).some((s) => s > 0);
  if (!hasScores) return null;

  return (
    <div className={className}>
      {variant === 'compact' && <CompactVariant scores={scores} />}
      {variant === 'mini' && <MiniVariant scores={scores} />}
      {variant === 'bars' && <BarsVariant scores={scores} />}
    </div>
  );
}

export default FormatFitCard;
