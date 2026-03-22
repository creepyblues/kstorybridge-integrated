import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { type Title, titlesService } from '@/services/titlesService';

interface MetricsSectionProps {
  title: Title;
}

const getPlatformInfo = (url: string): { name: string; icon: string; color: string } => {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('naver.com') || urlLower.includes('comic.naver'))
    return { name: 'Naver', icon: 'simple-icons:naver', color: '#03C75A' };
  if (urlLower.includes('kakaopage') || urlLower.includes('page.kakao'))
    return { name: 'Kakao Page', icon: 'simple-icons:kakao', color: '#FFCD00' };
  if (urlLower.includes('kakao'))
    return { name: 'Kakao', icon: 'simple-icons:kakao', color: '#FFCD00' };
  if (urlLower.includes('manta'))
    return { name: 'Manta', icon: 'simple-icons:googleplay', color: '#6B5CE7' };
  if (urlLower.includes('webtoons.com') || urlLower.includes('webtoon.com'))
    return { name: 'Webtoon', icon: 'simple-icons:webtoon', color: '#00D564' };
  return { name: 'Website', icon: 'solar:globe-bold-duotone', color: '#4C9C9B' };
};

export function MetricsSection({ title }: MetricsSectionProps) {
  const hasPlatforms = title.platforms && title.platforms.length > 0;
  const hasRating = title.rating != null && title.rating > 0;
  const platformTotalViews = hasPlatforms
    ? title.platforms!.reduce((sum, p) => sum + (p.views || 0), 0)
    : 0;
  const totalViews = platformTotalViews > 0 ? platformTotalViews : (title.views || 0);
  const hasQuickLinks = title.title_url || title.title_url_en;
  const hasMetrics = totalViews > 0 || title.likes != null || hasRating || title.chapters != null;

  if (!hasMetrics && !hasQuickLinks) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      {hasMetrics && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:chart-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Metrics</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {totalViews > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Icon icon="solar:eye-bold-duotone" className="w-4 h-4 text-[#4C9C9B] mx-auto mb-1" />
                  <div className="text-lg font-bold text-black">{titlesService.formatNumber(totalViews)}</div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
              )}
              {title.likes != null && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Icon icon="solar:graph-up-bold-duotone" className="w-4 h-4 text-pink-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-black">{titlesService.formatNumber(title.likes)}</div>
                  <div className="text-xs text-gray-500">Likes</div>
                </div>
              )}
              {hasRating && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Icon icon="solar:star-bold-duotone" className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-black">{title.rating?.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">
                    {title.rating_count ? `${titlesService.formatNumber(title.rating_count)} ratings` : 'Rating'}
                  </div>
                </div>
              )}
              {title.chapters != null && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Icon icon="solar:book-bold-duotone" className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-black">{title.chapters.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Chapters</div>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <div className="text-base font-bold text-black">{title.completed ? 'Completed' : 'Ongoing'}</div>
                <div className="text-xs text-gray-500">Status</div>
              </div>
              {title.age_rating && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Icon icon="solar:users-group-rounded-bold-duotone" className="w-4 h-4 text-red-500 mx-auto mb-1" />
                  <div className="text-base font-bold text-black">{title.age_rating}</div>
                  <div className="text-xs text-gray-500">Age Rating</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {hasQuickLinks && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:link-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Official Websites</h3>
            </div>
            <div className="flex flex-col gap-2">
              {title.title_url && (() => {
                const platform = getPlatformInfo(title.title_url);
                return (
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-200 hover:bg-gray-50"
                    onClick={() => window.open(title.title_url, '_blank')}
                  >
                    <Icon icon={platform.icon} className="w-4 h-4 mr-2" style={{ color: platform.color }} />
                    {platform.name} (Korean)
                  </Button>
                );
              })()}
              {title.title_url_en && (() => {
                const platform = getPlatformInfo(title.title_url_en);
                return (
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-200 hover:bg-gray-50"
                    onClick={() => window.open(title.title_url_en, '_blank')}
                  >
                    <Icon icon={platform.icon} className="w-4 h-4 mr-2" style={{ color: platform.color }} />
                    {platform.name} (English)
                  </Button>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
