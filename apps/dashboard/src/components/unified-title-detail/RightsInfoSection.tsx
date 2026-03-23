import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, CheckCircle } from 'lucide-react';
import { Icon } from '@iconify/react';
import { type Title } from '@/services/titlesService';
import { type AuthState, type PublicTitle, formatLabel } from './types';

const RIGHTS_LABELS: Record<string, string> = {
  film_tv: 'Film/TV',
  animation: 'Animation',
  publication: 'Publication',
  merchandising: 'Merchandising',
  game: 'Game',
  other: 'Other',
};

interface RightsInfoSectionProps {
  authState: AuthState;
  title: PublicTitle | Title;
  onCtaClick?: (position: string) => void;
}

export function RightsInfoSection({ authState, title, onCtaClick }: RightsInfoSectionProps) {
  const isLoggedIn = authState === 'authenticated';
  const hasRightsAvailable = title.rights_available && title.rights_available.length > 0;

  if (isLoggedIn) {
    const fullTitle = title as Title;

    return (
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl text-black">Rights Information</CardTitle>
            {fullTitle.verified && (
              <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                <Icon icon="solar:check-circle-bold-duotone" className="w-3 h-3 mr-1" />
                Rights Verified
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hasRightsAvailable && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Available Formats</p>
                <div className="flex flex-wrap gap-2">
                  {title.rights_available!.map(r => (
                    <Badge key={r} className="bg-[#4C9C9B]/10 text-[#4C9C9B] border border-[#4C9C9B]/20 px-3 py-1.5 font-medium">
                      <CheckCircle className="h-3 w-3 mr-1" /> {RIGHTS_LABELS[r] || formatLabel(r)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {(fullTitle.rights_holder_name || fullTitle.rights_holder_company) && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Rights Holder</p>
                <p className="text-gray-800">
                  {fullTitle.rights_holder_name}
                  {fullTitle.rights_holder_company && (
                    <span className="text-gray-500"> &middot; {fullTitle.rights_holder_company}</span>
                  )}
                </p>
              </div>
            )}
            {!hasRightsAvailable && fullTitle.rights && (
              <p className="text-gray-600">{fullTitle.rights}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Anonymous
  return (
    <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
      <CardHeader>
        <CardTitle className="text-xl text-black">Rights Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-500">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">Rights Info</span>
          </div>
          <p className="text-sm text-gray-500">Sign in to view rights availability and licensing contacts</p>
          <Link to="/signup" onClick={() => onCtaClick?.('rights')}>
            <Button className="bg-black hover:bg-gray-800 text-white rounded-full px-6 py-2 text-sm font-medium mt-2">
              Unlock Full Analysis — Free
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
