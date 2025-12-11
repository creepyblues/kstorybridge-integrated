import { useState, useEffect, useRef } from 'react';
import { Document, Page } from '@/lib/pdfConfig'; // Use centralized config
import { Loader2, FileText } from 'lucide-react';
import { debug } from '@/utils/debug';

interface PitchDeckThumbnailProps {
  pdfUrl: string;
  onClick: () => void;
  className?: string;
  alt?: string;
}

/**
 * PitchDeckThumbnail Component
 *
 * Displays first page of a PDF as a clickable thumbnail preview.
 *
 * Features:
 * - Lazy loading (only loads when visible)
 * - Memory leak prevention (cleans up blob URLs)
 * - Comprehensive error handling
 * - Loading states
 * - Responsive sizing
 * - Hover effects
 * - Accessibility support
 */
export default function PitchDeckThumbnail({
  pdfUrl,
  onClick,
  className = '',
  alt = 'Pitch deck preview',
}: PitchDeckThumbnailProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Lazy loading: Only load PDF when component is visible
  useEffect(() => {
    if (!thumbnailRef.current) return;

    try {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            debug.log('📄 PitchDeckThumbnail: Component visible, loading PDF...');
            setIsVisible(true);
            observerRef.current?.disconnect(); // Load only once
          }
        },
        { threshold: 0.1 } // Trigger when 10% visible
      );

      if (observerRef.current && thumbnailRef.current) {
        observerRef.current.observe(thumbnailRef.current);
      }
    } catch (error) {
      // Fallback: If IntersectionObserver fails (e.g., in tests), load immediately
      debug.warn('📄 PitchDeckThumbnail: IntersectionObserver not available, loading immediately');
      setIsVisible(true);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Fetch PDF data when component becomes visible
  useEffect(() => {
    if (!isVisible || !pdfUrl) return;

    const fetchPDF = async () => {
      try {
        debug.log('📄 PitchDeckThumbnail: Fetching PDF...', pdfUrl);
        setLoading(true);
        setError(false);

        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }

        const blob = await response.blob();
        const dataUrl = URL.createObjectURL(blob);
        setPdfData(dataUrl);
        debug.log('✅ PitchDeckThumbnail: PDF loaded successfully');
      } catch (err) {
        console.error('❌ PitchDeckThumbnail: Error loading PDF:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchPDF();
  }, [isVisible, pdfUrl]);

  // Memory cleanup: Revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfData && pdfData.startsWith('blob:')) {
        debug.log('🧹 PitchDeckThumbnail: Cleaning up blob URL');
        URL.revokeObjectURL(pdfData);
      }
    };
  }, [pdfData]);

  const handleClick = () => {
    debug.log('📄 PitchDeckThumbnail: Thumbnail clicked');
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      id="title-detail-view-pitch-btn"
      ref={thumbnailRef}
      className={`relative cursor-pointer group ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={alt}
    >
      {/* Thumbnail Container */}
      <div className="relative w-full h-48 sm:h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-lg transition-all duration-300">
        {/* Loading State */}
        {loading && !error && isVisible && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
            <span className="text-sm text-gray-500">Loading preview...</span>
          </div>
        )}

        {/* Placeholder (before lazy load) */}
        {!isVisible && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <FileText className="h-12 w-12 text-gray-300 mb-2" />
            <span className="text-sm text-gray-400">Pitch Deck Preview</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white">
            <FileText className="h-12 w-12 text-gray-300 mb-2" />
            <span className="text-sm text-gray-500 text-center">
              Preview unavailable
            </span>
            <span className="text-xs text-gray-400 mt-1">Click to view full deck</span>
          </div>
        )}

        {/* PDF First Page */}
        {!error && pdfData && isVisible && (
          <div className="pitch-thumbnail-container flex items-center justify-center w-full h-full">
            <Document
              file={pdfData}
              onLoadSuccess={() => {
                debug.log('✅ PitchDeckThumbnail: Document loaded');
                setLoading(false);
              }}
              onLoadError={(err) => {
                console.error('❌ PitchDeckThumbnail: Document load error:', err);
                setError(true);
                setLoading(false);
              }}
              loading={null}
            >
              <Page
                pageNumber={1}
                width={400} // Fixed width for performance
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="pitch-thumbnail-page"
              />
            </Document>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center pointer-events-none">
          <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm px-4 py-2 bg-black/20 rounded-lg backdrop-blur-sm">
            Click to view full deck
          </span>
        </div>
      </div>
    </div>
  );
}
