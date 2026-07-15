import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import PitchDeckThumbnail from '@/components/premium/PitchDeckThumbnail';
import SecurePDFViewer from '@/components/premium/SecurePDFViewer';
import { trackTitlePitchCtaClicked } from '@/utils/analytics';
import { type UserTier } from '@/contexts/TierContext';

interface PitchDeckSectionProps {
  titleId: string;
  titleName: string;
  pitchUrl: string;
  userTier: UserTier;
}

export function PitchDeckSection({ titleId, titleName, pitchUrl, userTier }: PitchDeckSectionProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  return (
    <>
      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl mb-8">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
            <h3 className="text-lg font-semibold text-black">Pitch Deck</h3>
          </div>
          <PitchDeckThumbnail
            pdfUrl={pitchUrl}
            onClick={() => {
              trackTitlePitchCtaClicked(titleId, titleName, true);
              setIsPdfModalOpen(true);
            }}
            alt={`${titleName} pitch deck preview`}
          />
        </CardContent>
      </Card>

      {isPdfModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-xl overflow-hidden relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPdfModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
            >
              <Icon icon="solar:close-circle-bold-duotone" className="h-5 w-5" />
            </Button>
            <div className="h-full">
              <SecurePDFViewer
                pdfUrl={pitchUrl}
                titleId={titleId}
                userTier={userTier}
                maxPagesForBasic={5}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
