import { useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import type { Title } from '@/services/titlesService';
import type { TitleMatch } from '@/services/compsNavigatorService';
import { getScoreBadgeStyles } from '@/utils/scoreStyles';

interface HomeResultCardProps {
  // Can accept either a full Title or a TitleMatch from comp search
  title: Title | TitleMatch;
  matchScore?: number;
  explanation?: string;
}

function isTitle(item: Title | TitleMatch): item is Title {
  return 'title_id' in item;
}

export function HomeResultCard({ title, matchScore, explanation }: HomeResultCardProps) {
  const navigate = useNavigate();

  // Normalize data based on type
  const titleSlug = isTitle(title) ? (title.slug || title.title_id) : (title.slug || title.title_id);
  const nameEn = isTitle(title) ? title.title_name_en : title.title_name_en;
  const nameKr = isTitle(title) ? title.title_name_kr : title.title_name_kr;
  const image = isTitle(title) ? title.title_image : title.title_image;
  const genre = isTitle(title) ? title.genre : title.genre;
  const tone = isTitle(title) ? title.tone : title.tone;
  const score = matchScore ?? (isTitle(title) ? undefined : (title as TitleMatch).match_score);
  const matchExplanation = explanation ?? (isTitle(title) ? undefined : (title as TitleMatch).explanation);

  const handleClick = useCallback(() => {
    navigate(`/buyers/titles/${titleSlug}`);
  }, [navigate, titleSlug]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  // Use shared score badge utility
  const matchBadge = score ? getScoreBadgeStyles(score) : null;
  const displayName = nameEn || nameKr || 'Untitled';

  return (
    <Card
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${displayName}${score ? `, ${score}% match` : ''}`}
      className="bg-white border border-gray-300 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group overflow-hidden focus:outline-none focus:ring-2 focus:ring-hanok-teal focus:ring-offset-2"
    >
      <CardContent className="p-0">
        {/* Poster Image Section with Hover Zoom */}
        <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={`Cover image for ${displayName}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x600?text=No+Image';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* Match Score Badge - positioned on image */}
          {score && matchBadge && (
            <div
              className={`absolute top-3 right-3 ${matchBadge.gradient} ${matchBadge.text} ${matchBadge.border} border px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm`}
              aria-label={`${score}% match score`}
            >
              {score}%
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 md:p-6 flex flex-col">
          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-hanok-teal transition-colors">
            {nameEn || nameKr}
          </h3>
          {nameKr && nameEn && (
            <p className="text-sm text-gray-500 mb-3">{nameKr}</p>
          )}

          {/* Divider */}
          <div className="w-full h-px bg-gray-300 mb-3"></div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {genre && Array.isArray(genre) && genre.slice(0, 3).map((g, idx) => (
              <span
                key={idx}
                className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs font-medium border border-cyan-200"
              >
                {g}
              </span>
            ))}
            {tone && (
              <span className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-2 py-1 rounded-md text-xs font-medium border border-purple-200">
                {tone}
              </span>
            )}
          </div>

          {/* Match Explanation - AI Chat Bubble style */}
          {matchExplanation && (
            <div className="flex gap-3">
              <div className="flex-shrink-0" aria-hidden="true">
                <div className="bg-hanok-teal/10 rounded-full p-2">
                  <Icon icon="solar:chat-round-dots-bold-duotone" className="h-5 w-5 text-hanok-teal" />
                </div>
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3">
                <p className="text-sm text-gray-700">
                  {matchExplanation}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
