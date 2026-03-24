import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { type Title, titlesService } from '@/services/titlesService';
import { SectionCard } from './SectionCard';
import { BarChart3 } from 'lucide-react';

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
  const platformTotalViews = hasPlatforms
    ? title.platforms!.reduce((sum, p) => sum + (p.views || 0), 0)
    : 0;
  const totalViews = platformTotalViews > 0 ? platformTotalViews : (title.views || 0);
  const hasQuickLinks = title.title_url || title.title_url_en;
  const hasRating = title.rating != null && title.rating > 0;
  const hasMetrics = totalViews > 0 || title.likes != null || hasRating || title.chapters != null;

  if (!hasMetrics && !hasQuickLinks) return null;

  return (
    <SectionCard title="Metrics & Platforms" icon={<BarChart3 className="h-5 w-5" />}>
      {hasMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {totalViews > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Icon icon="solar:eye-bold-duotone" className="w-6 h-6 text-[#4C9C9B] mx-auto mb-1.5" />
              <div className="text-lg font-bold text-gray-900">{titlesService.formatNumber(totalViews)}</div>
              <div className="text-xs text-gray-500">Views</div>
            </div>
          )}
          {title.likes != null && (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Icon icon="solar:graph-up-bold-duotone" className="w-6 h-6 text-pink-500 mx-auto mb-1.5" />
              <div className="text-lg font-bold text-gray-900">{titlesService.formatNumber(title.likes)}</div>
              <div className="text-xs text-gray-500">Likes</div>
            </div>
          )}
          {hasRating && (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Icon icon="solar:star-bold-duotone" className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
              <div className="text-lg font-bold text-gray-900">{title.rating?.toFixed(1)}</div>
              <div className="text-xs text-gray-500">
                {title.rating_count ? `${titlesService.formatNumber(title.rating_count)} ratings` : 'Rating'}
              </div>
            </div>
          )}
          {title.chapters != null && (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Icon icon="solar:book-bold-duotone" className="w-6 h-6 text-blue-500 mx-auto mb-1.5" />
              <div className="text-lg font-bold text-gray-900">{title.chapters.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Chapters</div>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Icon icon="solar:calendar-bold-duotone" className="w-6 h-6 text-green-500 mx-auto mb-1.5" />
            <div className="text-base font-bold text-gray-900">{title.completed ? 'Completed' : 'Ongoing'}</div>
            <div className="text-xs text-gray-500">Status</div>
          </div>
          {title.age_rating && (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Icon icon="solar:users-group-rounded-bold-duotone" className="w-6 h-6 text-red-500 mx-auto mb-1.5" />
              <div className="text-base font-bold text-gray-900">{title.age_rating}</div>
              <div className="text-xs text-gray-500">Age Rating</div>
            </div>
          )}
        </div>
      )}

      {hasQuickLinks && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Official Websites</h4>
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
        </div>
      )}
    </SectionCard>
  );
}
