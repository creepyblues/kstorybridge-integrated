import { useState, useEffect } from 'react';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { featuredService } from '@/services/featuredService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FeaturedTitleCard from '@/components/featured/FeaturedTitleCard';

export default function Featured() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['featured-grouped'],
    queryFn: () => featuredService.getFeaturedGroupedBySections(),
  });

  const totalCount = data
    ? data.sections.reduce((sum, s) => sum + s.featured.length, 0) + data.uncategorized.length
    : 0;

  // Set default tab to first section when data loads
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
    <BuyerLayout>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 p-3 rounded-2xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-hanok-teal">Trending Titles</h1>
                <p className="text-base sm:text-lg text-gray-600 mt-1">What's Hot in Korean Content</p>
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Discover what's trending in Korean content right now, organized by category.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-hanok-teal animate-spin mb-4" />
            <p className="text-gray-600 text-sm">Loading trending titles...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-800 font-semibold mb-2">Failed to load trending titles</p>
            <p className="text-red-600 text-sm">Please try again later or contact support if the problem persists.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trending Titles Yet</h3>
            <p className="text-gray-600 text-sm text-center max-w-md">
              We're currently curating what's hot in Korean content. Check back soon for trending selections.
            </p>
          </div>
        )}

        {/* Tabbed Sections */}
        {!isLoading && !error && data && totalCount > 0 && activeTab && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Section Navigation Bar */}
            <div className="bg-gray-50 rounded-2xl p-2 mb-6">
              <TabsList className="w-full justify-start bg-transparent rounded-none h-auto p-0 gap-2 flex-wrap">
                {/* Section Tabs */}
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

                {/* Uncategorized Tab (if any) */}
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

            {/* Tab Contents */}
            <div className="mt-6">
              {/* Section Tab Contents */}
              {data.sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="mt-0">
                  {section.description && (
                    <p className="text-gray-600 mb-6">{section.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.featured.map((featured) => (
                      <FeaturedTitleCard key={featured.id} featured={featured} />
                    ))}
                  </div>
                </TabsContent>
              ))}

              {/* Uncategorized Tab Content */}
              {data.uncategorized.length > 0 && (
                <TabsContent value="uncategorized" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.uncategorized.map((featured) => (
                      <FeaturedTitleCard key={featured.id} featured={featured} />
                    ))}
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        )}

      </div>
    </BuyerLayout>
  );
}
