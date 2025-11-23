// Component: MandateTitleCard
// Created: 2025-11-21
// Description: Simplified title card for mandate matches (no AI explanation for cost savings)

import { Card, CardContent } from '@kstorybridge/ui';
import { TitleMatch } from '@/services/mandateService';

interface MandateTitleCardProps {
  match: TitleMatch;
}

export default function MandateTitleCard({ match }: MandateTitleCardProps) {
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
          <div
            className={`absolute top-3 right-3 ${matchBadge.gradient} ${matchBadge.text} ${matchBadge.border} border px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm`}
          >
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
            <div className="text-xs text-gray-500">
              {match.story_author && (
                <div>Story: {match.story_author}</div>
              )}
              {match.art_author && match.art_author !== match.story_author && (
                <div>Art: {match.art_author}</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
