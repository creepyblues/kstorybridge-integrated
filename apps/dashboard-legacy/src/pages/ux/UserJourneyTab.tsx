import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { StandardButton } from '@/components/StandardButton';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { userJourneys, type JourneyDefinition } from '@/data/userJourneys';
import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, sans-serif',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  themeVariables: {
    primaryColor: '#ffffff',
    primaryTextColor: '#000000',
    primaryBorderColor: '#374151',
    lineColor: '#6B7280',
    secondaryColor: '#f3f4f6',
    tertiaryColor: '#ffffff'
  },
  // Mermaid 11.x compatibility settings
  deterministicIds: true,
  deterministicIDSeed: 'ux-dashboard'
});

interface JourneyDiagramProps {
  journey: JourneyDefinition;
}

const JourneyDiagram: React.FC<JourneyDiagramProps> = ({ journey }) => {
  const [svg, setSvg] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate mermaid code before rendering
        if (!journey.mermaidCode || journey.mermaidCode.trim() === '') {
          throw new Error('Empty Mermaid diagram code');
        }

        console.log(`🎨 Rendering ${journey.title} diagram...`);
        const { svg } = await mermaid.render(`mermaid-${journey.id}`, journey.mermaidCode);
        setSvg(svg);
        console.log(`✅ Successfully rendered ${journey.title} diagram`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown rendering error';
        console.error(`❌ Mermaid rendering error for ${journey.title}:`, error);

        // Provide user-friendly error messages
        if (errorMessage.includes('Syntax error')) {
          setError('Diagram syntax error. Please check the Mermaid code format.');
        } else if (errorMessage.includes('Parse error')) {
          setError('Unable to parse diagram. The diagram code may contain invalid characters.');
        } else {
          setError(`Rendering failed: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [journey]);

  const handleDownloadSVG = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${journey.id}-journey.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRetry = () => {
    setError(null);
    setSvg('');
    setIsLoading(true);
    // Re-trigger the useEffect
    const renderDiagram = async () => {
      try {
        console.log(`🔄 Retrying ${journey.title} diagram...`);
        const { svg } = await mermaid.render(`mermaid-retry-${journey.id}`, journey.mermaidCode);
        setSvg(svg);
        console.log(`✅ Retry successful for ${journey.title} diagram`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown rendering error';
        console.error(`❌ Retry failed for ${journey.title}:`, error);

        if (errorMessage.includes('Syntax error')) {
          setError('Diagram syntax error. Please check the Mermaid code format.');
        } else if (errorMessage.includes('Parse error')) {
          setError('Unable to parse diagram. The diagram code may contain invalid characters.');
        } else {
          setError(`Rendering failed: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
      }
    };
    renderDiagram();
  };

  const handleDownloadPNG = async () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `${journey.id}-journey.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
        }
      });

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <Card className="bg-transparent border-gray-300 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{journey.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{journey.description}</p>
          </div>
          <div className="flex gap-2">
            <StandardButton
              variant="outline"
              size="sm"
              onClick={handleDownloadSVG}
              disabled={!svg || isLoading || !!error}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              SVG
            </StandardButton>
            <StandardButton
              variant="outline"
              size="sm"
              onClick={handleDownloadPNG}
              disabled={!svg || isLoading || !!error}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              PNG
            </StandardButton>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Rendering diagram...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 mb-4 text-center">
              <p className="font-medium">❌ Diagram Rendering Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <StandardButton
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              🔄 Retry
            </StandardButton>
            <details className="mt-4 w-full">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                Show Mermaid Code (for debugging)
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                {journey.mermaidCode}
              </pre>
            </details>
          </div>
        ) : svg ? (
          <div
            ref={containerRef}
            className="overflow-auto bg-white rounded-lg p-4 border border-gray-200"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            No diagram available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const UserJourneyTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📍 User Journey Maps</h3>
        <p className="text-blue-800 text-sm">
          These flowcharts visualize the complete user experience from signup to dashboard navigation.
          Click download to save diagrams as SVG or PNG for presentations and documentation.
        </p>
      </div>

      {userJourneys.map((journey) => (
        <JourneyDiagram key={journey.id} journey={journey} />
      ))}
    </div>
  );
};