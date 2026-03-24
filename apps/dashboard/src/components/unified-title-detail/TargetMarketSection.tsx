import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { TierGatedContent } from '@/components/tier/TierGatedContent';
import { type Title } from '@/services/titlesService';

interface TargetMarketSectionProps {
  title: Title;
}

export function TargetMarketSection({ title }: TargetMarketSectionProps) {
  if (!title.perfect_for && !title.audience && !title.tone) return null;

  return (
    <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl mb-8">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="solar:target-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
          <h3 className="text-lg font-semibold text-black">Target Market</h3>
        </div>

        <TierGatedContent requiredTier="basic">
          <div className="space-y-4">
            {title.perfect_for && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Perfect For</div>
                <Badge className="bg-[#4C9C9B]/10 text-[#4C9C9B] border border-[#4C9C9B]/20 px-3 py-1.5 font-medium">
                  {title.perfect_for}
                </Badge>
              </div>
            )}
            {title.audience && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Target Audience</div>
                <Badge className="bg-[#4C9C9B]/10 text-[#4C9C9B] border border-[#4C9C9B]/20 px-3 py-1.5 font-medium">
                  {title.audience}
                </Badge>
              </div>
            )}
            {title.tone && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Tone</div>
                <Badge className="bg-[#4C9C9B]/10 text-[#4C9C9B] border border-[#4C9C9B]/20 px-3 py-1.5 font-medium">
                  {title.tone}
                </Badge>
              </div>
            )}
          </div>
        </TierGatedContent>
      </CardContent>
    </Card>
  );
}
