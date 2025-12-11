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
import { Bot, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TitleMatch } from '@/services/compsNavigatorService';
import MatchDetailModal from './MatchDetailModal';

interface TitleMatchCardProps {
  match: TitleMatch;
}

export default function TitleMatchCard({ match }: TitleMatchCardProps) {
  const [showModal, setShowModal] = useState(false);

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
                <FileText className="w-3.5 h-3.5" />
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
                {match.match_score}%
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

            {/* Match Explanation - AI Chat Bubble */}
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="bg-hanok-teal/10 rounded-full p-2">
                  <Bot className="h-5 w-5 text-hanok-teal" />
                </div>
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3">
                <p className="text-sm text-gray-700">
                  {match.explanation}
                </p>
              </div>
            </div>
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
