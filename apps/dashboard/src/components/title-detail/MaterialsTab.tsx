import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TierGatedContent } from '@/components/tier/TierGatedContent';
import { Title, TitleDocument } from '@/services/titlesService';
import { UserTier } from '@/contexts/TierContext';
import PitchDeckThumbnail from '@/components/premium/PitchDeckThumbnail';
import SecurePDFViewer from '@/components/premium/SecurePDFViewer';
import {
  FileText,
  FolderOpen,
  Download,
  ExternalLink,
  Lock,
  Unlock,
  X,
  File,
} from 'lucide-react';

interface MaterialsTabProps {
  title: Title;
  userTier: UserTier;
}

// Document type display mapping
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  source_pdf: 'Source Material (PDF)',
  story_bible: 'Story Bible',
  outline: 'Plot Outline',
  script: 'Script',
  press_release: 'Press Release',
  interview: 'Interview',
  review: 'Review',
  wiki: 'Wiki / Reference',
  other: 'Other Document',
};

// Document type icons
const DOCUMENT_TYPE_ICONS: Record<string, string> = {
  source_pdf: 'text-blue-500',
  story_bible: 'text-purple-500',
  outline: 'text-green-500',
  script: 'text-orange-500',
  press_release: 'text-pink-500',
  interview: 'text-cyan-500',
  review: 'text-amber-500',
  wiki: 'text-indigo-500',
  other: 'text-gray-500',
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentCard({ document }: { document: TitleDocument }) {
  const iconColor = DOCUMENT_TYPE_ICONS[document.document_type] || DOCUMENT_TYPE_ICONS.other;
  const isNdaRequired = document.shareable_with_nda === true;
  const hasExternalUrl = !!document.external_url;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <File className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-black truncate">
            {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {document.file_name}
            {document.file_size && (
              <span className="ml-2">&bull; {formatFileSize(document.file_size)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-3">
        {isNdaRequired ? (
          <>
            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
              <Lock className="w-3 h-3 mr-1" />
              NDA Required
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="text-[#4C9C9B] border-[#4C9C9B]/30 hover:bg-[#4C9C9B]/5"
            >
              Request Access
            </Button>
          </>
        ) : (
          <>
            <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
              <Unlock className="w-3 h-3 mr-1" />
              Available
            </Badge>
            {hasExternalUrl ? (
              <Button
                variant="outline"
                size="sm"
                className="text-[#4C9C9B] border-[#4C9C9B]/30 hover:bg-[#4C9C9B]/5"
                onClick={() => window.open(document.external_url!, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Open
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-[#4C9C9B] border-[#4C9C9B]/30 hover:bg-[#4C9C9B]/5"
                onClick={() => window.open(document.file_url, '_blank')}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function MaterialsTab({ title, userTier }: MaterialsTabProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');

  const hasPitchDeck = title.pitch && title.pitch.trim() !== '';
  const hasDocuments = title.documents && title.documents.length > 0;

  const handleOpenPdf = (url: string) => {
    setCurrentPdfUrl(url);
    setTimeout(() => setIsPdfModalOpen(true), 10);
  };

  return (
    <div className="space-y-6">
      {/* Pitch Deck Card - PRO Gated */}
      {hasPitchDeck && (
        <TierGatedContent requiredTier="pro">
          <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#4C9C9B]" />
                <h3 className="text-lg font-semibold text-black">Pitch Deck</h3>
                <Badge className="bg-[#AF52DE]/10 text-[#AF52DE] text-xs">PRO</Badge>
              </div>

              <PitchDeckThumbnail
                pdfUrl={title.pitch!}
                onClick={() => handleOpenPdf(title.pitch!)}
                alt={`${title.title_name_en || title.title_name_kr} pitch deck preview`}
              />
            </CardContent>
          </Card>
        </TierGatedContent>
      )}

      {/* Documents Card - PRO Gated */}
      {hasDocuments && (
        <TierGatedContent requiredTier="pro">
          <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-[#4C9C9B]" />
                <h3 className="text-lg font-semibold text-black">Available Documents</h3>
                <Badge className="bg-[#AF52DE]/10 text-[#AF52DE] text-xs">PRO</Badge>
                <span className="text-sm text-gray-500">
                  ({title.documents!.length} documents)
                </span>
              </div>

              <div className="space-y-3">
                {title.documents!.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TierGatedContent>
      )}

      {/* No materials message */}
      {!hasPitchDeck && !hasDocuments && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No materials available for this title.</p>
            <p className="text-gray-400 text-sm mt-1">
              Check back later or contact the rights holder for more information.
            </p>
          </CardContent>
        </Card>
      )}

      {/* PDF Modal */}
      {isPdfModalOpen && currentPdfUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-xl overflow-hidden relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPdfModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="h-full">
              <SecurePDFViewer
                pdfUrl={currentPdfUrl}
                userTier={userTier}
                maxPagesForBasic={5}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
