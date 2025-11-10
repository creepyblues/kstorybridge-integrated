import { useState, useEffect, useRef } from 'react';
import { Document, Page } from '@/lib/pdfConfig';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

console.log('📄 PitchDeckViewer: Using centralized PDF.js worker configuration');

interface PitchDeckViewerProps {
  pdfUrl: string;
  title?: string;
}

export function PitchDeckViewer({ pdfUrl, title }: PitchDeckViewerProps) {
  const { user } = useAuth();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number | string>("page");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Fetch PDF with authentication
  useEffect(() => {
    const fetchPDF = async () => {
      console.log('🔍 PITCH VIEWER: Starting fetchPDF process...');

      if (!pdfUrl) {
        setError('No PDF URL provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Validate authentication
        if (!user) {
          setError('Authentication required to view PDF');
          setLoading(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setError('Session expired. Please sign in again.');
          setLoading(false);
          return;
        }

        let finalUrl = pdfUrl;

        // Check if Supabase storage URL
        const pathMatch = pdfUrl.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
        if (pathMatch && pdfUrl.includes('supabase.co/storage')) {
          const [, bucketName, filePath] = pathMatch;
          console.log('🔍 PITCH VIEWER: Bucket:', bucketName, 'FilePath:', filePath);

          // Create signed URL
          try {
            const { data: signedUrlData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(filePath, 1800); // 30 minutes

            if (signedUrlData?.signedUrl) {
              finalUrl = signedUrlData.signedUrl;
              console.log('✅ Secure access granted with signed URL');
            }
          } catch (storageError) {
            console.warn('Storage API exception, using direct URL:', storageError);
          }
        }

        // Fetch PDF
        const response = await fetch(finalUrl);
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
        }

        // Verify content type
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/pdf')) {
          throw new Error('Invalid file type. Only PDF files are allowed.');
        }

        // Stream download with progress
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body stream not available');
        }

        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          if (total > 0) {
            const progress = Math.round((receivedLength / total) * 100);
            setLoadingProgress(progress);
          }
        }

        // Create blob
        const blob = new Blob(chunks as BlobPart[], { type: 'application/pdf' });

        if (blob.size > 50 * 1024 * 1024) {
          throw new Error('File too large. Maximum file size is 50MB.');
        }

        const dataUrl = URL.createObjectURL(blob);
        setPdfData(dataUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();
  }, [pdfUrl, user]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfData && pdfData.startsWith('blob:')) {
        URL.revokeObjectURL(pdfData);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    const timer = setTimeout(updateDimensions, 100);
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateDimensions, 50);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [pdfData]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('📄 Document loaded successfully, pages:', numPages);
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('📄 Document load error:', error);
    setError('Failed to load PDF document: ' + error.message);
    setLoading(false);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(numPages, prev + 1));

  const zoomIn = () => setScale(prev => {
    const currentScale = typeof prev === 'number' ? prev : 1;
    return Math.min(3, currentScale + 0.2);
  });

  const zoomOut = () => setScale(prev => {
    const currentScale = typeof prev === 'number' ? prev : 1;
    return Math.max(0.3, currentScale - 0.2);
  });

  // const fitToPage = () => setScale("page");
  const fitToWidth = () => setScale("width");

  if (!user) {
    return (
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Please sign in to view this document.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <div className="w-full max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-black h-full rounded-full transition-all"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{loadingProgress}%</p>
            </div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-16 w-16 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading PDF</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-white rounded-lg h-full flex flex-col">
      <div className="p-6 flex-shrink-0">
        {title && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <div className="h-1 w-16 bg-black rounded-full"></div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="border-gray-300 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="border-gray-300 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              className="border-gray-300 hover:bg-gray-100"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">
              {typeof scale === 'number' ? `${Math.round(scale * 100)}%` : scale === 'page' ? 'Fit' : 'Width'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              className="border-gray-300 hover:bg-gray-100"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fitToWidth}
              className="border-gray-300 hover:bg-gray-100"
              title="Fit to Width"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div
          ref={containerRef}
          className="border border-gray-300 rounded-lg overflow-hidden relative flex justify-center items-center"
          style={{
            minHeight: '600px',
            backgroundColor: '#f5f5f5'
          }}
        >
          {/* Overlay Navigation Buttons */}
          {pdfData && (
            <>
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-200 flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none hover:scale-110"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-200 flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none hover:scale-110"
                aria-label="Next page"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {pdfData && (
            <div className="pdf-container flex justify-center items-center w-full h-full">
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                onLoadProgress={({ loaded, total }) => {
                  const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
                  setLoadingProgress(progress);
                }}
                loading={
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <span className="text-gray-600">Rendering PDF...</span>
                  </div>
                }
              >
                <Page
                  key={`${pageNumber}-${containerDimensions.width}-${containerDimensions.height}`}
                  pageNumber={pageNumber}
                  width={
                    scale === "width" ? Math.max(200, containerDimensions.width - 20) :
                    scale === "page" && containerDimensions.width > 0 ? Math.max(200, containerDimensions.width - 20) :
                    undefined
                  }
                  height={
                    scale === "page" && containerDimensions.height > 0 ? Math.max(200, containerDimensions.height - 20) :
                    undefined
                  }
                  scale={typeof scale === 'number' ? scale : undefined}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
