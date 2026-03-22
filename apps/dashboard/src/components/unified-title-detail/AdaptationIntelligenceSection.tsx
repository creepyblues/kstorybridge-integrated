import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { CompsAnalysisCard } from '@/components/title-detail/CompsAnalysisCard';
import { type SuggestedComp } from '@/services/compsGeneratorService';
import { type AuthState } from './types';

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
        <div className="mb-8">
          <CompsAnalysisCard compsAnalysis={compsAnalysis!} />
        </div>
      );
    }

    if (hasComps) {
      return (
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-black">Comparable Titles</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-black">Adaptation Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="font-medium mb-1">Coming Soon</p>
            <p className="text-sm">Comp analysis is being generated for this title.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Anonymous: teaser with one visible comp + blurred placeholders
  return (
    <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
      <CardHeader>
        <CardTitle className="text-xl text-black">Adaptation Intelligence</CardTitle>
        <p className="text-sm text-gray-500 mt-1">AI-matched to titles in active production mandates</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* One visible static comp card */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="w-full h-32 rounded-lg mb-3 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-400">Poster</span>
            </div>
            <p className="font-medium text-sm text-black truncate">To All the Boys I've Loved Before</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">88% match</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">Strong YA romance with cross-cultural appeal</p>
          </div>

          {/* 4 blurred locked cards */}
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white relative overflow-hidden">
              <div className="blur-sm pointer-events-none">
                <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <Link to="/signup" onClick={() => onCtaClick?.('comps')}>
            <Button variant="outline" className="border-gray-300 hover:bg-gray-100 rounded-full px-6">
              Unlock All Comparables — Free
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
