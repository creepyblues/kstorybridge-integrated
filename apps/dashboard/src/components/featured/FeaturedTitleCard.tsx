/**
 * FeaturedTitleCard Component
 *
 * Vertical card displaying featured titles with mandate-style design.
 * Matches MandateTitleCard design for consistency.
 */

import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import VerifiedBadge from '@/components/common/VerifiedBadge';

interface FeaturedTitle {
  id: string;
  title_id: string;
  note: string | null;
  titles: {
    title_id: string;
    title_name_en?: string | null;
    title_name_kr?: string;
    title_image?: string | null;
    synopsis?: string | null;
    genre?: string[];
    tone?: string | null;
    content_format?: string | null;
    rating?: number | null;
    story_author?: string | null;
    art_author?: string | null;
  };
}

interface FeaturedTitleCardProps {
  featured: FeaturedTitle;
}

export default function FeaturedTitleCard({ featured }: FeaturedTitleCardProps) {
  const navigate = useNavigate();
  const title = featured.titles;

  const handleCardClick = () => {
    navigate(`/buyers/titles/${title.title_id}`);
  };

  return (
    <Card
      className="bg-white border border-gray-300 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden cursor-pointer h-full flex flex-col"
      onClick={handleCardClick}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Image Section with Hover Zoom */}
        <div className="relative w-full aspect-video bg-gray-100 overflow-hidden flex-shrink-0">
          {title.title_image ? (
            <img
              src={title.title_image}
              alt={title.title_name_en || title.title_name_kr || 'Title'}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x600?text=No+Image';
              }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* Verified Badge - Top Left */}
          <div className="absolute top-3 left-3">
            <VerifiedBadge />
          </div>

          {/* Rating Badge - Top Right */}
          {title.rating && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm">
              ★ {title.rating}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 md:p-6 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-hanok-teal transition-colors">
            {title.title_name_en || title.title_name_kr}
          </h3>
          {title.title_name_en && title.title_name_kr && (
            <p className="text-sm text-gray-500 mb-3 truncate">{title.title_name_kr}</p>
          )}

          {/* Divider */}
          <div className="w-full h-px bg-gray-300 mb-3"></div>

          {/* Genre and Format Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {title.genre?.slice(0, 3).map((g, idx) => (
              <span
                key={idx}
                className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs font-medium border border-cyan-200"
              >
                {g}
              </span>
            ))}
            {title.tone && (
              <span className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-2 py-1 rounded-md text-xs font-medium border border-purple-200">
                {title.tone}
              </span>
            )}
            {title.content_format && (
              <span className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-2 py-1 rounded-md text-xs font-medium border border-blue-200">
                {title.content_format}
              </span>
            )}
          </div>

          {/* Synopsis */}
          {title.synopsis && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3">
              {title.synopsis}
            </p>
          )}

          {/* Creator Info */}
          {(title.story_author || title.art_author) && (
            <div className="text-xs text-gray-500 mb-4">
              {title.story_author && (
                <div>Story: {title.story_author}</div>
              )}
              {title.art_author && title.art_author !== title.story_author && (
                <div>Art: {title.art_author}</div>
              )}
            </div>
          )}

          {/* Expert Insight Chat Bubble */}
          {featured.note && (
            <div className="flex gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200 mt-auto">
              {/* Expert Profile Icon */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                  <Icon icon="solar:stars-bold-duotone" className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Expert Explanation Text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-700 mb-1">
                  Why "{title.title_name_en || title.title_name_kr || 'This Title'}"?
                </p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                  {featured.note}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
