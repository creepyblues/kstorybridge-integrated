import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Film, Tv, Smartphone, Mic, Sparkles } from 'lucide-react';
import { FormatFitDetailPanel } from '@/components/format-fit/FormatFitDetailPanel';
import { type AuthState } from './types';

const FORMAT_LABELS = [
  { key: 'film', label: 'Film', icon: Film },
  { key: 'tv_series', label: 'TV Series', icon: Tv },
  { key: 'animation', label: 'Animation', icon: Sparkles },
  { key: 'microdrama', label: 'Microdrama', icon: Smartphone },
  { key: 'audio_drama', label: 'Audio Drama', icon: Mic },
];

interface FormatFitSectionProps {
  authState: AuthState;
  titleId: string;
  onCtaClick?: (position: string) => void;
}

export function FormatFitSection({ authState, titleId, onCtaClick }: FormatFitSectionProps) {
  const isLoggedIn = authState === 'authenticated';

  if (isLoggedIn) {
    return (
      <div className="mb-8">
        <FormatFitDetailPanel
          titleId={titleId}
          className="bg-white border border-gray-200 shadow-sm rounded-2xl"
        />
      </div>
    );
  }

  // Anonymous: blurred format bars
  return (
    <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
      <CardHeader>
        <CardTitle className="text-xl text-black">Format Suitability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {FORMAT_LABELS.map((f, idx) => (
            <div key={f.key} className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32 flex-shrink-0">
                <f.icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{f.label}</span>
              </div>
              {idx === 0 ? (
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-black to-gray-700 rounded-full"
                      style={{ width: '72%' }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-black w-10 text-right">72%</span>
                </div>
              ) : (
                <div className="flex-1 relative">
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden blur-sm">
                    <div
                      className="h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                      style={{ width: `${50 + idx * 8}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <Lock className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="text-center mt-4">
            <Link to="/signup" onClick={() => onCtaClick?.('format_fit')}>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-100 rounded-full px-6">
                Unlock Format Scores — Free
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
