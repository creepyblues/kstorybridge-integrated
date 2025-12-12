import { useQuery } from '@tanstack/react-query';
import { featuredService } from '@/services/featuredService';
import { TitleCard } from '@/components/title/TitleCard';
import { Icon } from '@iconify/react';

export function HotNowSection() {
  const { data: featured, isLoading, error } = useQuery({
    queryKey: ['featured'],
    queryFn: () => featuredService.getAllFeatured(),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-50 to-red-50 px-4 py-2 rounded-full mb-4">
          <Icon icon="solar:graph-up-bold-duotone" className="h-5 w-5 text-orange-500" />
          <span className="text-orange-600 font-medium">What's Hot Now</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
          Trending Korean IP Ready for Adaptation
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Curated picks with strong market potential, proven audience engagement, and available rights.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-hanok-teal mb-4" />
          <p className="text-gray-500">Loading trending titles...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-500">Failed to load featured titles. Please try again.</p>
        </div>
      )}

      {/* Results Grid */}
      {featured && featured.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.slice(0, 6).map((item) => (
            <div key={item.id} className="relative">
              <TitleCard title={item.titles} variant="grid" />
              {/* Featured Note Badge */}
              {item.note && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg">
                  {item.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {featured && featured.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No featured titles available at the moment.</p>
        </div>
      )}

      {/* Market Insight (optional teaser) */}
      {featured && featured.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 md:p-8 text-center">
          <p className="text-gray-600 text-sm md:text-base">
            <span className="font-semibold text-black">Market Insight:</span>{' '}
            Romantasy and thriller genres are driving the most engagement this month.
            Completed series with strong female leads are trending upward for drama adaptation.
          </p>
        </div>
      )}
    </div>
  );
}
