/**
 * CompsAnalysisCard - Clean, poster-forward design
 * Big poster → title + score → match reasons as spaced bubbles
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

  if (!compsAnalysis || compsAnalysis.length === 0) return null;

  const toggleExpand = (compTitle: string) => {
    setExpandedComps((prev) => {
      const next = new Set(prev);
      if (next.has(compTitle)) next.delete(compTitle);
      else next.add(compTitle);
      return next;
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-[#4C9C9B]';
    if (score >= 55) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-[#4C9C9B]';
    if (score >= 55) return 'text-amber-600';
    return 'text-gray-500';
  };

  return (
    <Card className={`bg-white border border-gray-200 shadow-sm rounded-2xl ${className}`}>
      <CardContent className="p-6">
        {showTitle && (
          <div className="border-l-4 border-[#4C9C9B] pl-4 mb-6">
            <div className="flex items-center gap-2">
              <Icon icon="solar:stars-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-gray-900">AI Comparable Analysis</h3>
              <Badge className="ml-auto bg-[#4C9C9B]/10 text-[#4C9C9B] border border-[#4C9C9B]/20 text-xs">
                AI Generated
              </Badge>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {compsAnalysis.map((comp) => (
            <div
              key={comp.comp_title}
              className="border rounded-2xl border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Big poster */}
              <div className="relative">
                {comp.poster_url ? (
                  <a href={comp.imdb_url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={comp.poster_url}
                      alt={comp.comp_title}
                      className="w-full h-48 object-cover"
                    />
                  </a>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Icon icon="solar:clapperboard-bold-duotone" className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                {/* Score badge floating on poster */}
                <Badge className={`absolute top-3 right-3 ${getScoreColor(comp.overall_match_score)} text-white text-lg font-bold px-3 py-1 shadow-lg`}>
                  {comp.overall_match_score}%
                </Badge>
              </div>

              {/* Title + year */}
              <div className="px-5 pt-4 pb-2">
                <h4 className="font-semibold text-gray-900 text-lg leading-snug">
                  {comp.comp_title}
                </h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  {comp.comp_year && `${comp.comp_year} · `}{comp.comp_type}
                  {comp.imdb_url && (
                    <a href={comp.imdb_url} target="_blank" rel="noopener noreferrer" className="text-[#4C9C9B] hover:text-[#3a7a79] ml-1.5 inline-flex items-center align-middle">
                      <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-3.5 w-3.5" />
                    </a>
                  )}
                </p>
              </div>

              {/* Match reasons as spaced bubbles */}
              {comp.match_reasons && comp.match_reasons.length > 0 && (
                <div className="px-5 pb-4 space-y-2">
                  {comp.match_reasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="bg-[#4C9C9B]/8 border border-[#4C9C9B]/15 rounded-xl px-4 py-2.5 text-sm text-[#3a7a79] leading-relaxed"
                    >
                      {reason}
                    </div>
                  ))}
                </div>
              )}

              {/* Expandable dimension scores */}
              {comp.dimension_scores && comp.dimension_scores.length > 0 && (
                <Collapsible open={expandedComps.has(comp.comp_title)} onOpenChange={() => toggleExpand(comp.comp_title)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full py-2.5 border-t border-gray-100 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                      {expandedComps.has(comp.comp_title) ? (
                        <><Icon icon="solar:alt-arrow-up-bold-duotone" className="h-4 w-4" /> Hide</>
                      ) : (
                        <><Icon icon="solar:alt-arrow-down-bold-duotone" className="h-4 w-4" /> Details</>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-4 space-y-2">
                      {comp.dimension_scores.map((dim) => (
                        <div key={dim.dimension} className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500 w-28 flex-shrink-0 truncate">{compsGeneratorService.formatDimensionName(dim.dimension)}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getScoreColor(dim.score)}`} style={{ width: `${dim.score}%` }} />
                          </div>
                          <span className={`font-semibold w-7 text-right ${getScoreTextColor(dim.score)}`}>{dim.score}</span>
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
