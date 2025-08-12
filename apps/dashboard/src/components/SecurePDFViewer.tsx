import { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent } from '@kstorybridge/ui';
import { useAuth } from '../hooks/useAuth';

interface SecurePDFViewerProps {
  pdfUrl: string;
  title?: string;
}

export default function SecurePDFViewer({ pdfUrl, title }: SecurePDFViewerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfVerified, setPdfVerified] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Check if we should bypass auth for localhost development
  const shouldBypassAuth = () => {
    const isLocalhost = window.location.hostname === 'localhost';
    const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
    const isDev = import.meta.env.DEV;
    return isLocalhost && (bypassEnabled || isDev);
  };
  
  // For localhost auth bypass, consider as authenticated
  const isAuthenticated = user || shouldBypassAuth();
  

  // Simple PDF verification and loading with viewer fallback logic
  useEffect(() => {
    const verifyAndLoadPDF = async () => {
      if (!pdfUrl) {
        setError('No PDF URL provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Basic authentication check
        if (!isAuthenticated) {
          setError('Please sign in to view this PDF');
          setLoading(false);
          return;
        }

        // Validate PDF URL format
        const pathMatch = pdfUrl.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
        if (!pathMatch || !pdfUrl.includes('supabase.co/storage')) {
          throw new Error('Invalid PDF URL format');
        }

        const [, bucketName, filePath] = pathMatch;
        
        // Validate file path (should be UUID/pitch.pdf)
        const pathRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/pitch\.pdf$/;
        if (!pathRegex.test(filePath)) {
          throw new Error('Access denied - invalid file path');
        }

        // Test direct access to PDF
        const response = await fetch(pdfUrl, { method: 'HEAD' });
        
        if (!response.ok) {
          throw new Error(`PDF not accessible: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/pdf')) {
          throw new Error('Invalid file type - not a PDF');
        }

        setPdfVerified(true);
        setLoading(false);

        // Add viewer fallback logic after verification
        setTimeout(() => {
          setupViewerFallbacks();
        }, 2000);

      } catch (err) {
        console.error('PDF verification failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF';
        setError(errorMessage);
        setLoading(false);
      }
    };

    const setupViewerFallbacks = () => {
      // If Google Drive viewer fails, try direct iframe
      const googleViewer = document.querySelector('iframe[src*="drive.google.com"]');
      if (googleViewer) {
        googleViewer.addEventListener('error', () => {
          console.log('Google Drive viewer failed, switching to direct iframe');
          const directViewer = document.getElementById('direct-iframe-viewer');
          const googleContainer = googleViewer.parentElement;
          if (directViewer && googleContainer) {
            googleContainer.style.display = 'none';
            directViewer.classList.remove('hidden');
          }
        });
      }
    };

    verifyAndLoadPDF();
  }, [pdfUrl, user, isAuthenticated]);

  // Authentication check
  if (!isAuthenticated) {
    return (
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-16 w-16 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 mb-4">
                Please sign in to view this secure pitch document.
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
              
              {(error.includes('Access denied') || error.includes('sign in again')) && (
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
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm">
      {/* PDF Viewer */}
      <div 
        ref={containerRef}
        className="secure-pdf-viewer rounded-xl overflow-hidden relative"
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
              rgba(0, 0, 0, 0.02) 100px,
              rgba(0, 0, 0, 0.02) 120px
            )`,
            mixBlendMode: 'multiply'
          }}
        >
          <div 
            className="absolute inset-0 flex items-center justify-center text-gray-200 text-6xl font-bold opacity-5 select-none"
            style={{
              transform: 'rotate(-45deg)',
              fontSize: '6rem',
              lineHeight: '1',
              whiteSpace: 'nowrap'
            }}
          >
            CONFIDENTIAL
          </div>
        </div>
        
        {pdfVerified ? (
          <>
            {/* PDF Viewer Header */}
            <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-hanok-teal rounded-full"></div>
                  Secure Document Viewer
                </h3>
                <p className="text-sm text-gray-600">
                  This document is protected and can only be viewed on this platform.
                </p>
              </div>
            </div>
            
            {/* Secure PDF Viewer */}
            <div 
              className="bg-white relative"
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onSelectStart={(e) => e.preventDefault()}
            >
              {/* Multiple PDF viewing attempts */}
              
              {/* Method 1: Google Drive PDF Viewer */}
              <iframe
                src={`https://drive.google.com/viewerng/viewer?embedded=true&chrome=false&nonce=${Date.now()}&url=${encodeURIComponent(pdfUrl)}`}
                width="100%"
                height="700"
                style={{ 
                  border: 'none',
                  userSelect: 'none',
                  pointerEvents: 'auto'
                }}
                title="PDF Document Viewer"
                className="w-full bg-white select-none"
                onContextMenu={(e) => e.preventDefault()}
                onError={() => {
                  console.log('Google Drive viewer failed, trying alternative...');
                }}
                onLoad={() => {
                  // Hide the pop-out button after iframe loads
                  setTimeout(() => {
                    const iframe = document.querySelector('iframe[src*="drive.google.com"]');
                    if (iframe && iframe.contentDocument) {
                      try {
                        const style = iframe.contentDocument.createElement('style');
                        style.textContent = `
                          .ndfHFb-c4YZDc-Bz112c-LgbsSe { display: none !important; }
                          [data-tooltip="Pop out"] { display: none !important; }
                          [aria-label="Pop out"] { display: none !important; }
                          .pop-out-button { display: none !important; }
                        `;
                        iframe.contentDocument.head.appendChild(style);
                      } catch (e) {
                        console.log('Could not access iframe content for styling');
                      }
                    }
                  }, 1000);
                }}
              />
              
              {/* Method 2: Direct iframe fallback (hidden by default) */}
              <div className="hidden" id="direct-iframe-viewer">
                <iframe
                  src={pdfUrl}
                  width="100%"
                  height="700"
                  style={{ 
                    border: 'none',
                    userSelect: 'none'
                  }}
                  title="PDF Document - Direct Viewer"
                  className="w-full bg-white select-none"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
              
              {/* Method 3: Object embed fallback (hidden by default) */}
              <div className="hidden" id="object-embed-viewer">
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  width="100%"
                  height="700"
                  className="w-full bg-white select-none"
                  style={{
                    userSelect: 'none'
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="p-12 text-center bg-gradient-to-br from-gray-50 to-white">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Document Protected
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        This document is secured and can only be viewed within our platform. 
                        PDF viewing is currently being processed.
                      </p>
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Security Notice:</strong> This document is protected against downloading and printing to maintain confidentiality.
                        </p>
                      </div>
                    </div>
                  </div>
                </object>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}