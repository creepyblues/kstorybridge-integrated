/**
 * FeaturedTitleCard Component
 *
 * Vertical list card displaying featured titles with rich pitch analytics.
 * Designed to help producers quickly understand why each title is featured.
 */

import { useNavigate } from 'react-router-dom';
import { Bot, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import VerifiedBadge from '@/components/common/VerifiedBadge';

interface PitchAnalysis {
  story_elements?: {
    logline?: string;
  };
  market_positioning?: {
    target_audience?: {
      age_range?: string;
      psychographics?: string;
    };
    platform_fit?: string[];
    comparable_titles?: Array<{
      title: string;
      platform?: string;
    }>;
  };
  ip_value?: {
    franchise_potential?: 'high' | 'medium' | 'low';
    unique_selling_points?: string[];
  };
  themes_and_tone?: {
    primary_themes?: string[];
  };
}

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
    rating?: number | null;
    title_content_analysis?: {
      pitch_analysis: PitchAnalysis;
    }[];
  };
}

interface FeaturedTitleCardProps {
  featured: FeaturedTitle;
}

export default function FeaturedTitleCard({ featured }: FeaturedTitleCardProps) {
  const navigate = useNavigate();
  const title = featured.titles;
  const pitchAnalysis = title.title_content_analysis?.[0]?.pitch_analysis;

  const handleCardClick = () => {
    navigate(`/buyers/titles/${title.title_id}`);
  };

  // Get franchise potential badge styling
  const getFranchiseBadge = (potential?: string) => {
    if (potential === 'high') {
      return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'High Franchise Potential' };
    }
    if (potential === 'medium') {
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Medium Franchise Potential' };
    }
    if (potential === 'low') {
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Developing IP' };
    }
    return null;
  };

  const franchiseBadge = getFranchiseBadge(pitchAnalysis?.ip_value?.franchise_potential);

  return (
    <Card className="bg-white border border-gray-300 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left: Image Section (35%) */}
          <div className="relative w-full md:w-[35%] h-64 md:h-full bg-gray-100 overflow-hidden flex-shrink-0">
            {title.title_image ? (
              <img
                src={title.title_image}
                alt={title.title_name_en || title.title_name_kr}
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

            {/* Verified Badge (top-left) */}
            <div className="absolute top-3 left-3">
              <VerifiedBadge />
            </div>

            {/* Rating Badge (top-right) */}
            {title.rating && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm">
                ★ {title.rating}
              </div>
            )}
          </div>

          {/* Right: Content Section (65%) */}
          <div className="flex-1 p-6 md:p-8 flex flex-col" onClick={handleCardClick}>
            {/* Title Header */}
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 group-hover:text-hanok-teal transition-colors line-clamp-2">
                {title.title_name_en || title.title_name_kr}
              </h2>
              {title.title_name_en && title.title_name_kr && (
                <p className="text-base text-gray-500">{title.title_name_kr}</p>
              )}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gray-300 mb-4"></div>

            {/* AI Chat Bubble - "Why This Title" */}
            <div className="mb-6">
              <div className="flex gap-3">
                {/* AI Profile Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-hanok-teal flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Chat Bubble Content */}
                <div className="flex-1 bg-white border-2 border-gray-200 rounded-2xl p-4 space-y-3">
                  {/* Why This Title - Editor's Note */}
                  {featured.note && (
                    <div>
                      <p className="text-xs font-semibold text-hanok-teal uppercase tracking-wide mb-1">Why This Title</p>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{featured.note}</p>
                    </div>
                  )}

                  {/* Synopsis */}
                  {title.synopsis && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Synopsis</p>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{title.synopsis}</p>
                    </div>
                  )}

                  {/* Logline */}
                  {pitchAnalysis?.story_elements?.logline && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Logline</p>
                      <p className="text-sm font-bold text-gray-900">{pitchAnalysis.story_elements.logline}</p>
                    </div>
                  )}

                  {/* Comparable Titles */}
                  {pitchAnalysis?.market_positioning?.comparable_titles && pitchAnalysis.market_positioning.comparable_titles.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Comparable To</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pitchAnalysis.market_positioning.comparable_titles.slice(0, 3).map((comp, idx) => (
                          <span key={idx} className="bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 px-2 py-1 rounded-md text-xs font-medium border border-emerald-200">
                            {comp.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mood/Tone Keywords */}
                  {(title.tone || (pitchAnalysis?.themes_and_tone?.primary_themes && pitchAnalysis.themes_and_tone.primary_themes.length > 0)) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mood & Themes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {title.tone && (
                          <span className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-2 py-1 rounded-md text-xs font-medium border border-purple-200">
                            {title.tone}
                          </span>
                        )}
                        {pitchAnalysis?.themes_and_tone?.primary_themes?.slice(0, 3).map((theme, idx) => (
                          <span key={idx} className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-2 py-1 rounded-md text-xs font-medium border border-purple-200">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Audience */}
                  {pitchAnalysis?.market_positioning?.target_audience && (
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold">Target:</span>{' '}
                      {pitchAnalysis.market_positioning.target_audience.age_range}
                      {pitchAnalysis.market_positioning.target_audience.psychographics &&
                        ` • ${pitchAnalysis.market_positioning.target_audience.psychographics}`
                      }
                    </div>
                  )}

                  {/* Platform Fit Badges */}
                  {pitchAnalysis?.market_positioning?.platform_fit && pitchAnalysis.market_positioning.platform_fit.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Platform Fit</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pitchAnalysis.market_positioning.platform_fit.slice(0, 4).map((platform, idx) => (
                          <span key={idx} className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-2 py-1 rounded-md text-xs font-medium border border-blue-200">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Franchise Potential */}
                  {franchiseBadge && (
                    <div className={`inline-flex items-center gap-1.5 ${franchiseBadge.bg} ${franchiseBadge.text} ${franchiseBadge.border} border px-2 py-1 rounded-md text-xs font-semibold`}>
                      {franchiseBadge.label}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Genre Tags */}
            {title.genre && title.genre.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Genre</p>
                <div className="flex flex-wrap gap-1.5">
                  {title.genre.slice(0, 4).map((g, idx) => (
                    <span key={idx} className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs font-medium border border-cyan-200">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </CardContent>
    </Card>
  );
}
