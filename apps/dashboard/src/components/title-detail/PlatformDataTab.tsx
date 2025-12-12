import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Title, TitlePlatform, titlesService } from '@/services/titlesService';
import { Icon } from '@iconify/react';

interface PlatformDataTabProps {
  title: Title;
}

// Platform name display mapping
const PLATFORM_NAMES: Record<string, string> = {
  naver: 'Naver Webtoon',
  kakao: 'Kakao Webtoon',
  kakaopage: 'Kakao Page',
  lezhin: 'Lezhin Comics',
  ridibooks: 'Ridibooks',
  toomics: 'Toomics',
  bomtoon: 'Bomtoon',
  ktoon: 'KToon',
  munpia: 'Munpia',
  joara: 'Joara',
  novelpia: 'Novelpia',
  other: 'Other Platform',
};

// Platform colors
const PLATFORM_COLORS: Record<string, string> = {
  naver: 'bg-green-500',
  kakao: 'bg-yellow-500',
  kakaopage: 'bg-yellow-600',
  lezhin: 'bg-red-500',
  ridibooks: 'bg-blue-500',
  toomics: 'bg-purple-500',
  bomtoon: 'bg-pink-500',
  ktoon: 'bg-indigo-500',
  munpia: 'bg-orange-500',
  joara: 'bg-teal-500',
  novelpia: 'bg-cyan-500',
  other: 'bg-gray-500',
};

function PlatformCard({ platform, totalViews }: { platform: TitlePlatform; totalViews: number }) {
  const percentage = totalViews > 0 && platform.views ? Math.round((platform.views / totalViews) * 100) : 0;
  const platformColor = PLATFORM_COLORS[platform.platform_name] || PLATFORM_COLORS.other;

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-black">
          {PLATFORM_NAMES[platform.platform_name] || platform.platform_name}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#4C9C9B] hover:text-[#4C9C9B]/80 h-8 px-2"
          onClick={() => window.open(platform.platform_url, '_blank')}
        >
          <Icon icon="solar:square-arrow-right-up-bold-duotone" className="w-4 h-4 mr-1" />
          Visit
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        {platform.views != null && (
          <div className="flex items-center gap-1.5">
            <Icon icon="solar:eye-bold-duotone" className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{titlesService.formatNumber(platform.views)} views</span>
          </div>
        )}
        {platform.subscribers != null && (
          <div className="flex items-center gap-1.5">
            <Icon icon="solar:users-group-rounded-bold-duotone" className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{titlesService.formatNumber(platform.subscribers)} subscribers</span>
          </div>
        )}
      </div>

      {/* Progress bar showing percentage of total views */}
      {platform.views != null && totalViews > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Share of total views</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${platformColor} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Other metrics if available */}
      {platform.other_metrics && Object.keys(platform.other_metrics).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Additional Metrics</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(platform.other_metrics).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PlatformDataTab({ title }: PlatformDataTabProps) {
  const hasPlatforms = title.platforms && title.platforms.length > 0;
  const hasRating = title.rating != null && title.rating > 0;

  // Calculate total views from platforms
  const platformTotalViews = hasPlatforms
    ? title.platforms!.reduce((sum, p) => sum + (p.views || 0), 0)
    : 0;

  // Use title.views if no platform data, or platform total
  const totalViews = platformTotalViews > 0 ? platformTotalViews : (title.views || 0);

  return (
    <div className="space-y-6">
      {/* Aggregate Metrics Card */}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:chart-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
            <h3 className="text-lg font-semibold text-black">Aggregate Metrics</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Views */}
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Icon icon="solar:eye-bold-duotone" className="w-5 h-5 text-[#4C9C9B] mx-auto mb-2" />
              <div className="text-2xl font-bold text-black">
                {totalViews === 0 ? 'N/A' : titlesService.formatNumber(totalViews)}
              </div>
              <div className="text-xs text-gray-500">Total Views</div>
            </div>

            {/* Total Likes */}
            {title.likes != null && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Icon icon="solar:graph-up-bold-duotone" className="w-5 h-5 text-pink-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-black">
                  {titlesService.formatNumber(title.likes)}
                </div>
                <div className="text-xs text-gray-500">Total Likes</div>
              </div>
            )}

            {/* Rating */}
            {hasRating && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Icon icon="solar:star-bold-duotone" className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-black">
                  {title.rating?.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  {title.rating_count ? `${titlesService.formatNumber(title.rating_count)} ratings` : 'Avg Rating'}
                </div>
              </div>
            )}

            {/* Chapters */}
            {title.chapters != null && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Icon icon="solar:book-bold-duotone" className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-black">
                  {title.chapters.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Chapters</div>
              </div>
            )}

            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Icon icon="solar:calendar-bold-duotone" className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-black">
                {title.completed ? 'Completed' : 'Ongoing'}
              </div>
              <div className="text-xs text-gray-500">Status</div>
            </div>

            {/* Age Rating */}
            {title.age_rating && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Icon icon="solar:users-group-rounded-bold-duotone" className="w-5 h-5 text-red-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-black">
                  {title.age_rating}
                </div>
                <div className="text-xs text-gray-500">Age Rating</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown Card */}
      {hasPlatforms && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:graph-up-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Platform Breakdown</h3>
              <span className="text-sm text-gray-500">
                ({title.platforms!.length} platforms)
              </span>
            </div>

            <div className="space-y-3">
              {title.platforms!.map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  totalViews={platformTotalViews}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links Card */}
      {(title.title_url || title.title_url_en) && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold text-black mb-4">Quick Links</h3>
            <div className="flex flex-wrap gap-3">
              {title.title_url && (
                <Button
                  variant="outline"
                  className="border-gray-200 hover:bg-[#4C9C9B]/5 hover:border-[#4C9C9B]/30"
                  onClick={() => window.open(title.title_url, '_blank')}
                >
                  <Icon icon="solar:square-arrow-right-up-bold-duotone" className="w-4 h-4 mr-2" />
                  Korean Original
                </Button>
              )}
              {title.title_url_en && (
                <Button
                  variant="outline"
                  className="border-gray-200 hover:bg-[#4C9C9B]/5 hover:border-[#4C9C9B]/30"
                  onClick={() => window.open(title.title_url_en, '_blank')}
                >
                  <Icon icon="solar:square-arrow-right-up-bold-duotone" className="w-4 h-4 mr-2" />
                  English Translation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No platforms message */}
      {!hasPlatforms && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-8 text-center">
            <Icon icon="solar:chart-bold-duotone" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No detailed platform data available.</p>
            <p className="text-gray-400 text-sm mt-1">
              Aggregate metrics are shown above based on title data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
