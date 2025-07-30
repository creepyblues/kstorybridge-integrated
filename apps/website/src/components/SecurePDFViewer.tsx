import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface SecurePDFViewerProps {
  pdfUrl: string;
  title?: string;
}

export default function SecurePDFViewer({ pdfUrl, title }: SecurePDFViewerProps) {
  const { user } = useAuth();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch PDF with authentication
  useEffect(() => {
    const fetchPDF = async () => {
      if (!user || !pdfUrl) {
        setError('Authentication required to view PDF');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get authenticated URL from Supabase
        let finalUrl = pdfUrl;
        
        // If it's a Supabase storage URL, get a signed URL
        if (pdfUrl.includes('supabase.co/storage')) {
          const pathMatch = pdfUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
          if (pathMatch) {
            const [, bucketName, filePath] = pathMatch;
            const { data: signedUrlData, error: urlError } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(filePath, 3600); // 1 hour expiry

            if (urlError) throw urlError;
            if (signedUrlData?.signedUrl) {
              finalUrl = signedUrlData.signedUrl;
            }
          }
        }

        // Fetch PDF data
        const response = await fetch(finalUrl);
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status}`);
        }

        const blob = await response.blob();
        const dataUrl = URL.createObjectURL(blob);
        setPdfData(dataUrl);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();

    // Cleanup function to revoke object URL
    return () => {
      if (pdfData) {
        URL.revokeObjectURL(pdfData);
      }
    };
  }, [pdfUrl, user, pdfData]);

  // Security: Disable right-click, text selection, and keyboard shortcuts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventActions = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventKeyboard = (e: KeyboardEvent) => {
      // Disable Ctrl+P (print), Ctrl+S (save), Ctrl+A (select all), etc.
      if (e.ctrlKey || e.metaKey) {
        const blockedKeys = ['p', 's', 'a', 'c', 'v', 'f', 'u', 'i', 'j', 'shift+i', 'shift+j'];
        if (blockedKeys.includes(e.key.toLowerCase())) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
      // Disable F12 (dev tools), F11 (fullscreen), and other function keys
      if (['F12', 'F11', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'].includes(e.key) || 
          [123, 122, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121].includes(e.keyCode)) {
        e.preventDefault();
        return false;
      }
      // Disable Alt+F4, Alt+Tab
      if (e.altKey && ['F4', 'Tab'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    container.addEventListener('contextmenu', preventActions);
    container.addEventListener('selectstart', preventActions);
    container.addEventListener('dragstart', preventActions);
    container.addEventListener('copy', preventActions);
    container.addEventListener('cut', preventActions);
    container.addEventListener('paste', preventActions);
    document.addEventListener('keydown', preventKeyboard);
    
    // Prevent global print attempts
    const preventPrint = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.warn('Printing is disabled for this secure document');
      return false;
    };
    
    window.addEventListener('beforeprint', preventPrint);
    window.addEventListener('afterprint', preventPrint);

    // Disable print styles and hide PDF.js controls
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        .secure-pdf-viewer { display: none !important; }
        body * { visibility: hidden !important; }
      }
      .react-pdf__Page__textContent {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      .react-pdf__Page__annotations {
        pointer-events: none !important;
      }
      /* Hide PDF.js built-in controls that might enable download/print */
      .react-pdf__Document canvas {
        pointer-events: none !important;
      }
      /* Prevent drag and drop */
      * {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      container.removeEventListener('contextmenu', preventActions);
      container.removeEventListener('selectstart', preventActions);
      container.removeEventListener('dragstart', preventActions);
      container.removeEventListener('copy', preventActions);
      container.removeEventListener('cut', preventActions);
      container.removeEventListener('paste', preventActions);
      document.removeEventListener('keydown', preventKeyboard);
      window.removeEventListener('beforeprint', preventPrint);
      window.removeEventListener('afterprint', preventPrint);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    setLoading(false);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(numPages, prev + 1));
  const zoomIn = () => setScale(prev => Math.min(3, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  if (!user) {
    return (
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Please log in to view the pitch document.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Loading PDF...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="p-6">
        {title && (
          <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        )}
        
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
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
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={rotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div 
          ref={containerRef}
          className="secure-pdf-viewer border border-gray-200 rounded-lg overflow-auto relative"
          style={{ 
            maxHeight: '70vh',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            position: 'relative'
          }}
        >
          {/* Security Watermark Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 100px,
                rgba(0, 0, 0, 0.03) 100px,
                rgba(0, 0, 0, 0.03) 120px
              )`,
              mixBlendMode: 'multiply'
            }}
          >
            <div 
              className="absolute inset-0 flex items-center justify-center text-gray-300 text-6xl font-bold opacity-10 select-none"
              style={{
                transform: 'rotate(-45deg)',
                fontSize: '8rem',
                lineHeight: '1',
                whiteSpace: 'nowrap'
              }}
            >
              CONFIDENTIAL
            </div>
          </div>
          {pdfData && (
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="p-8 text-center">Loading PDF...</div>}
              options={{
                // Disable PDF.js built-in UI controls
                disableCreateObjectURL: false,
                disableWebGL: false,
                disableWorker: false,
                // Additional security options
                isEvalSupported: false,
                maxImageSize: 16777216, // Limit image size
                disableFontFace: false,
                fontExtraProperties: false
              }}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={false} // Disable text layer for security
                renderAnnotationLayer={false} // Disable annotations for security
                canvasBackground="white" // Set consistent background
                loading={<div className="p-4 text-center text-gray-500">Loading page...</div>}
              />
            </Document>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            🔒 This document is protected. Download, printing, and copying are disabled.
          </p>
        </div>
      </div>
    </div>
  );
}