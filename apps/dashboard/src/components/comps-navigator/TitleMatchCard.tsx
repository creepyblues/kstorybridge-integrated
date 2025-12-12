/**
 * TitleMatchCard Component
 * Version: 2.0.0
 *
 * Modern card design matching FeaturedTitlesCarousel patterns:
 * - Hover lift effect with shadow
 * - Gradient badges for visual hierarchy
 * - Image zoom on hover
 * - Professional typography and spacing
 * - V2.0.0: 8-dimensional scoring with collapsible display
 */

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import {
  TitleMatch,
  getMatchScore,
  formatDimensionName,
  getDimensionWeightPercent,
} from '@/services/compsNavigatorService';
import MatchDetailModal from './MatchDetailModal';

interface TitleMatchCardProps {
  match: TitleMatch;
}

export default function TitleMatchCard({ match }: TitleMatchCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);

  // Use the utility function for backward compatibility
  const score = getMatchScore(match);

  // Get gradient badge styling based on match score
  const getMatchScoreBadge = (score: number) => {
    if (score >= 85) {
      return {
        gradient: 'bg-gradient-to-r from-emerald-100 to-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200'
      };
    }
    if (score >= 70) {
      return {
        gradient: 'bg-gradient-to-r from-blue-100 to-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200'
      };
    }
    return {
      gradient: 'bg-gradient-to-r from-purple-100 to-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200'
    };
  };

  // Get dimension score badge color
  const getDimensionBadgeColor = (dimScore: number) => {
    if (dimScore >= 85) return 'bg-emerald-100 text-emerald-700';
    if (dimScore >= 70) return 'bg-blue-100 text-blue-700';
    if (dimScore >= 55) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  const matchBadge = getMatchScoreBadge(score);

  return (
    <>
      <Card
        className="bg-white border border-gray-300 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <CardContent className="p-0">
          {/* Image Section with Hover Zoom */}
          <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
            {match.title_image ? (
              <img
                src={match.title_image}
                alt={match.title_name_en || match.title_name_kr}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x600?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}

            {/* Pitch Deck Badge - Sunrise Coral Gradient */}
            {match.has_pitch_deck && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-400 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5">
                <Icon icon="solar:document-text-bold-duotone" className="w-3.5 h-3.5" />
                Pitch Deck
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 md:p-6 flex flex-col">
            {/* Title with Match Score Badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-hanok-teal transition-colors flex-1">
                {match.title_name_en || match.title_name_kr}
              </h3>
              <div className={`flex-shrink-0 ${matchBadge.gradient} ${matchBadge.text} ${matchBadge.border} border px-2.5 py-1 rounded-lg text-sm font-bold`}>
                {score}%
              </div>
            </div>
            {match.title_name_en && match.title_name_kr && (
              <p className="text-sm text-gray-500 mb-3">{match.title_name_kr}</p>
            )}

            {/* Divider */}
            <div className="w-full h-px bg-gray-300 mb-3"></div>

            {/* Genre and Tone Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {match.genre.slice(0, 3).map((g, idx) => (
                <span
                  key={idx}
                  className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs font-medium border border-cyan-200"
                >
                  {g}
                </span>
              ))}
              {match.tone && (
                <span className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-2 py-1 rounded-md text-xs font-medium border border-purple-200">
                  {match.tone}
                </span>
              )}
            </div>

            {/* Match Reasons Tags (V2.0.0) */}
            {match.match_reasons && match.match_reasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {match.match_reasons.slice(0, 4).map((reason, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}

            {/* Match Explanation - AI Chat Bubble */}
            <div className="flex gap-3 mb-3">
              <div className="flex-shrink-0">
                <div className="bg-hanok-teal/10 rounded-full p-2">
                  <Icon icon="solar:chat-round-dots-bold-duotone" className="h-5 w-5 text-hanok-teal" />
                </div>
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3">
                <p className="text-sm text-gray-700">
                  {match.explanation}
                </p>
              </div>
            </div>

            {/* Collapsible Dimension Scores (V2.0.0) */}
            {match.dimension_scores && match.dimension_scores.length > 0 && (
              <div className="border-t border-gray-200 pt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDimensions(!showDimensions);
                  }}
                  className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span className="font-medium">Dimension Breakdown</span>
                  {showDimensions ? (
                    <Icon icon="solar:alt-arrow-up-bold-duotone" className="h-4 w-4" />
                  ) : (
                    <Icon icon="solar:alt-arrow-down-bold-duotone" className="h-4 w-4" />
                  )}
                </button>

                {showDimensions && (
                  <div className="mt-3 space-y-2">
                    {match.dimension_scores.map((dim, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-gray-600 truncate">
                            {formatDimensionName(dim.dimension)}
                          </span>
                          <span className="text-gray-400 text-xs">
                            ({getDimensionWeightPercent(dim.dimension)})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDimensionBadgeColor(dim.score)}`}>
                            {dim.score}
                          </span>
                          {dim.aligned_comps && dim.aligned_comps.length > 0 && (
                            <span className="text-xs text-gray-400">
                              via {dim.aligned_comps[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showModal && (
        <MatchDetailModal
          match={match}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
