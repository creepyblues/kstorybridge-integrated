/**
 * TrialTrendingSection
 *
 * Displays trending/featured titles for trial users.
 * Identical to Featured.tsx but without BuyerLayout and links to /trial/titles/:id
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { featuredService } from '@/services/featuredService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Trial-specific card that links to /trial/titles/:id
function TrialFeaturedCard({ featured }: { featured: FeaturedTitle }) {
  const navigate = useNavigate();
  const title = featured.titles;

  const handleCardClick = () => {
    navigate(`/trial/titles/${title.title_id}`);
  };

  return (
    <Card
      className="bg-white border border-gray-300 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden cursor-pointer h-full flex flex-col"
      onClick={handleCardClick}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Image Section */}
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

          <div className="absolute top-3 left-3">
            <VerifiedBadge />
          </div>

          {title.rating && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm">
              ★ {title.rating}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 flex flex-col flex-grow">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-hanok-teal transition-colors">
            {title.title_name_en || title.title_name_kr}
          </h3>
          {title.title_name_en && title.title_name_kr && (
            <p className="text-sm text-gray-500 mb-3 truncate">{title.title_name_kr}</p>
          )}

          <div className="w-full h-px bg-gray-300 mb-3"></div>

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

          {title.synopsis && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3">
              {title.synopsis}
            </p>
          )}

          {(title.story_author || title.art_author) && (
            <div className="text-xs text-gray-500 mb-4">
              {title.story_author && <div>Story: {title.story_author}</div>}
              {title.art_author && title.art_author !== title.story_author && (
                <div>Art: {title.art_author}</div>
              )}
            </div>
          )}

          {featured.note && (
            <div className="flex gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200 mt-auto">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                  <Icon icon="solar:stars-bold-duotone" className="h-4 w-4 text-white" />
                </div>
              </div>
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

export function TrialTrendingSection() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['featured-grouped'],
    queryFn: () => featuredService.getFeaturedGroupedBySections(),
  });

  const totalCount = data
    ? data.sections.reduce((sum, s) => sum + s.featured.length, 0) + data.uncategorized.length
    : 0;

  useEffect(() => {
    if (data && !activeTab) {
      if (data.sections.length > 0) {
        setActiveTab(data.sections[0].id);
      } else if (data.uncategorized.length > 0) {
        setActiveTab('uncategorized');
      }
    }
  }, [data, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 rounded-full mb-4">
          <Icon icon="solar:graph-up-bold-duotone" className="h-5 w-5 text-orange-500" />
          <span className="text-orange-600 font-medium">Trending Titles</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-black">
          Check out the trending titles
        </h2>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Icon icon="solar:refresh-circle-bold-duotone" className="h-12 w-12 text-hanok-teal animate-spin mb-4" />
          <p className="text-gray-600 text-sm">Loading trending titles...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-800 font-semibold mb-2">Failed to load trending titles</p>
          <p className="text-red-600 text-sm">Please try again later.</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Icon icon="solar:graph-up-bold-duotone" className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trending Titles Yet</h3>
          <p className="text-gray-600 text-sm text-center max-w-md">
            Check back soon for trending selections.
          </p>
        </div>
      )}

      {/* Tabbed Content */}
      {!isLoading && !error && data && totalCount > 0 && activeTab && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-gray-50 rounded-2xl p-2 mb-6">
            <TabsList className="w-full justify-start bg-transparent rounded-none h-auto p-0 gap-2 flex-wrap">
              {data.sections.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="data-[state=active]:bg-hanok-teal data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-5 py-3 text-gray-700 hover:bg-gray-200 font-semibold text-base transition-all duration-200"
                >
                  {section.name}
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20 data-[state=active]:bg-white/30">
                    {section.featured.length}
                  </span>
                </TabsTrigger>
              ))}

              {data.uncategorized.length > 0 && (
                <TabsTrigger
                  value="uncategorized"
                  className="data-[state=active]:bg-hanok-teal data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-5 py-3 text-gray-700 hover:bg-gray-200 font-semibold text-base transition-all duration-200"
                >
                  More Titles
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20 data-[state=active]:bg-white/30">
                    {data.uncategorized.length}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="mt-6">
            {data.sections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="mt-0">
                {section.description && (
                  <p className="text-gray-600 mb-6">{section.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.featured.map((featured) => (
                    <TrialFeaturedCard key={featured.id} featured={featured} />
                  ))}
                </div>
              </TabsContent>
            ))}

            {data.uncategorized.length > 0 && (
              <TabsContent value="uncategorized" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.uncategorized.map((featured) => (
                    <TrialFeaturedCard key={featured.id} featured={featured} />
                  ))}
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      )}
    </div>
  );
}
