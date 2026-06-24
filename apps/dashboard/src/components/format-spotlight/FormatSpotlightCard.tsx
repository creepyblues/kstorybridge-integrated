import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import RadarChart from './RadarChart';
import FormatInsightsTab from './FormatInsightsTab';
import type { FormatAnalysis, FormatType } from '@/services/formatFitService';
import { getFitLevel, getFitLevelLabel } from '@/services/formatFitService';
import { LowPriorityBadge } from '@/components/admin/LowPriorityBadge';

interface TitleData {
  title_id: string;
  slug?: string | null;
  title_name_en: string | null;
  title_name_kr: string | null;
  title_image: string | null;
  synopsis: string | null;
  genre: string[] | null;
  content_format: string | null;
  tone: string | null;
  story_author: string | null;
  art_author: string | null;
  rating: number | null;
  views: number | null;
  priority?: string | null;
}

interface FormatSpotlightCardProps {
  title: TitleData;
  analysis: FormatAnalysis;
  formatType: FormatType;
  rank?: number;
  /** Admin editorial note (only present on the curated microdrama path). */
  note?: string | null;
  /** Show the admin-only LOW PRIORITY sticker. Buyer surfaces leave this off. */
  showLowPriorityBadge?: boolean;
  onCardClick?: (titleId: string) => void;
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return views.toString();
}

// Fit-level → color tokens for the top accent + score badge.
const FIT_STYLES = {
  excellent: { accent: 'border-t-green-500', badgeBg: 'bg-green-50', badgeText: 'text-green-700', badgeRing: 'ring-green-200' },
  good: { accent: 'border-t-blue-500', badgeBg: 'bg-blue-50', badgeText: 'text-blue-700', badgeRing: 'ring-blue-200' },
  default: { accent: 'border-t-gray-400', badgeBg: 'bg-gray-50', badgeText: 'text-gray-700', badgeRing: 'ring-gray-200' },
} as const;

function getFitStyles(fitLevel: string) {
  if (fitLevel === 'excellent') return FIT_STYLES.excellent;
  if (fitLevel === 'good') return FIT_STYLES.good;
  return FIT_STYLES.default;
}

export default function FormatSpotlightCard({
  title,
  analysis,
  formatType,
  rank,
  note,
  showLowPriorityBadge = false,
  onCardClick,
}: FormatSpotlightCardProps) {
  const navigate = useNavigate();

  const score = analysis.overall_score;
  const fitLevel = getFitLevel(score);
  const fitLevelLabel = getFitLevelLabel(score);
  const styles = getFitStyles(fitLevel);
  const radarColor = fitLevel === 'excellent' ? '#22c55e' : fitLevel === 'good' ? '#3b82f6' : '#9ca3af';

  const handleClick = () => {
    if (onCardClick) {
      onCardClick(title.slug || title.title_id);
    } else {
      navigate(`/buyers/titles/${title.slug || title.title_id}`);
    }
  };

  const strengths = analysis.strengths ?? [];
  const challenges = analysis.challenges ?? [];

  return (
    <div className={`bg-transparent border border-gray-300 shadow-none rounded-2xl overflow-hidden hover:border-gray-400 transition-colors border-t-[3px] ${styles.accent}`}>
      {/* Header — clickable */}
      <div
        className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={handleClick}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-4 flex-1 min-w-0">
          {/* Image + rank — square, height-matched to the 200px radar on desktop */}
          <div className="w-28 sm:w-[200px] shrink-0">
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100">
              {title.title_image ? (
                <img
                  src={title.title_image}
                  alt={title.title_name_en || 'Title'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon icon="solar:book-bold-duotone" className="h-10 w-10 text-gray-300" />
                </div>
              )}
              {rank && (
                <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black ring-2 ring-white/50 text-white text-xs font-bold flex items-center justify-center">
                  {rank}
                </div>
              )}
            </div>
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-black leading-tight">
                {title.title_name_en || title.title_name_kr || 'Untitled'}
              </h3>
              {showLowPriorityBadge && <LowPriorityBadge priority={title.priority} />}
            </div>
            {title.title_name_kr && title.title_name_en && (
              <p className="text-sm text-gray-500 truncate">{title.title_name_kr}</p>
            )}

            {/* Genre / format / tone badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {title.genre?.slice(0, 3).map((g, i) => (
                <span key={i} className="bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded-md text-xs font-medium border border-cyan-200">
                  {g}
                </span>
              ))}
              {title.content_format && (
                <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md text-xs font-medium border border-purple-200">
                  {title.content_format}
                </span>
              )}
              {title.tone && (
                <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md text-xs font-medium border border-blue-200">
                  {title.tone}
                </span>
              )}
            </div>

            {/* Authors & stats */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
              {title.story_author && <span>Story: {title.story_author}</span>}
              {title.art_author && <span>Art: {title.art_author}</span>}
              {title.rating != null && title.rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Icon icon="solar:star-bold" className="h-3.5 w-3.5 text-amber-400" />
                  {title.rating.toFixed(1)}
                </span>
              )}
              {title.views != null && title.views > 0 && <span>{formatViews(title.views)} views</span>}
            </div>
          </div>
          </div>

          {/* Radar chart — score in center */}
          <div className="shrink-0 flex items-center justify-center sm:justify-end">
            <RadarChart
              dimensions={analysis.dimensions.map((d) => ({
                dimension: d.dimension,
                score: d.score,
                reason: d.reason,
              }))}
              size={200}
              color={radarColor}
              showLabels
              centerLabel={String(score)}
              centerSublabel={fitLevelLabel}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
        {/* Editor's note (admin) */}
        {note && (
          <div className="border-l-2 border-hanok-teal bg-hanok-teal/5 rounded-r-lg pl-3 pr-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon icon="solar:notebook-bold-duotone" className="h-5 w-5 text-hanok-teal" />
              <span className="text-sm font-bold text-hanok-teal">Editor's note</span>
            </div>
            <p className="text-sm text-gray-700">{note}</p>
          </div>
        )}

        {/* Synopsis */}
        {title.synopsis && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{title.synopsis}</p>
        )}

        {/* Format signals (microdrama gauges + tags, or recommendations) */}
        <div className="pt-1">
          <FormatInsightsTab analysis={analysis} formatType={formatType} />
        </div>

        {/* Strengths / Challenges */}
        {(strengths.length > 0 || challenges.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-1">
            {strengths.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1.5">Strengths</p>
                <ul className="space-y-1">
                  {strengths.slice(0, 4).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {challenges.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1.5">Challenges</p>
                <ul className="space-y-1">
                  {challenges.slice(0, 4).map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Icon icon="solar:danger-triangle-bold" className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
