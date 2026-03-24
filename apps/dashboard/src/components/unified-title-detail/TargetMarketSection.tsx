import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { TierGatedContent } from '@/components/tier/TierGatedContent';
import { type Title } from '@/services/titlesService';
import { SectionCard } from './SectionCard';

interface TargetMarketSectionProps {
  title: Title;
}

export function TargetMarketSection({ title }: TargetMarketSectionProps) {
  if (!title.perfect_for && !title.audience && !title.tone) return null;

  return (
    <SectionCard title="Target Market" icon={<Target className="h-5 w-5" />}>
      <TierGatedContent requiredTier="basic">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {title.perfect_for && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Perfect For</span>
              <Badge className="bg-[#4C9C9B]/10 text-[#4C9C9B] border border-[#4C9C9B]/20 px-3 py-1 font-medium">
                {title.perfect_for}
              </Badge>
            </div>
          )}
          {title.audience && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Audience</span>
              <Badge className="bg-[#4C9C9B]/10 text-[#4C9C9B] border border-[#4C9C9B]/20 px-3 py-1 font-medium">
                {title.audience}
              </Badge>
            </div>
          )}
          {title.tone && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Tone</span>
              <Badge className="bg-[#4C9C9B]/10 text-[#4C9C9B] border border-[#4C9C9B]/20 px-3 py-1 font-medium">
                {title.tone}
              </Badge>
            </div>
          )}
        </div>
      </TierGatedContent>
    </SectionCard>
  );
}
