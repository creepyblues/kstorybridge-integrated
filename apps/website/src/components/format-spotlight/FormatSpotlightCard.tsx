import { useState } from 'react';
import { Icon } from '@iconify/react';
import RadarChart from './RadarChart';
import FormatInsightsTab from './FormatInsightsTab';
import type { FormatAnalysis, FormatType, SpotlightTitleData } from '@/services/formatSpotlightService';
import { getFitLevel, getFitLevelLabel } from '@/services/formatSpotlightService';

interface FormatSpotlightCardProps {
  title: SpotlightTitleData;
  analysis: FormatAnalysis;
  formatType: FormatType;
  rank?: number;
  onCardClick?: (titleId: string) => void;
}

type TabType = 'strengths' | 'challenges' | 'insights';

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return views.toString();
}

export default function FormatSpotlightCard({
  title,
  analysis,
  formatType,
  rank,
  onCardClick,
}: FormatSpotlightCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('strengths');

  const score = analysis.overall_score;
  const fitLevel = getFitLevel(score);
  const fitLevelLabel = getFitLevelLabel(score);
  const radarColor =
    fitLevel === 'excellent'
      ? '#22c55e'
      : fitLevel === 'good'
        ? '#3b82f6'
        : '#9ca3af';

  const handleClick = () => {
    onCardClick?.(title.title_id);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'strengths', label: 'Strengths' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'insights', label: 'Format Insights' },
  ];

  return (
    <div className={`bg-transparent border border-gray-300 shadow-none rounded-2xl overflow-hidden hover:border-gray-400 transition-colors ${
      fitLevel === 'excellent'
        ? 'border-t-[3px] border-t-green-500'
        : fitLevel === 'good'
          ? 'border-t-[3px] border-t-blue-500'
          : 'border-t-[3px] border-t-gray-400'
    }`}>
      {/* Top Section */}
      <div
        className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={handleClick}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Image */}
          <div className="w-full sm:w-36 md:w-44 shrink-0">
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100">
              {title.title_image ? (
                <img
                  src={title.title_image}
                  alt={title.title_name_en || 'Title'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon icon="solar:book-bold-duotone" className="h-12 w-12 text-gray-300" />
                </div>
              )}
              {rank && (
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black ring-2 ring-white/50 text-white text-sm font-bold flex items-center justify-center">
                  {rank}
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-black truncate">
              {title.title_name_en || title.title_name_kr || 'Untitled'}
            </h3>
            {title.title_name_kr && title.title_name_en && (
              <p className="text-sm text-gray-500 truncate">{title.title_name_kr}</p>
            )}

            {/* Genre badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {title.genre?.slice(0, 3).map((g, i) => (
                <span
                  key={i}
                  className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-0.5 rounded-md text-xs font-medium border border-cyan-200"
                >
                  {g}
                </span>
              ))}
              {title.content_format && (
                <span className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-2 py-0.5 rounded-md text-xs font-medium border border-purple-200">
                  {title.content_format}
                </span>
              )}
              {title.tone && (
                <span className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-2 py-0.5 rounded-md text-xs font-medium border border-blue-200">
                  {title.tone}
                </span>
              )}
            </div>

            {/* Authors & stats */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
              {title.story_author && (
                <span>Story: {title.story_author}</span>
              )}
              {title.art_author && (
                <span>Art: {title.art_author}</span>
              )}
              {title.rating != null && title.rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Icon icon="solar:star-bold" className="h-3.5 w-3.5 text-amber-400" />
                  {title.rating.toFixed(1)}
                </span>
              )}
              {title.views != null && title.views > 0 && (
                <span>{formatViews(title.views)} views</span>
              )}
            </div>

            {/* Summary */}
            {analysis.summary && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2 border-l-2 border-gray-200 pl-3">{analysis.summary}</p>
            )}
          </div>

          {/* Radar Chart */}
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

      {/* Bottom Section - Tabs */}
      <div className="border-t border-gray-200">
        {/* Tab headers */}
        <div className="flex gap-1 px-2 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs font-medium transition-colors rounded-lg ${
                activeTab === tab.key
                  ? 'text-black bg-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 min-h-[120px]">
          {activeTab === 'strengths' && (
            <ul className="space-y-1.5">
              {analysis.strengths.length > 0 ? (
                analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-400">No strengths data available.</p>
              )}
            </ul>
          )}

          {activeTab === 'challenges' && (
            <ul className="space-y-1.5">
              {analysis.challenges.length > 0 ? (
                analysis.challenges.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Icon icon="solar:danger-triangle-bold" className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-400">No challenges data available.</p>
              )}
            </ul>
          )}

          {activeTab === 'insights' && (
            <FormatInsightsTab analysis={analysis} formatType={formatType} />
          )}
        </div>
      </div>
    </div>
  );
}
