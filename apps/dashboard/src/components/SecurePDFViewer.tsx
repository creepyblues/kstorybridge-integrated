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

  // Simple PDF verification and loading
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
        if (!user) {
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
        console.log('🔍 Testing PDF access:', pdfUrl);
        const response = await fetch(pdfUrl, { method: 'HEAD' });
        
        if (!response.ok) {
          throw new Error(`PDF not accessible: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/pdf')) {
          throw new Error('Invalid file type - not a PDF');
        }

        console.log('✅ PDF verified and accessible');
        setPdfVerified(true);
        setLoading(false);

      } catch (err) {
        console.error('PDF verification failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF';
        setError(errorMessage);
        setLoading(false);
      }
    };

    verifyAndLoadPDF();
  }, [pdfUrl, user]);

  // Authentication check
  if (!user) {
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
    <div className="bg-white rounded-lg">
      <div className="p-6">
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
          
          {pdfVerified ? (
            <iframe
              src={pdfUrl}
              width="100%"
              height="600"
              style={{ border: 'none' }}
              title="PDF Document"
              onLoad={() => {
                console.log('✅ PDF loaded successfully via iframe');
              }}
              onError={() => {
                console.error('❌ Iframe failed to load PDF');
                setError('Failed to display PDF document');
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}