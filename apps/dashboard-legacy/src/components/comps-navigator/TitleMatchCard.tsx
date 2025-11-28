/**
 * TitleMatchCard Component
 *
 * Modern card design matching FeaturedTitlesCarousel patterns:
 * - Hover lift effect with shadow
 * - Gradient badges for visual hierarchy
 * - Image zoom on hover
 * - Professional typography and spacing
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@kstorybridge/ui';
import { TitleMatch } from '@/services/compsNavigatorService';

interface TitleMatchCardProps {
  match: TitleMatch;
}

export default function TitleMatchCard({ match }: TitleMatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    // Open title detail page in new tab
    window.open(`/buyers/titles/${match.title_id}`, '_blank');
  };

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

  const matchBadge = getMatchScoreBadge(match.match_score);

  return (
    <Card
      className="bg-white border border-gray-300 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden cursor-pointer"
      onClick={handleCardClick}
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

            {/* Match Score Badge - Absolute positioned */}
            <div className={`absolute top-3 right-3 ${matchBadge.gradient} ${matchBadge.text} ${matchBadge.border} border px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm`}>
              {match.match_score}%
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 md:p-6 flex flex-col">
            {/* Title */}
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-hanok-teal transition-colors">
              {match.title_name_en || match.title_name_kr}
            </h3>
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

            {/* AI Match Explanation - Chat Bubble Style */}
            <div className="mb-4">
              <div className="flex gap-3">
                {/* AI Icon */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-hanok-teal to-cyan-600 flex items-center justify-center shadow-sm">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Chat Bubble */}
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <p className={`text-sm text-gray-700 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                      {match.explanation}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-xs text-hanok-teal hover:text-hanok-teal/80 font-medium mt-2 ml-2 flex items-center gap-1 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <span>Show Less</span>
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <span>Show More</span>
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Comp Alignments */}
            {match.comp_alignments && match.comp_alignments.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Comp Alignments</div>

                {/* Individual Comp Scores */}
                {match.comp_alignments.map((alignment, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs font-medium border border-cyan-200">
                      {alignment.comp_title}
                    </span>
                    <span className="text-xs font-bold text-gray-700">
                      {alignment.alignment_score}%
                    </span>
                  </div>
                ))}

                {/* Overall Match Score */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200">
                  <span className="bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 px-2 py-1 rounded-md text-xs font-bold border border-emerald-200">
                    Overall Match
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {match.match_score}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
    </Card>
  );
}
