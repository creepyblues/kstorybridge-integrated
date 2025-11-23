import { BuyerLayout } from '@/components/layout/BuyerLayout';
import FeaturedTitleCard from '@/components/featured/FeaturedTitleCard';
import { Star, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { featuredService } from '@/services/featuredService';

export default function Featured() {
  const { data: featuredTitles, isLoading, error } = useQuery({
    queryKey: ['featured'],
    queryFn: () => featuredService.getAllFeatured(),
  });

  return (
    <BuyerLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 p-3 rounded-2xl shadow-lg">
              <Star className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-hanok-teal">Featured Titles</h1>
              <p className="text-lg text-gray-600 mt-1">AI-Curated Korean Content</p>
            </div>
          </div>
          <p className="text-gray-600 text-base">
            Discover our hand-picked selection of exceptional Korean IPs, carefully selected for market potential and storytelling excellence.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-hanok-teal animate-spin mb-4" />
            <p className="text-gray-600 text-sm">Loading featured titles...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-800 font-semibold mb-2">Failed to load featured titles</p>
            <p className="text-red-600 text-sm">Please try again later or contact support if the problem persists.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!featuredTitles || featuredTitles.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Featured Titles Yet</h3>
            <p className="text-gray-600 text-sm text-center max-w-md">
              We're currently curating exceptional Korean content. Check back soon for our featured selections.
            </p>
          </div>
        )}

        {/* Featured Titles List */}
        {!isLoading && !error && featuredTitles && featuredTitles.length > 0 && (
          <div className="space-y-6">
            {featuredTitles.map((featured) => (
              <FeaturedTitleCard key={featured.id} featured={featured} />
            ))}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && !error && featuredTitles && featuredTitles.length > 0 && (
          <div className="text-center py-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {featuredTitles.length} {featuredTitles.length === 1 ? 'featured title' : 'featured titles'}
            </p>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
