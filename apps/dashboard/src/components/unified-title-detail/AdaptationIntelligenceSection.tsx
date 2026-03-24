import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { CompsAnalysisCard } from '@/components/title-detail/CompsAnalysisCard';
import { type SuggestedComp } from '@/services/compsGeneratorService';
import { type AuthState } from './types';
import { SectionCard } from './SectionCard';

interface AdaptationIntelligenceSectionProps {
  authState: AuthState;
  compsAnalysis?: SuggestedComp[] | null;
  comps?: string[] | null;
  onCtaClick?: (position: string) => void;
}

export function AdaptationIntelligenceSection({
  authState,
  compsAnalysis,
  comps,
  onCtaClick,
}: AdaptationIntelligenceSectionProps) {
  const isLoggedIn = authState === 'authenticated';
  const hasCompsAnalysis = compsAnalysis && compsAnalysis.length > 0;
  const hasComps = comps && comps.length > 0;

  if (isLoggedIn) {
    if (hasCompsAnalysis) {
      return (
        <div className="min-h-0">
          <CompsAnalysisCard compsAnalysis={compsAnalysis!} />
        </div>
      );
    }

    if (hasComps) {
      return (
        <SectionCard title="Comparable Titles" icon={<Sparkles className="h-5 w-5" />}>
          <div className="flex flex-wrap gap-2">
            {comps!.map((comp, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 font-medium"
              >
                {comp}
              </Badge>
            ))}
          </div>
        </SectionCard>
      );
    }

    return (
      <SectionCard title="Adaptation Intelligence" icon={<Sparkles className="h-5 w-5" />}>
        <div className="text-center py-8 text-gray-500">
          <p className="font-medium mb-1">Coming Soon</p>
          <p className="text-sm">Comp analysis is being generated for this title.</p>
        </div>
      </SectionCard>
    );
  }

  // Anonymous: teaser
  return (
    <SectionCard
      title="Adaptation Intelligence"
      subtitle="AI-matched to titles in active production mandates"
      icon={<Sparkles className="h-5 w-5" />}
    >
      <div className="space-y-3 mb-4">
        {/* One visible comp */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white flex items-center gap-4">
          <img
            src="https://image.tmdb.org/t/p/w300/hKHZhUbIyUAjcSrqJThFGYIR6kI.jpg"
            alt="To All the Boys"
            className="w-16 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">To All the Boys I've Loved Before</p>
            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs mt-1">88% match</Badge>
            <p className="text-xs text-gray-500 mt-1">Strong YA romance with cross-cultural appeal</p>
          </div>
        </div>

        {/* Blurred placeholders */}
        {[1, 2].map(i => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white relative overflow-hidden">
            <div className="blur-sm pointer-events-none flex items-center gap-4">
              <div className="w-16 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <Link to="/signup" onClick={() => onCtaClick?.('comps')}>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-100 rounded-full px-6">
            Unlock All Comparables — Free
          </Button>
        </Link>
      </div>
    </SectionCard>
  );
}
