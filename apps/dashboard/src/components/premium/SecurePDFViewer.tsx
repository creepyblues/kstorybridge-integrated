import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page } from '@/lib/pdfConfig'; // Use centralized config
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  trackUpgradeButtonClick,
  trackPitchDeckOpened,
  trackPitchDeckPageViewed,
  trackPitchDeckPageLimitHit,
  trackPitchDeckUpgradePromptShown,
  trackPitchDeckClosed,
  trackPitchDeckError,
  trackPitchDeckZoom,
  trackPitchDeckFullscreen,
} from '@/utils/analytics';
import { debug } from '@/utils/debug';

// PDF.js worker is now configured in centralized config (/src/lib/pdfConfig.ts)
debug.log('📄 SecurePDFViewer: Using centralized PDF.js worker configuration');

interface SecurePDFViewerProps {
  pdfUrl: string;
  title?: string;
  userTier?: 'basic' | 'invited' | 'pro' | 'suite' | null;
  maxPagesForBasic?: number;
}

export default function SecurePDFViewer({ pdfUrl, title, userTier, maxPagesForBasic = 5 }: SecurePDFViewerProps) {
  const { user } = useAuth();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number | string>("page"); // Use "page" for fit entire page, "width" for fit width
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [authValidated, setAuthValidated] = useState<boolean>(false);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Analytics tracking state
  const sessionStartTimeRef = useRef<number>(Date.now());
  const pageStartTimeRef = useRef<number>(Date.now());
  const maxPageViewedRef = useRef<number>(1);
  const pagesViewedCountRef = useRef<number>(0);
  const hasTrackedOpenRef = useRef<boolean>(false);

  // Extract title ID from URL for tracking
  const getTitleIdFromUrl = useCallback((): string => {
    const pathMatch = pdfUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
    return pathMatch ? pathMatch[1] : 'unknown';
  }, [pdfUrl]);

  // Track session close on unmount
  useEffect(() => {
    return () => {
      if (hasTrackedOpenRef.current && pagesViewedCountRef.current > 0) {
        const totalTimeMs = Date.now() - sessionStartTimeRef.current;
        trackPitchDeckClosed(
          getTitleIdFromUrl(),
          pagesViewedCountRef.current,
          totalTimeMs,
          maxPageViewedRef.current
        );
      }
    };
  }, [getTitleIdFromUrl]);

  // Validate user authentication and session
  const validateAuth = useCallback(async () => {
    debug.log('🔐 AUTH: Starting validateAuth...');
    debug.log('🔐 AUTH: User exists:', !!user);

    try {
      // Check if user exists
      if (!user) {
        debug.log('❌ AUTH: No user authenticated');
        setError('Authentication required to view PDF');
        setAuthValidated(false);
        return false;
      }


      debug.log('🔐 AUTH: Getting Supabase session...');
      // Validate session with Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      debug.log('🔐 AUTH: Session response:', { session: !!session, sessionError });

      if (sessionError || !session) {
        debug.log('❌ AUTH: No session or session error');
        setError('Session expired. Please sign in again.');
        setSessionExpired(true);
        setAuthValidated(false);
        return false;
      }

      debug.log('🔐 AUTH: Checking user ID match...');
      // Verify user session matches current user
      if (session.user.id !== user.id) {
        debug.log('❌ AUTH: User ID mismatch');
        setError('Authentication mismatch. Please sign in again.');
        setAuthValidated(false);
        return false;
      }

      debug.log('🔐 AUTH: Checking session expiry...');
      // Check session expiry
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        debug.log('❌ AUTH: Session expired');
        setError('Session expired. Please sign in again.');
        setSessionExpired(true);
        setAuthValidated(false);
        return false;
      }

      debug.log('✅ AUTH: Authentication validated successfully');
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
      debug.log('🔍 SECURE PDF: Starting fetchPDF process...');
      debug.log('🔍 SECURE PDF: pdfUrl:', pdfUrl);

      if (!pdfUrl) {
        debug.log('❌ SECURE PDF: No PDF URL provided');
        setError('No PDF URL provided');
        setLoading(false);
        return;
      }

      try {
        debug.log('🔍 SECURE PDF: Setting loading state...');
        setLoading(true);
        setError(null);
        setSessionExpired(false);

        debug.log('🔍 SECURE PDF: Starting authentication validation...');


        // First validate authentication
        const isAuthValid = await validateAuth();
        debug.log('🔍 SECURE PDF: Auth validation result:', isAuthValid);
        if (!isAuthValid) {
          debug.log('❌ SECURE PDF: Authentication failed, stopping...');
          setLoading(false);
          return;
        }

        debug.log('🔍 SECURE PDF: Starting URL processing...');
        // Enhanced security validation with fallback for storage API issues
        let finalUrl = pdfUrl;

        debug.log('🔍 SECURE PDF: Checking if URL is Supabase storage...');
        // Extract path from any Supabase storage URL (public or private)
        const pathMatch = pdfUrl.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
        if (pathMatch && pdfUrl.includes('supabase.co/storage')) {
          debug.log('🔍 SECURE PDF: URL is Supabase storage, extracting path...');
          const [, bucketName, filePath] = pathMatch;
          debug.log('🔍 SECURE PDF: Bucket:', bucketName, 'FilePath:', filePath);

          // Enhanced security: validate file path format (must be UUID/pitch.pdf OR sample PDF)
          const pathRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/pitch\.pdf$/;
          const sampleRegex = /Sample\.pdf$/i;

          if (!pathRegex.test(filePath) && !sampleRegex.test(filePath)) {
            debug.log('❌ SECURE PDF: Invalid file path format');
            throw new Error('Invalid file path format. Access denied.');
          }

          // Extract title ID for additional validation (skip for sample PDFs)
          const isSamplePdf = sampleRegex.test(filePath);

          if (!isSamplePdf) {
            const titleId = filePath.split('/')[0];
            debug.log('🔍 SECURE PDF: Title ID:', titleId);

            // Validate title exists AND is buyer-visible (priority H/M).
            // Low-priority titles are treated as unpublished — block PDF access.
            debug.log('🔍 SECURE PDF: Validating title exists in database...');
            const { data: titleExists, error: titleError } = await supabase
              .from('titles')
              .select('title_id')
              .eq('title_id', titleId)
              .in('priority', ['1', '2'])
              .single();

            debug.log('🔍 SECURE PDF: Database validation result:', { titleExists, titleError });
            if (titleError || !titleExists) {
              debug.log('❌ SECURE PDF: Title not found / not published');
              throw new Error('Content not found or access denied');
            }
          } else {
            debug.log('🔍 SECURE PDF: Skipping database validation for sample PDF');
          }

          // Try to create signed URL first, fallback to direct URL if storage API issues persist
          {
            debug.log('🔍 SECURE PDF: Attempting to create signed URL...');
            try {
              const { data: signedUrlData, error: urlError } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(filePath, 1800); // 30 minutes expiry

              debug.log('🔍 SECURE PDF: Signed URL response:', { signedUrlData, urlError });
              if (urlError) {
                debug.warn('Signed URL creation failed, falling back to direct URL:', urlError.message);
                finalUrl = pdfUrl;
                debug.log('⚠️ Using direct URL fallback due to storage API issues');
              } else if (signedUrlData?.signedUrl) {
                finalUrl = signedUrlData.signedUrl;
                debug.log('✅ Secure access granted with signed URL and validation');
              } else {
                debug.warn('No signed URL returned, using direct URL fallback');
                finalUrl = pdfUrl;
              }
            } catch (storageError) {
              debug.warn('Storage API exception, using direct URL fallback:', storageError);
              finalUrl = pdfUrl;
              debug.log('⚠️ Using direct URL fallback due to storage API exception');
            }
          }
        } else if (!pdfUrl.includes('supabase.co/storage')) {
          // Non-Supabase URLs should not be allowed for security
          throw new Error('Only secure storage URLs are allowed');
        }

        debug.log('🔍 SECURE PDF: Starting PDF fetch process...');
        debug.log('🔍 SECURE PDF: Final URL to fetch:', finalUrl);

        // Add authentication headers and fetch PDF data
        {
          debug.log('🔍 SECURE PDF: Fetching with authentication...');
          const { data: { session } } = await supabase.auth.getSession();
          debug.log('🔍 SECURE PDF: Session exists:', !!session);

          const headers: HeadersInit = {
            'Authorization': `Bearer ${session?.access_token}`,
            'X-User-ID': user?.id || '',
          };

          // For signed URLs, we don't need additional auth headers
          if (finalUrl.includes('token=')) {
            debug.log('🔍 SECURE PDF: Signed URL detected, removing auth headers');
            delete headers['Authorization'];
            delete headers['X-User-ID'];
          }

          debug.log('🔍 SECURE PDF: Making fetch request...');
          const response = await fetch(finalUrl, { headers });
          debug.log('🔍 SECURE PDF: Fetch response status:', response.status, response.statusText);

          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              throw new Error('Access denied. Please sign in again.');
            }
            throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
          }

          // Verify content type
          const contentType = response.headers.get('content-type');
          debug.log('🔍 SECURE PDF: Content type:', contentType);
          if (!contentType?.includes('application/pdf')) {
            throw new Error('Invalid file type. Only PDF files are allowed.');
          }

          debug.log('🔍 SECURE PDF: Starting streaming download with progress tracking...');

          // Get total file size for progress calculation
          const contentLength = response.headers.get('content-length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;
          debug.log('🔍 SECURE PDF: Total file size:', total, 'bytes');

          // Read response body as stream
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Response body stream not available');
          }

          const chunks: Uint8Array[] = [];
          let receivedLength = 0;

          // Read chunks and track progress
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            // Update progress (network download progress)
            if (total > 0) {
              const progress = Math.round((receivedLength / total) * 100);
              debug.log(`🔍 SECURE PDF: Download progress: ${progress}% (${receivedLength}/${total} bytes)`);
              setLoadingProgress(progress);
            } else {
              // If content-length is not available, show indeterminate progress
              debug.log(`🔍 SECURE PDF: Downloaded ${receivedLength} bytes (size unknown)`);
            }
          }

          // Create blob from chunks
          const blob = new Blob(chunks as BlobPart[], { type: 'application/pdf' });
          debug.log('🔍 SECURE PDF: Blob created, size:', blob.size, 'bytes');

          // Additional security: verify blob size (prevent extremely large files)
          if (blob.size > 50 * 1024 * 1024) { // 50MB limit
            throw new Error('File too large. Maximum file size is 50MB.');
          }

          // Verify blob type
          if (!blob.type.includes('pdf')) {
            debug.warn('🔍 SECURE PDF: Blob type is not PDF:', blob.type);
          }

          debug.log('🔍 SECURE PDF: Creating object URL...');
          const dataUrl = URL.createObjectURL(blob);
          debug.log('🔍 SECURE PDF: Setting PDF data:', dataUrl);
          setPdfData(dataUrl);
        }

        debug.log('✅ SECURE PDF: PDF fetch completed successfully!');
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

  // Cleanup blob URL on unmount only
  useEffect(() => {
    return () => {
      // Only revoke on component unmount, not on pdfData changes
      if (pdfData && pdfData.startsWith('blob:')) {
        URL.revokeObjectURL(pdfData);
      }
    };
  }, []);

  // Add security event listeners and periodic session validation
  useEffect(() => {
    if (!authValidated || !pdfData) return;

    const validateSession = async () => {
      const isValid = await validateAuth();
      if (!isValid) {
        // Clear PDF data if session becomes invalid
        if (pdfData && pdfData.startsWith('blob:')) {
          URL.revokeObjectURL(pdfData);
        }
        setPdfData(null);
      }
    };

    // Check session every 5 minutes while viewing
    const interval = setInterval(validateSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authValidated, pdfData, validateAuth]);

  // Track container dimensions for responsive scaling
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

    // Use timeout to ensure container is rendered
    const timer = setTimeout(updateDimensions, 100);

    // Create resize observer
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateDimensions, 50); // Small delay to ensure accurate measurements
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen to window resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [pdfData]); // Re-run when PDF data changes


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
      debug.warn('Printing is disabled for this secure document');
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

  // Track fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    debug.log('📄 REACT-PDF: Document loaded successfully, pages:', numPages);
    setNumPages(numPages);
    setLoading(false);

    // Track pitch deck opened (only once per session)
    if (!hasTrackedOpenRef.current) {
      hasTrackedOpenRef.current = true;
      sessionStartTimeRef.current = Date.now();
      pageStartTimeRef.current = Date.now();
      pagesViewedCountRef.current = 1;
      maxPageViewedRef.current = 1;

      trackPitchDeckOpened(
        getTitleIdFromUrl(),
        title || 'Unknown Title',
        userTier || 'basic',
        numPages
      );
    }
  };


  const onDocumentLoadError = (error: Error) => {
    console.error('📄 REACT-PDF: Document load error:', error);
    console.error('📄 REACT-PDF: Error details:', error.message, error.stack);

    const errorMessage = 'Failed to load PDF document: ' + error.message;
    setError(errorMessage);
    setLoading(false);

    // Track pitch deck error
    trackPitchDeckError(
      getTitleIdFromUrl(),
      error.message,
      userTier || 'basic'
    );
  };

  const goToPrevPage = () => {
    // Track time on current page before navigating
    const timeOnCurrentPage = Date.now() - pageStartTimeRef.current;
    trackPitchDeckPageViewed(getTitleIdFromUrl(), pageNumber, timeOnCurrentPage);

    setPageNumber(prev => {
      const newPage = Math.max(1, prev - 1);
      pageStartTimeRef.current = Date.now();
      pagesViewedCountRef.current += 1;
      return newPage;
    });
  };

  const goToNextPage = () => {
    const nextPage = pageNumber + 1;

    // Track time on current page before navigating
    const timeOnCurrentPage = Date.now() - pageStartTimeRef.current;
    trackPitchDeckPageViewed(getTitleIdFromUrl(), pageNumber, timeOnCurrentPage);

    // If no tier provided, allow full access (creator/admin use case)
    if (!userTier) {
      setPageNumber(Math.min(numPages, nextPage));
      pageStartTimeRef.current = Date.now();
      pagesViewedCountRef.current += 1;
      maxPageViewedRef.current = Math.max(maxPageViewedRef.current, Math.min(numPages, nextPage));
      return;
    }

    // Check tier restrictions
    const isPremiumUser = userTier === 'pro' || userTier === 'suite';
    const maxAllowedPage = isPremiumUser ? numPages : maxPagesForBasic;

    if (nextPage > maxAllowedPage) {
      // Track page limit hit
      trackPitchDeckPageLimitHit(
        getTitleIdFromUrl(),
        userTier,
        pagesViewedCountRef.current
      );

      // Track upgrade prompt shown
      const timeViewingMs = Date.now() - sessionStartTimeRef.current;
      trackPitchDeckUpgradePromptShown(
        getTitleIdFromUrl(),
        pagesViewedCountRef.current,
        timeViewingMs
      );

      setShowUpgradePopup(true);
      trackUpgradeButtonClick('pitch_deck_viewer', userTier, 'page_limit_reached');
      return;
    }

    setPageNumber(nextPage);
    pageStartTimeRef.current = Date.now();
    pagesViewedCountRef.current += 1;
    maxPageViewedRef.current = Math.max(maxPageViewedRef.current, nextPage);
  };
  const zoomIn = () => setScale(prev => {
    const currentScale = typeof prev === 'number' ? prev : 1;
    const newScale = Math.min(3, currentScale + 0.2);
    trackPitchDeckZoom(getTitleIdFromUrl(), Math.round(newScale * 100));
    return newScale;
  });
  const zoomOut = () => setScale(prev => {
    const currentScale = typeof prev === 'number' ? prev : 1;
    const newScale = Math.max(0.3, currentScale - 0.2);
    trackPitchDeckZoom(getTitleIdFromUrl(), Math.round(newScale * 100));
    return newScale;
  });
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        trackPitchDeckFullscreen(getTitleIdFromUrl(), 'enter');
      } else {
        await document.exitFullscreen();
        trackPitchDeckFullscreen(getTitleIdFromUrl(), 'exit');
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Removed unused fitToPage function
  const fitToWidth = () => {
    // Fit page width to container
    setScale("width");
  };

  // Enhanced authentication UI
  if (!user) {
    return (
      <Card className="bg-white border-gray-300 shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Icon icon="solar:shield-warning-bold-duotone" className="h-16 w-16 text-red-500" />
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
      <Card className="bg-white border-gray-300 shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            {/* Linear Progress Bar */}
            <div className="w-full max-w-xs">
              {/* Progress bar container */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                {/* Progress bar fill */}
                <div
                  className="bg-[#4C9C9B] h-full rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              {/* Percentage text below bar */}
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
      <Card className="bg-white border-gray-300 shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Icon icon="solar:danger-triangle-bold-duotone" className="h-16 w-16 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              {(error.includes('Access denied') || error.includes('sign in again') || sessionExpired) && (
                <Button
                  onClick={() => window.location.href = '/signin'}
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
    <div className="bg-white rounded-lg h-full flex flex-col">
      <div className="p-6 flex-shrink-0">
        {title && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-black mb-2">{title}</h2>
            <div className="h-1 w-16 bg-[#4C9C9B] rounded-full"></div>
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
              <Icon icon="solar:alt-arrow-left-bold-duotone" className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">
              Page {pageNumber} of {numPages}
              {userTier === 'basic' && numPages > maxPagesForBasic && ' (Limited)'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <Icon icon="solar:alt-arrow-right-bold-duotone" className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <Icon icon="solar:magnifer-zoom-out-bold-duotone" className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">
              {typeof scale === 'number' ? `${Math.round(scale * 100)}%` : scale === 'page' ? 'Fit' : 'Width'}
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <Icon icon="solar:magnifer-zoom-in-bold-duotone" className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </Button>
            <Button variant="outline" size="sm" onClick={fitToWidth} title="Fit to Width">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div
          ref={containerRef}
          className="secure-pdf-viewer border border-gray-300 rounded-lg overflow-hidden relative flex justify-center items-center flex-1"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            position: 'relative',
            backgroundColor: '#f5f5f5'
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

          {/* Overlay Navigation Buttons */}
          {pdfData && (
            <>
              {/* Previous Page Button - Left Middle */}
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-200 flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none hover:scale-110"
                aria-label="Previous page"
              >
                <Icon icon="solar:alt-arrow-left-bold-duotone" className="h-6 w-6" />
              </button>

              {/* Next Page Button - Right Middle */}
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-200 flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none hover:scale-110"
                aria-label="Next page"
              >
                <Icon icon="solar:alt-arrow-right-bold-duotone" className="h-6 w-6" />
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
                    <div className="flex flex-col items-center gap-4">
                      {/* Linear Progress Bar */}
                      <div className="w-full max-w-xs">
                        {/* Progress bar container */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          {/* Progress bar fill */}
                          <div
                            className="bg-[#4C9C9B] h-full rounded-full transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                          />
                        </div>
                        {/* Percentage text below bar */}
                        <p className="text-sm text-gray-600 mt-2">{loadingProgress}%</p>
                      </div>
                      <span className="text-gray-600">Rendering PDF...</span>
                    </div>
                  </div>
                }
              >
                <Page
                  key={`${pageNumber}-${containerDimensions.width}-${containerDimensions.height}`} // Re-render on dimension changes
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
                  renderTextLayer={false} // Disable text layer for security
                  renderAnnotationLayer={false} // Disable annotations for security
                />
              </Document>
            </div>
          )}
        </div>

      </div>

      {/* Upgrade Popup Modal */}
      {showUpgradePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowUpgradePopup(false)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <button
              onClick={() => setShowUpgradePopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold-duotone" className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Icon icon="solar:crown-bold-duotone" className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">This is a premium feature</h2>
              <p className="text-gray-600 mb-6">
                Upgrade to Pro to view the complete pitch deck
              </p>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  trackUpgradeButtonClick('pitch_deck_viewer', userTier || 'basic', 'upgrade_button_clicked');
                  window.location.href = '/buyers/plan';
                }}
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
