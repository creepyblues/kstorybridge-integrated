/**
 * Comps Display Card
 *
 * Displays saved comps analysis results on the title detail page.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Icon } from '@iconify/react';
import { compsGeneratorService, type SuggestedComp } from '@/services/compsGeneratorService';

interface CompsDisplayCardProps {
  comps: string[];
  compsAnalysis?: SuggestedComp[];
  onGenerate?: () => void;
}

export function CompsDisplayCard({ comps, compsAnalysis, onGenerate }: CompsDisplayCardProps) {
  const [expandedComps, setExpandedComps] = useState<Set<string>>(new Set());

  const handleToggleExpand = (compTitle: string) => {
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
    if (score >= 55) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 55) return 'bg-amber-50 border-amber-200';
    return 'bg-gray-50 border-gray-200';
  };

  // If no comps, show empty state with generate button
  if (!comps || comps.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-200 shadow-none rounded-xl">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon icon="solar:stars-bold-duotone" className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Comparable Titles</p>
              <p className="text-xs text-gray-500">No comps generated yet</p>
            </div>
          </div>
          {onGenerate && (
            <Button onClick={onGenerate} size="sm" variant="outline" className="border-gray-300">
              <Icon icon="solar:stars-bold" className="h-4 w-4 mr-1" />
              Generate
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // If comps exist but no analysis, show simple list
  if (!compsAnalysis || compsAnalysis.length === 0) {
    return (
      <Card className="bg-white border-gray-200 shadow-none rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon icon="solar:stars-bold-duotone" className="h-5 w-5 text-purple-500" />
              <h4 className="font-medium text-gray-900">Comparable Titles</h4>
              <Badge variant="outline" className="text-xs border-gray-300">
                {comps.length}
              </Badge>
            </div>
            {onGenerate && (
              <Button onClick={onGenerate} size="sm" variant="ghost">
                <Icon icon="solar:refresh-circle-bold" className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {comps.map((comp, idx) => (
              <Badge key={idx} variant="outline" className="text-sm border-gray-300 text-gray-700 px-3 py-1">
                {comp}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full analysis display
  return (
    <Card className="bg-white border-gray-200 shadow-none rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="solar:stars-bold-duotone" className="h-5 w-5 text-purple-500" />
            <h4 className="font-medium text-gray-900">Comparable Titles</h4>
            <Badge variant="outline" className="text-xs border-gray-300">
              {compsAnalysis.length}
            </Badge>
          </div>
          {onGenerate && (
            <Button onClick={onGenerate} size="sm" variant="ghost">
              <Icon icon="solar:refresh-circle-bold" className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {compsAnalysis.map((comp) => {
            const isExpanded = expandedComps.has(comp.comp_title);
            return (
              <div
                key={comp.comp_title}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-medium text-gray-900">{comp.comp_title}</h5>
                    <span className="text-sm text-gray-500">
                      {comp.comp_year && `${comp.comp_year} • `}
                      {comp.comp_type}
                    </span>
                    <Badge className={`${getScoreColor(comp.overall_match_score)} text-white text-xs`}>
                      {comp.overall_match_score}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{comp.explanation}</p>
                </div>

                <Collapsible open={isExpanded} onOpenChange={() => handleToggleExpand(comp.comp_title)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full px-3 py-2 border-t border-gray-100 flex items-center justify-center gap-1 text-xs text-gray-500 hover:bg-gray-50">
                      {isExpanded ? (
                        <>
                          <Icon icon="solar:alt-arrow-up-bold-duotone" className="h-3 w-3" />
                          Hide details
                        </>
                      ) : (
                        <>
                          <Icon icon="solar:alt-arrow-down-bold-duotone" className="h-3 w-3" />
                          Show details
                        </>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        {comp.dimension_scores.map((dim) => (
                          <div
                            key={dim.dimension}
                            className={`p-2 rounded border text-xs ${getScoreBgColor(dim.score)}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-700">
                                {compsGeneratorService.formatDimensionName(dim.dimension)}
                              </span>
                              <span className={`font-bold ${
                                dim.score >= 85 ? 'text-green-600' :
                                dim.score >= 70 ? 'text-blue-600' :
                                dim.score >= 55 ? 'text-amber-600' :
                                'text-gray-500'
                              }`}>
                                {dim.score}%
                              </span>
                            </div>
                            <p className="text-gray-600">{dim.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default CompsDisplayCard;
