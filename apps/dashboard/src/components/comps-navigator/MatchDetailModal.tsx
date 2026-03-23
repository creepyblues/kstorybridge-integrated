/**
 * MatchDetailModal Component
 * Version: 2.0.0
 *
 * Modal showing full match details:
 * - Full explanation
 * - V2.0.0: 8-dimensional scoring grid
 * - Link to full title detail page
 */

import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import {
  TitleMatch,
  getMatchScore,
  formatDimensionName,
  getDimensionWeightPercent,
  getScoreLevel,
} from '@/services/compsNavigatorService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MatchDetailModalProps {
  match: TitleMatch;
  onClose: () => void;
}

export default function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  const navigate = useNavigate();

  // Use the utility function for backward compatibility
  const score = getMatchScore(match);

  const handleViewFullTitle = () => {
    navigate(`/buyers/titles/${match.slug || match.title_id}`);
  };

  // Get dimension score bar color
  const getDimensionBarColor = (dimScore: number) => {
    if (dimScore >= 85) return 'bg-emerald-500';
    if (dimScore >= 70) return 'bg-blue-500';
    if (dimScore >= 55) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  // Get score level label
  const getScoreLevelLabel = (s: number) => {
    const level = getScoreLevel(s);
    switch (level) {
      case 'excellent':
        return 'Excellent Match';
      case 'strong':
        return 'Strong Match';
      case 'moderate':
        return 'Moderate Match';
      case 'weak':
        return 'Weak Match';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {match.title_name_en || match.title_name_kr}
          </DialogTitle>
          {match.title_name_en && match.title_name_kr && (
            <p className="text-gray-500">{match.title_name_kr}</p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Match Score */}
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-gray-900">
              {score}%
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{getScoreLevelLabel(score)}</p>
              <p className="text-xs text-gray-500">Based on 8-dimensional analysis</p>
            </div>
          </div>

          {/* Title Image and Basic Info */}
          <div className="flex gap-4">
            {match.title_image && (
              <img
                src={match.title_image}
                alt={match.title_name_en || match.title_name_kr}
                className="w-32 h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="flex-1 space-y-3">
              {/* Genre and Tone */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Genre & Tone</p>
                <div className="flex flex-wrap gap-2">
                  {match.genre.map((g, idx) => (
                    <span key={idx} className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {g}
                    </span>
                  ))}
                  {match.tone && (
                    <span className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
                      {match.tone}
                    </span>
                  )}
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Synopsis</p>
                <p className="text-sm text-gray-700 line-clamp-4">{match.synopsis}</p>
              </div>
            </div>
          </div>

          {/* Match Explanation */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Why This Matches</h3>
            <p className="text-sm text-gray-700">{match.explanation}</p>
          </div>

          {/* Match Reasons (V2.0.0) */}
          {match.match_reasons && match.match_reasons.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Similarities</h3>
              <ul className="space-y-2">
                {match.match_reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-hanok-teal mt-0.5">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dimension Scores Grid (V2.0.0) */}
          {match.dimension_scores && match.dimension_scores.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Dimension Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {match.dimension_scores.map((dim, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {formatDimensionName(dim.dimension)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {getDimensionWeightPercent(dim.dimension)}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-sm font-bold ${
                        dim.score >= 85 ? 'bg-emerald-100 text-emerald-700' :
                        dim.score >= 70 ? 'bg-blue-100 text-blue-700' :
                        dim.score >= 55 ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {dim.score}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${getDimensionBarColor(dim.score)}`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">{dim.reason}</p>
                    {/* Aligned Comps */}
                    {dim.aligned_comps && dim.aligned_comps.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {dim.aligned_comps.map((comp, compIdx) => (
                          <span
                            key={compIdx}
                            className="text-xs px-2 py-0.5 bg-hanok-teal/10 text-hanok-teal rounded"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleViewFullTitle}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <span>View Full Title Details</span>
              <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-4 w-4" />
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
