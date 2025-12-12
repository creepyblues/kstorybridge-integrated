/**
 * CompsAnalysisCard - Displays AI-generated comp analysis
 *
 * Features:
 * - Match score badges with color coding
 * - Collapsible dimension breakdown
 * - Match reasons display
 * - Explanation text
 *
 * Used in:
 * - Buyer TitleDetail OverviewTab
 * - Admin TitleEditModal
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Icon } from '@iconify/react';
import {
  type SuggestedComp,
  compsGeneratorService,
} from '@/services/compsGeneratorService';

interface CompsAnalysisCardProps {
  compsAnalysis: SuggestedComp[];
  showTitle?: boolean;
  className?: string;
}

export function CompsAnalysisCard({
  compsAnalysis,
  showTitle = true,
  className = '',
}: CompsAnalysisCardProps) {
  const [expandedComps, setExpandedComps] = useState<Set<string>>(new Set());

  if (!compsAnalysis || compsAnalysis.length === 0) {
    return null;
  }

  const toggleExpand = (compTitle: string) => {
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
    if (
      type.toLowerCase().includes('tv') ||
      type.toLowerCase().includes('series')
    ) {
      return <Icon icon="solar:tv-bold-duotone" className="h-4 w-4" />;
    }
    return <Icon icon="solar:clapperboard-bold-duotone" className="h-4 w-4" />;
  };

  return (
    <Card
      className={`bg-white border border-gray-200 shadow-sm rounded-2xl ${className}`}
    >
      <CardContent className="p-5">
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:stars-bold-duotone" className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-black">
              AI Comparable Analysis
            </h3>
            <Badge className="ml-auto bg-purple-100 text-purple-700 border-0 text-xs">
              AI Generated
            </Badge>
          </div>
        )}

        <div className="space-y-3">
          {compsAnalysis.map((comp) => (
            <div
              key={comp.comp_title}
              className="border rounded-lg border-gray-200"
            >
              {/* Comp Header with Poster */}
              <div className="p-4 flex gap-4">
                {/* Poster Thumbnail */}
                {comp.poster_url ? (
                  <a
                    href={comp.imdb_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <img
                      src={comp.poster_url}
                      alt={`${comp.comp_title} poster`}
                      className="w-12 h-[72px] object-cover rounded shadow-sm hover:shadow-md transition-shadow"
                    />
                  </a>
                ) : (
                  <div className="w-12 h-[72px] bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <Icon icon="solar:clapperboard-bold-duotone" className="w-5 h-5 text-gray-400" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">
                      {comp.comp_title}
                    </span>
                    {/* IMDB Link - right next to title */}
                    {comp.imdb_url && (
                      <a
                        href={comp.imdb_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-xs text-amber-600 hover:text-amber-700 hover:underline"
                        title={`View on IMDB (${comp.imdb_id})`}
                      >
                        <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-3 w-3" />
                        <span>IMDB</span>
                      </a>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      {getTypeIcon(comp.comp_type)}
                      <span>
                        {comp.comp_year && `${comp.comp_year} · `}
                        {comp.comp_type}
                      </span>
                    </div>
                    <Badge
                      className={`${getScoreColor(comp.overall_match_score)} text-white`}
                    >
                      {comp.overall_match_score}% Match
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mt-2">{comp.explanation}</p>

                  {/* Match Reasons */}
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
                </div>
              </div>

              {/* Expandable Dimension Scores */}
              {comp.dimension_scores && comp.dimension_scores.length > 0 && (
                <Collapsible
                  open={expandedComps.has(comp.comp_title)}
                  onOpenChange={() => toggleExpand(comp.comp_title)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full px-4 py-2 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-50">
                      {expandedComps.has(comp.comp_title) ? (
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {comp.dimension_scores.map((dim) => (
                          <div
                            key={dim.dimension}
                            className={`p-2 rounded border ${getScoreBgColor(dim.score)}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700">
                                {compsGeneratorService.formatDimensionName(
                                  dim.dimension
                                )}
                              </span>
                              <span
                                className={`text-xs font-bold ${
                                  dim.score >= 85
                                    ? 'text-green-600'
                                    : dim.score >= 70
                                      ? 'text-blue-600'
                                      : dim.score >= 55
                                        ? 'text-yellow-600'
                                        : 'text-gray-500'
                                }`}
                              >
                                {dim.score}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{dim.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
