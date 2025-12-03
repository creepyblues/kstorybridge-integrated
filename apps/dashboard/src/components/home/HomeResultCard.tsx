import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import type { Title } from '@/services/titlesService';
import type { TitleMatch } from '@/services/compsNavigatorService';

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
  const titleId = isTitle(title) ? title.title_id : title.title_id;
  const nameEn = isTitle(title) ? title.title_name_en : title.title_name_en;
  const nameKr = isTitle(title) ? title.title_name_kr : title.title_name_kr;
  const image = isTitle(title) ? title.title_image : title.title_image;
  const synopsis = isTitle(title) ? title.synopsis : title.synopsis;
  const genre = isTitle(title) ? title.genre : title.genre;
  const tone = isTitle(title) ? title.tone : title.tone;
  const score = matchScore ?? (isTitle(title) ? undefined : (title as TitleMatch).match_score);
  const matchExplanation = explanation ?? (isTitle(title) ? undefined : (title as TitleMatch).explanation);

  const handleClick = () => {
    navigate(`/buyers/titles/${titleId}`);
  };

  // Get score badge color
  const getScoreBadgeClass = (score: number) => {
    if (score >= 85) return 'from-green-500 to-emerald-600';
    if (score >= 70) return 'from-blue-500 to-cyan-600';
    return 'from-amber-500 to-orange-600';
  };

  return (
    <Card
      onClick={handleClick}
      className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group overflow-hidden"
    >
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
            {image ? (
              <img
                src={image}
                alt={nameEn || nameKr || 'Title'}
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

            {/* Match Score Badge */}
            {score && (
              <div className={`absolute top-3 right-3 bg-gradient-to-r ${getScoreBadgeClass(score)} text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg`}>
                {score}% Match
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 md:p-6">
            {/* Title */}
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 group-hover:text-hanok-teal transition-colors">
              {nameEn || nameKr}
            </h3>
            {nameKr && nameEn && (
              <p className="text-sm text-gray-500 mb-3">{nameKr}</p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {genre && Array.isArray(genre) && genre.slice(0, 2).map((g, idx) => (
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

            {/* Synopsis */}
            {synopsis && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
                {synopsis}
              </p>
            )}

            {/* Match Explanation */}
            {matchExplanation && (
              <div className="bg-gradient-to-r from-hanok-teal/5 to-hanok-teal/10 rounded-lg p-3 border border-hanok-teal/20">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-hanok-teal">Why this matches:</span>{' '}
                  {matchExplanation}
                </p>
              </div>
            )}

            {/* View Details CTA */}
            <div className="mt-4 flex items-center text-hanok-teal opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm font-medium">View full details</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
