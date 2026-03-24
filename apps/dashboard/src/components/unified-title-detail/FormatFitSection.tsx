import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, Film, Tv, Smartphone, Mic, Sparkles, Layers } from 'lucide-react';
import { FormatFitDetailPanel } from '@/components/format-fit/FormatFitDetailPanel';
import { type AuthState } from './types';
import { SectionCard } from './SectionCard';

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
      <div className="min-h-0">
        <FormatFitDetailPanel
          titleId={titleId}
          className="bg-white border border-gray-200 shadow-sm rounded-2xl h-full"
        />
      </div>
    );
  }

  // Anonymous: blurred format bars
  return (
    <SectionCard title="Format Suitability" icon={<Layers className="h-5 w-5" />}>
      <div className="space-y-3">
        {FORMAT_LABELS.map((f, idx) => (
          <div key={f.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-28 flex-shrink-0">
              <f.icon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{f.label}</span>
            </div>
            {idx === 0 ? (
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4C9C9B] to-[#6BB5B4] rounded-full"
                    style={{ width: '72%' }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 w-10 text-right">72%</span>
              </div>
            ) : (
              <div className="flex-1 relative">
                <div className="h-5 bg-gray-100 rounded-full overflow-hidden blur-sm">
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
        <div className="text-center mt-4 pt-2">
          <Link to="/signup" onClick={() => onCtaClick?.('format_fit')}>
            <Button variant="outline" className="border-gray-300 hover:bg-gray-100 rounded-full px-6">
              Unlock Format Scores — Free
            </Button>
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}
