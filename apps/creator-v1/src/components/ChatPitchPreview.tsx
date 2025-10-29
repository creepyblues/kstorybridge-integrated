import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Badge } from '@kstorybridge/ui';
import SecurePDFViewer from './SecurePDFViewer';
import PitchDeckThumbnail from './PitchDeckThumbnail';

interface ChatPitchPreviewProps {
  titleId: string;
  titleName: string;
  pitchUrl: string;
  userTier: 'basic' | 'pro' | 'suite' | null;
}

export function ChatPitchPreview({ titleId, titleName, pitchUrl, userTier }: ChatPitchPreviewProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const canAccessPremiumContent = userTier === 'pro' || userTier === 'suite';

  if (!pitchUrl || !pitchUrl.trim()) {
    return null;
  }

  return (
    <>
      {/* Visual Pitch Deck Thumbnail Preview */}
      <div className="mt-4 space-y-3 max-w-md">
        {/* Thumbnail showing first page of PDF */}
        <PitchDeckThumbnail
          pdfUrl={pitchUrl}
          onClick={() => setIsPdfModalOpen(true)}
          alt={`${titleName} pitch deck preview`}
          className="w-full"
        />

        {/* Tier Badge and Info */}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-gray-600">
            {canAccessPremiumContent
              ? 'Click to view complete pitch deck'
              : 'Preview: Pages 1-5 only'}
          </span>
          {!canAccessPremiumContent && (
            <Badge className="bg-pro-purple text-white text-xs px-2 py-0.5">
              PRO PLAN
            </Badge>
          )}
        </div>

        {/* Link to full title detail page */}
        <div className="px-2">
          <a
            href={`/buyers/titles/${titleId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-hanok-teal font-medium transition-colors"
          >
            <span>View full title details</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Enhanced PDF Modal with Modern Design */}
      {isPdfModalOpen && (
        <div
          className="fixed inset-0 bg-gradient-to-br from-midnight-ink/80 via-midnight-ink/90 to-black/95 z-[9999] flex items-center justify-center p-4"
          onClick={() => setIsPdfModalOpen(false)}
          style={{
            animation: 'fadeIn 0.3s ease-out',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-porcelain-blue/20 max-w-7xl w-full max-h-[95vh] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: 'translateY(0)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Enhanced Header with Gradient */}
            <div className="relative bg-gradient-to-r from-hanok-teal to-hanok-teal/90 p-6 border-b border-hanok-teal/20">
              <div className="absolute inset-0 bg-gradient-to-r from-hanok-teal/10 to-transparent"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                    {titleName}
                  </h2>
                  <p className="text-white/80 text-sm">Pitch Deck Preview</p>
                </div>
              </div>
            </div>

            {/* PDF Content Container with Refined Styling */}
            <div className="relative bg-gradient-to-b from-gray-50 to-white" style={{ height: 'calc(95vh - 80px)', width: '100%' }}>
              <div className="p-1 h-full w-full">
                <div className="bg-white rounded-xl shadow-inner border border-gray-100 overflow-hidden w-full h-full flex justify-center">
                  <div style={{
                    width: '75%',
                    height: '100%',
                    maxWidth: '1000px',
                    minWidth: '600px'
                  }}>
                    <SecurePDFViewer
                      pdfUrl={pitchUrl}
                      userTier={userTier}
                      maxPagesForBasic={5}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Close Button */}
            <button
              onClick={() => setIsPdfModalOpen(false)}
              className="absolute top-6 right-6 group bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-xl p-3 transition-all duration-300 z-10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-white group-hover:text-white transition-colors duration-200" />
            </button>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
