import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { type Title } from '@/services/titlesService';

interface AchievementsSectionProps {
  title: Title;
}

export function AchievementsSection({ title }: AchievementsSectionProps) {
  const hasAwards = title.awards && title.awards.length > 0;
  const hasAchievements = hasAwards || title.media_coverage || title.merchandise_deals ||
    title.print_editions || title.celebrity_endorsements || title.sales_records;

  if (!hasAchievements) return null;

  return (
    <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl mb-8">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="solar:cup-star-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
          <h3 className="text-lg font-semibold text-black">Recognition & Achievements</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasAwards && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="solar:star-bold-duotone" className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-gray-700">Awards</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {title.awards!.map((award, idx) => (
                  <Badge key={idx} className="bg-amber-50 text-amber-700 border border-amber-200">
                    {award}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {title.media_coverage && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="solar:document-text-bold-duotone" className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-700">Media Coverage</span>
              </div>
              <p className="text-gray-600 text-sm">{title.media_coverage}</p>
            </div>
          )}

          {title.sales_records && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="solar:cup-star-bold-duotone" className="w-4 h-4 text-green-500" />
                <span className="font-medium text-gray-700">Sales Records</span>
              </div>
              <p className="text-gray-600 text-sm">{title.sales_records}</p>
            </div>
          )}

          {(title.merchandise_deals || title.print_editions) && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="solar:box-bold-duotone" className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-gray-700">Merchandise & Print</span>
              </div>
              <div className="text-gray-600 text-sm space-y-1">
                {title.print_editions && (
                  <p>Print editions available{title.print_edition_details ? `: ${title.print_edition_details}` : ''}</p>
                )}
                {title.merchandise_deals && <p>{title.merchandise_deals}</p>}
              </div>
            </div>
          )}

          {title.celebrity_endorsements && (
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="solar:star-bold-duotone" className="w-4 h-4 text-pink-500" />
                <span className="font-medium text-gray-700">Celebrity Endorsements</span>
              </div>
              <p className="text-gray-600 text-sm italic">"{title.celebrity_endorsements}"</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
