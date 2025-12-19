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

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {compsAnalysis.map((comp) => (
            <div
              key={comp.comp_title}
              className="border rounded-xl border-gray-200 bg-gradient-to-r from-white to-gray-50 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Main Content Row - Poster Left, Info Right */}
              <div className="flex">
                {/* Poster - Left Side */}
                <div className="relative flex-shrink-0 w-24">
                  {comp.poster_url ? (
                    <a
                      href={comp.imdb_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full"
                    >
                      <img
                        src={comp.poster_url}
                        alt={`${comp.comp_title} poster`}
                        className="w-24 h-36 object-cover"
                      />
                    </a>
                  ) : (
                    <div className="w-24 h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Icon icon="solar:clapperboard-bold-duotone" className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  {/* Match Score Badge - Floating on poster */}
                  <Badge
                    className={`absolute top-2 left-2 ${getScoreColor(comp.overall_match_score)} text-white text-xs font-bold px-2 py-0.5 shadow-lg`}
                  >
                    {comp.overall_match_score}%
                  </Badge>
                </div>

                {/* Info - Right Side */}
                <div className="flex-1 p-3 flex flex-col min-w-0">
                  {/* Title & Type */}
                  <div className="mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {comp.comp_title}
                      </h4>
                      {comp.imdb_url && (
                        <a
                          href={comp.imdb_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-amber-500 hover:text-amber-600"
                          title="View on IMDB"
                        >
                          <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      {getTypeIcon(comp.comp_type)}
                      <span>
                        {comp.comp_year && `${comp.comp_year} · `}
                        {comp.comp_type}
                      </span>
                    </div>
                  </div>

                  {/* Explanation */}
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2 flex-1">{comp.explanation}</p>

                  {/* Match Reasons */}
                  {comp.match_reasons && comp.match_reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {comp.match_reasons.slice(0, 2).map((reason, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full"
                        >
                          {reason}
                        </span>
                      ))}
                      {comp.match_reasons.length > 2 && (
                        <span className="text-[10px] text-gray-400">
                          +{comp.match_reasons.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Show Details - Bottom */}
              {comp.dimension_scores && comp.dimension_scores.length > 0 && (
                <Collapsible
                  open={expandedComps.has(comp.comp_title)}
                  onOpenChange={() => toggleExpand(comp.comp_title)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full py-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                      {expandedComps.has(comp.comp_title) ? (
                        <>
                          <Icon icon="solar:alt-arrow-up-bold-duotone" className="h-3.5 w-3.5" />
                          Hide details
                        </>
                      ) : (
                        <>
                          <Icon icon="solar:alt-arrow-down-bold-duotone" className="h-3.5 w-3.5" />
                          Show details
                        </>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-1.5">
                      {comp.dimension_scores.map((dim) => (
                        <div
                          key={dim.dimension}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-gray-600">
                            {compsGeneratorService.formatDimensionName(dim.dimension)}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getScoreColor(dim.score)}`}
                                style={{ width: `${dim.score}%` }}
                              />
                            </div>
                            <span
                              className={`font-medium w-8 text-right ${
                                dim.score >= 85
                                  ? 'text-green-600'
                                  : dim.score >= 70
                                    ? 'text-blue-600'
                                    : dim.score >= 55
                                      ? 'text-yellow-600'
                                      : 'text-gray-500'
                              }`}
                            >
                              {dim.score}
                            </span>
                          </div>
                        </div>
                      ))}
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
