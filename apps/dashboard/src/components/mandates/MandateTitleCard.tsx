// Component: MandateTitleCard
// Created: 2025-11-21
// Description: Title card for mandate matches with AI explanation chat bubble

import { Card, CardContent } from '@/components/ui/card';
import { Bot, FileText } from 'lucide-react';
import { TitleMatch } from '@/services/mandateService';
import { trackMandateResultClicked } from '@/utils/analytics';

interface MandateTitleCardProps {
  match: TitleMatch;
}

export default function MandateTitleCard({ match }: MandateTitleCardProps) {
  const handleCardClick = () => {
    // Track mandate result click
    trackMandateResultClicked(
      match.title_id,
      match.title_name_en || match.title_name_kr,
      match.match_score
    );

    // Open title detail page in new tab
    window.open(`/buyers/titles/${match.title_id}`, '_blank');
  };

  // Get gradient badge styling based on match score
  const getMatchScoreBadge = (score: number) => {
    if (score >= 85) {
      return {
        gradient: 'bg-gradient-to-r from-emerald-100 to-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
      };
    }
    if (score >= 70) {
      return {
        gradient: 'bg-gradient-to-r from-blue-100 to-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
      };
    }
    return {
      gradient: 'bg-gradient-to-r from-purple-100 to-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
    };
  };

  // Generate AI explanation based on match score and title metadata
  const getAIExplanation = () => {
    const score = match.match_score;
    const genres = match.genre.slice(0, 2).join(' and ');

    if (score >= 85) {
      return `Excellent match! This ${match.content_format || 'title'} strongly aligns with your mandate. The ${genres} genre${match.tone ? ` with ${match.tone} tone` : ''} perfectly fits your requirements.`;
    }
    if (score >= 70) {
      return `Strong match! This ${match.content_format || 'title'} fits well with your mandate. The ${genres} elements${match.tone ? ` and ${match.tone} atmosphere` : ''} align with what you're looking for.`;
    }
    return `Good match! This ${match.content_format || 'title'} shares key themes with your mandate. Consider the ${genres} aspects${match.tone ? ` and ${match.tone} tone` : ''} for your project.`;
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
            <h3 className="text-lg md:text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-[#4C9C9B] transition-colors flex-1">
              {match.title_name_en || match.title_name_kr}
            </h3>
            <div
              className={`flex-shrink-0 ${matchBadge.gradient} ${matchBadge.text} ${matchBadge.border} border px-2.5 py-1 rounded-lg text-sm font-bold`}
            >
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
            {match.content_format && (
              <span className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-2 py-1 rounded-md text-xs font-medium border border-blue-200">
                {match.content_format}
              </span>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3">
            {match.synopsis}
          </p>

          {/* Creator Info */}
          {(match.story_author || match.art_author) && (
            <div className="text-xs text-gray-500 mb-4">
              {match.story_author && (
                <div>Story: {match.story_author}</div>
              )}
              {match.art_author && match.art_author !== match.story_author && (
                <div>Art: {match.art_author}</div>
              )}
            </div>
          )}

          {/* AI Explanation Chat Bubble */}
          <div className="flex gap-3 bg-hanok-teal/5 rounded-xl p-3 border border-hanok-teal/20">
            {/* AI Profile Icon */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-hanok-teal flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* AI Explanation Text */}
            <div className="flex-1">
              <p className="text-xs font-medium text-hanok-teal mb-1">AI Analysis</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {getAIExplanation()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
