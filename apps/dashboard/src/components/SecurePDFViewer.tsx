import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Shield, AlertTriangle } from 'lucide-react';
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
  const [authValidated, setAuthValidated] = useState<boolean>(false);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Validate user authentication and session
  const validateAuth = useCallback(async () => {
    try {
      // Check if user exists
      if (!user) {
        setError('Authentication required to view PDF');
        setAuthValidated(false);
        return false;
      }

      // Validate session with Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Session expired. Please sign in again.');
        setSessionExpired(true);
        setAuthValidated(false);
        return false;
      }

      // Verify user session matches current user
      if (session.user.id !== user.id) {
        setError('Authentication mismatch. Please sign in again.');
        setAuthValidated(false);
        return false;
      }

      // Check session expiry
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        setError('Session expired. Please sign in again.');
        setSessionExpired(true);
        setAuthValidated(false);
        return false;
      }

      setAuthValidated(true);
      return true;
    } catch (error) {
      console.error('Auth validation error:', error);
      setError('Authentication validation failed');
      setAuthValidated(false);
      return false;
    }
  }, [user]);

  // Fetch PDF with enhanced authentication
  useEffect(() => {
    const fetchPDF = async () => {
      if (!pdfUrl) {
        setError('No PDF URL provided');
        setLoading(false);
        return;
      }

      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setError('PDF loading timed out. Please try again or contact support.');
        setLoading(false);
      }, 30000); // 30 second timeout

      try {
        setLoading(true);
        setError(null);
        setSessionExpired(false);

        // First validate authentication
        const isAuthValid = await validateAuth();
        if (!isAuthValid) {
          setLoading(false);
          return;
        }

        // Enhanced security validation with fallback for storage API issues
        let finalUrl = pdfUrl;
        
        // Extract path from any Supabase storage URL (public or private)
        const pathMatch = pdfUrl.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
        if (pathMatch && pdfUrl.includes('supabase.co/storage')) {
          const [, bucketName, filePath] = pathMatch;
          
          // Enhanced security: validate file path format (must be UUID/pitch.pdf)
          const pathRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/pitch\.pdf$/;
          if (!pathRegex.test(filePath)) {
            throw new Error('Invalid file path format. Access denied.');
          }
          
          // Extract title ID for additional validation
          const titleId = filePath.split('/')[0];
          
          // Verify title exists in database (additional security layer)
          const { data: titleExists, error: titleError } = await supabase
            .from('titles')
            .select('title_id')
            .eq('title_id', titleId)
            .single();
          
          if (titleError || !titleExists) {
            throw new Error('Content not found or access denied');
          }
          
          // Try to create signed URL, but handle storage API issues gracefully
          try {
            const { data: signedUrlData, error: urlError } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(filePath, 1800); // 30 minutes expiry

            if (urlError) {
              console.warn('Signed URL creation failed:', urlError.message);
              throw new Error('Storage API unavailable. Please try again later or contact support.');
            } else if (signedUrlData?.signedUrl) {
              finalUrl = signedUrlData.signedUrl;
              console.log('✅ Secure access granted with signed URL and validation');
            } else {
              throw new Error('Failed to generate secure access URL');
            }
          } catch (storageError) {
            console.error('Storage API error:', storageError);
            // For now, show a proper error message instead of failing silently
            throw new Error('PDF access is temporarily unavailable due to storage configuration issues. Please contact support.');
          }
        } else if (!pdfUrl.includes('supabase.co/storage')) {
          // Non-Supabase URLs should not be allowed for security
          throw new Error('Only secure storage URLs are allowed');
        }

        // Add authentication headers and fetch PDF data
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {
          'Authorization': `Bearer ${session?.access_token}`,
          'X-User-ID': user.id,
        };

        // For signed URLs, we don't need additional auth headers
        if (finalUrl.includes('token=')) {
          delete headers['Authorization'];
          delete headers['X-User-ID'];
        }

        const response = await fetch(finalUrl, { headers });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Access denied. Please sign in again.');
          }
          if (response.status >= 500) {
            throw new Error('PDF access is temporarily unavailable due to server issues. Please try again later.');
          }
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
        }

        // Verify content type
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/pdf')) {
          throw new Error('Invalid file type. Only PDF files are allowed.');
        }

        const blob = await response.blob();
        
        // Additional security: verify blob size (prevent extremely large files)
        if (blob.size > 50 * 1024 * 1024) { // 50MB limit
          throw new Error('File too large. Maximum file size is 50MB.');
        }
        
        const dataUrl = URL.createObjectURL(blob);
        setPdfData(dataUrl);
        
        // Clear timeout on success
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Error loading PDF:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF. Please try again.';
        setError(errorMessage);
        
        // If it's an auth error, mark session as expired
        if (errorMessage.includes('Access denied') || errorMessage.includes('sign in again')) {
          setSessionExpired(true);
          setAuthValidated(false);
        }
        
        // Clear timeout on error
        clearTimeout(timeoutId);
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
  }, [pdfUrl, user, pdfData, validateAuth]);

  // Periodic session validation while PDF is being viewed
  useEffect(() => {
    if (!authValidated || !pdfData) return;

    const validateSession = async () => {
      const isValid = await validateAuth();
      if (!isValid) {
        // Clear PDF data if session becomes invalid
        if (pdfData) {
          URL.revokeObjectURL(pdfData);
          setPdfData(null);
        }
      }
    };

    // Check session every 5 minutes while viewing
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [authValidated, pdfData, validateAuth]);

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
    if (error.message.includes('Invalid PDF structure') || error.message.includes('PDF is corrupted')) {
      setError('The PDF file appears to be corrupted or invalid. Please contact support.');
    } else if (error.message.includes('Network')) {
      setError('Network error while loading PDF. Please check your connection and try again.');
    } else {
      setError('Failed to load PDF document. This may be due to storage service issues.');
    }
    setLoading(false);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(numPages, prev + 1));
  const zoomIn = () => setScale(prev => Math.min(3, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  // Enhanced authentication UI
  if (!user || !authValidated) {
    return (
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Shield className="h-16 w-16 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {sessionExpired ? 'Session Expired' : 'Authentication Required'}
              </h3>
              <p className="text-gray-600 mb-4">
                {sessionExpired 
                  ? 'Your session has expired. Please sign in again to view this secure document.'
                  : 'Please sign in to view this secure pitch document.'
                }
              </p>
              <Button 
                onClick={() => window.location.href = '/signin'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sign In to Continue
              </Button>
            </div>
          </div>
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
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-16 w-16 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {error.includes('Storage API') || error.includes('storage configuration') 
                  ? 'Service Temporarily Unavailable' 
                  : 'Access Error'
                }
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              
              {error.includes('storage configuration') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> PDF access is temporarily unavailable due to storage service issues. 
                    This is a known technical issue and does not affect security. 
                    Your documents remain fully protected.
                  </p>
                </div>
              )}
              
              {(error.includes('Access denied') || error.includes('sign in again') || sessionExpired) && (
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sign In Again
                </Button>
              )}
              
              {error.includes('storage configuration') && (
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="ml-2"
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="p-6">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Shield className="h-4 w-4" />
              <span>Secure Session Active</span>
            </div>
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

        {/* Enhanced Security Notice */}
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800 mb-1">
                Secure Authenticated Access
              </p>
              <p className="text-xs text-green-700">
                🔒 This document is protected with multiple security layers:<br/>
                • User authentication required • Session validation active<br/>
                • Download, printing, and copying disabled • Signed URL with expiry<br/>
                • Periodic security checks • Content watermarked
              </p>
              <p className="text-xs text-green-600 mt-2">
                Authenticated as: <strong>{user.email}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}