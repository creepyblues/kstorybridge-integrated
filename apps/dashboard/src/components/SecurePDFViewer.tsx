import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Shield, AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent } from '@kstorybridge/ui';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';

// Configure PDF.js worker - use local file for localhost, CDN for production
if (window.location.hostname === 'localhost') {
  // Use local worker file for localhost to avoid CORS issues
  pdfjs.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.js';
  console.log('📄 PDF.js: Using local worker for localhost');
} else {
  // Use CDN for production
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  console.log('📄 PDF.js: Using CDN worker, version:', pdfjs.version);
}

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

  // For localhost auth bypass, consider as authenticated
  const isLocalhost = window.location.hostname === 'localhost';
  const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
  const isDev = import.meta.env.DEV;
  const shouldBypassAuth = isLocalhost && (bypassEnabled || isDev);
  const isAuthenticated = user || shouldBypassAuth;

  // Validate user authentication and session
  const validateAuth = useCallback(async () => {
    console.log('🔐 AUTH: Starting validateAuth...');
    console.log('🔐 AUTH: User exists:', !!user);
    
    const isLocalhost = window.location.hostname === 'localhost';
    const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
    const isDev = import.meta.env.DEV;
    const bypassAuth = isLocalhost && (bypassEnabled || isDev);
    
    console.log('🔐 AUTH: Should bypass auth:', bypassAuth);
    
    try {
      // Check if user exists
      if (!user && !bypassAuth) {
        console.log('❌ AUTH: No user and not bypassing auth');
        setError('Authentication required to view PDF');
        setAuthValidated(false);
        return false;
      }

      if (bypassAuth) {
        console.log('✅ AUTH: Bypassing auth for localhost');
        setAuthValidated(true);
        return true;
      }

      console.log('🔐 AUTH: Getting Supabase session...');
      // Validate session with Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 AUTH: Session response:', { session: !!session, sessionError });
      
      if (sessionError || !session) {
        console.log('❌ AUTH: No session or session error');
        setError('Session expired. Please sign in again.');
        setSessionExpired(true);
        setAuthValidated(false);
        return false;
      }

      console.log('🔐 AUTH: Checking user ID match...');
      // Verify user session matches current user
      if (session.user.id !== user.id) {
        console.log('❌ AUTH: User ID mismatch');
        setError('Authentication mismatch. Please sign in again.');
        setAuthValidated(false);
        return false;
      }

      console.log('🔐 AUTH: Checking session expiry...');
      // Check session expiry
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('❌ AUTH: Session expired');
        setError('Session expired. Please sign in again.');
        setSessionExpired(true);
        setAuthValidated(false);
        return false;
      }

      console.log('✅ AUTH: Authentication validated successfully');
      setAuthValidated(true);
      return true;
    } catch (error) {
      console.error('❌ AUTH: Auth validation error:', error);
      setError('Authentication validation failed');
      setAuthValidated(false);
      return false;
    }
  }, [user]);
  

  // Fetch PDF with enhanced authentication and security
  useEffect(() => {
    const fetchPDF = async () => {
      console.log('🔍 SECURE PDF: Starting fetchPDF process...');
      console.log('🔍 SECURE PDF: pdfUrl:', pdfUrl);
      
      if (!pdfUrl) {
        console.log('❌ SECURE PDF: No PDF URL provided');
        setError('No PDF URL provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 SECURE PDF: Setting loading state...');
        setLoading(true);
        setError(null);
        setSessionExpired(false);

        console.log('🔍 SECURE PDF: Starting authentication validation...');
        
        // Check auth bypass first
        const isLocalhost = window.location.hostname === 'localhost';
        const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
        const isDev = import.meta.env.DEV;
        const bypassAuth = isLocalhost && (bypassEnabled || isDev);
        
        // First validate authentication
        const isAuthValid = await validateAuth();
        console.log('🔍 SECURE PDF: Auth validation result:', isAuthValid);
        if (!isAuthValid) {
          console.log('❌ SECURE PDF: Authentication failed, stopping...');
          setLoading(false);
          return;
        }

        console.log('🔍 SECURE PDF: Starting URL processing...');
        // Enhanced security validation with fallback for storage API issues
        let finalUrl = pdfUrl;
        
        console.log('🔍 SECURE PDF: Checking if URL is Supabase storage...');
        // Extract path from any Supabase storage URL (public or private)
        const pathMatch = pdfUrl.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
        if (pathMatch && pdfUrl.includes('supabase.co/storage')) {
          console.log('🔍 SECURE PDF: URL is Supabase storage, extracting path...');
          const [, bucketName, filePath] = pathMatch;
          console.log('🔍 SECURE PDF: Bucket:', bucketName, 'FilePath:', filePath);
          
          // Enhanced security: validate file path format (must be UUID/pitch.pdf)
          const pathRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/pitch\.pdf$/;
          if (!pathRegex.test(filePath)) {
            console.log('❌ SECURE PDF: Invalid file path format');
            throw new Error('Invalid file path format. Access denied.');
          }
          
          // Extract title ID for additional validation
          const titleId = filePath.split('/')[0];
          console.log('🔍 SECURE PDF: Title ID:', titleId);
          
          // Always validate title exists in database (use real Supabase data)
          console.log('🔍 SECURE PDF: Validating title exists in database...');
          // Verify title exists in database (additional security layer)
          const { data: titleExists, error: titleError } = await supabase
            .from('titles')
            .select('title_id')
            .eq('title_id', titleId)
            .single();
          
          console.log('🔍 SECURE PDF: Database validation result:', { titleExists, titleError });
          if (titleError || !titleExists) {
            console.log('❌ SECURE PDF: Title not found in database');
            throw new Error('Content not found or access denied');
          }
          
          // Try to create signed URL first, fallback to direct URL if storage API issues persist
          if (!bypassAuth) {
            console.log('🔍 SECURE PDF: Attempting to create signed URL...');
            try {
              const { data: signedUrlData, error: urlError } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(filePath, 1800); // 30 minutes expiry

              console.log('🔍 SECURE PDF: Signed URL response:', { signedUrlData, urlError });
              if (urlError) {
                console.warn('Signed URL creation failed, falling back to direct URL:', urlError.message);
                finalUrl = pdfUrl;
                console.log('⚠️ Using direct URL fallback due to storage API issues');
              } else if (signedUrlData?.signedUrl) {
                finalUrl = signedUrlData.signedUrl;
                console.log('✅ Secure access granted with signed URL and validation');
              } else {
                console.warn('No signed URL returned, using direct URL fallback');
                finalUrl = pdfUrl;
              }
            } catch (storageError) {
              console.warn('Storage API exception, using direct URL fallback:', storageError);
              finalUrl = pdfUrl;
              console.log('⚠️ Using direct URL fallback due to storage API exception');
            }
          } else {
            console.log('🔍 SECURE PDF: Using direct URL (localhost bypass)');
          }
        } else if (!pdfUrl.includes('supabase.co/storage')) {
          // Non-Supabase URLs should not be allowed for security
          throw new Error('Only secure storage URLs are allowed');
        }

        console.log('🔍 SECURE PDF: Starting PDF fetch process...');
        console.log('🔍 SECURE PDF: Final URL to fetch:', finalUrl);
        
        // Add authentication headers and fetch PDF data
        if (!bypassAuth) {
          console.log('🔍 SECURE PDF: Fetching with authentication...');
          const { data: { session } } = await supabase.auth.getSession();
          console.log('🔍 SECURE PDF: Session exists:', !!session);
          
          const headers: HeadersInit = {
            'Authorization': `Bearer ${session?.access_token}`,
            'X-User-ID': user.id,
          };

          // For signed URLs, we don't need additional auth headers
          if (finalUrl.includes('token=')) {
            console.log('🔍 SECURE PDF: Signed URL detected, removing auth headers');
            delete headers['Authorization'];
            delete headers['X-User-ID'];
          }

          console.log('🔍 SECURE PDF: Making fetch request...');
          const response = await fetch(finalUrl, { headers });
          console.log('🔍 SECURE PDF: Fetch response status:', response.status, response.statusText);
          
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              throw new Error('Access denied. Please sign in again.');
            }
            throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
          }

          // Verify content type
          const contentType = response.headers.get('content-type');
          console.log('🔍 SECURE PDF: Content type:', contentType);
          if (!contentType?.includes('application/pdf')) {
            throw new Error('Invalid file type. Only PDF files are allowed.');
          }

          console.log('🔍 SECURE PDF: Converting to blob...');
          const blob = await response.blob();
          console.log('🔍 SECURE PDF: Blob size:', blob.size, 'bytes');
          
          // Additional security: verify blob size (prevent extremely large files)
          if (blob.size > 50 * 1024 * 1024) { // 50MB limit
            throw new Error('File too large. Maximum file size is 50MB.');
          }
          
          console.log('🔍 SECURE PDF: Creating object URL...');
          const dataUrl = URL.createObjectURL(blob);
          console.log('🔍 SECURE PDF: Setting PDF data:', dataUrl);
          setPdfData(dataUrl);
        } else {
          console.log('🔍 SECURE PDF: Using direct fetch for localhost bypass');
          // For localhost bypass, still need to fetch the PDF for react-pdf to work
          try {
            console.log('🔍 SECURE PDF: Fetching PDF for localhost...');
            const response = await fetch(finalUrl);
            console.log('🔍 SECURE PDF: Localhost fetch response:', response.status, response.statusText);
            
            if (!response.ok) {
              throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            console.log('🔍 SECURE PDF: Localhost blob size:', blob.size, 'bytes');
            
            const dataUrl = URL.createObjectURL(blob);
            console.log('🔍 SECURE PDF: Localhost object URL created:', dataUrl);
            setPdfData(dataUrl);
          } catch (fetchError) {
            console.log('🔍 SECURE PDF: Localhost fetch failed, trying direct URL...');
            console.error('Localhost fetch error:', fetchError);
            // Fallback to direct URL for localhost
            setPdfData(finalUrl);
          }
        }
        
        console.log('✅ SECURE PDF: PDF fetch completed successfully!');
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF. Please try again.';
        setError(errorMessage);
        
        // If it's an auth error, mark session as expired
        if (errorMessage.includes('Access denied') || errorMessage.includes('sign in again')) {
          setSessionExpired(true);
          setAuthValidated(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();
  }, [pdfUrl, user]);

  // Separate useEffect for cleanup to avoid dependency issues
  useEffect(() => {
    return () => {
      if (pdfData) {
        URL.revokeObjectURL(pdfData);
      }
    };
  }, [pdfData]);

  // Add security event listeners and periodic session validation
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
    console.log('📄 REACT-PDF: Document loaded successfully, pages:', numPages);
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('📄 REACT-PDF: Document load error:', error);
    console.error('📄 REACT-PDF: Error details:', error.message, error.stack);
    
    const errorMessage = 'Failed to load PDF document: ' + error.message;
    setError(errorMessage);
    setLoading(false);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(numPages, prev + 1));
  const zoomIn = () => setScale(prev => Math.min(3, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  // Enhanced authentication UI
  if (!user && !shouldBypassAuth) {
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
                onClick={() => window.location.href = '/auth'}
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
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              {(error.includes('Access denied') || error.includes('sign in again') || sessionExpired) && (
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sign In Again
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

      </div>
    </div>
  );
}