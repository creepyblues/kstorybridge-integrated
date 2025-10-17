import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button, Card, CardContent } from '@kstorybridge/ui';
import { Loader2, CheckCircle, AlertCircle, FlaskConical, DollarSign, Search } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';

interface Title {
  title_id: string;
  title_name_en: string | null;
  title_name_kr: string | null;
  pitch: string | null;
}

interface ExtractionResult {
  extracted_text: string;
  full_text_length: number;
  analysis: {
    summary: string;
    highlights: string[];
    comparable_titles: string[];
    target_audience: string;
    production: {
      budget: string | null;
      timeline: string | null;
      format: string | null;
    };
    selling_points: string[];
  };
  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
  saved_to_db: boolean;
}

export default function PitchExtractionTest() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load titles with pitch decks
  useEffect(() => {
    loadTitlesWithPitch();
  }, []);

  async function loadTitlesWithPitch() {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('title_id, title_name_en, title_name_kr, pitch')
        .not('pitch', 'is', null)
        .order('title_name_en');

      if (error) throw error;

      setTitles(data || []);
      console.log(`📋 Loaded ${data?.length || 0} titles with pitch decks`);
    } catch (err) {
      console.error('Error loading titles:', err);
      setError('Failed to load titles');
    }
  }

  // Extract pitch data
  async function handleExtract(testMode: boolean = false) {
    if (!selectedTitle) return;

    setExtracting(true);
    setError(null);

    try {
      console.log(`🚀 Starting extraction for ${selectedTitle.title_name_en || selectedTitle.title_name_kr}`);
      console.log(`Test mode: ${testMode}`);

      const { data, error: invokeError } = await supabase.functions.invoke('extract-pitch-test', {
        body: {
          title_id: selectedTitle.title_id,
          test_mode: testMode
        }
      });

      if (invokeError) {
        throw new Error(`Edge function error: ${invokeError.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Extraction failed');
      }

      setResult(data.data);
      setTotalCost(prev => prev + data.data.cost);

      console.log('✅ Extraction completed:', data.data);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Extraction error:', errorMsg);
      setError(errorMsg);
    } finally {
      setExtracting(false);
    }
  }

  const displayName = selectedTitle?.title_name_en || selectedTitle?.title_name_kr || 'Unknown Title';

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FlaskConical className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-midnight-ink">Pitch Extraction Test Lab</h1>
          </div>
          <p className="text-gray-600">
            Test pitch deck extraction on a single title before scaling to all titles.
          </p>
        </div>

        {/* Step 1: Select Title */}
        <Card className="mb-8 bg-white border-gray-300 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                1
              </span>
              <h2 className="text-xl font-semibold text-midnight-ink">Select Title</h2>
            </div>

            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => {
                const title = titles.find(t => t.title_id === e.target.value);
                setSelectedTitle(title || null);
                setResult(null);
                setError(null);
              }}
              value={selectedTitle?.title_id || ''}
            >
              <option value="">Choose a title with pitch deck...</option>
              {titles.map(title => (
                <option key={title.title_id} value={title.title_id}>
                  {title.title_name_en || title.title_name_kr}
                </option>
              ))}
            </select>

            {selectedTitle && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-1">Pitch Deck URL:</p>
                <code className="text-xs text-gray-600 break-all block bg-white p-2 rounded border border-gray-200">
                  {selectedTitle.pitch}
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Extract & Preview */}
        <Card className="mb-8 bg-white border-gray-300 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
                2
              </span>
              <h2 className="text-xl font-semibold text-midnight-ink">Extract Data</h2>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              <Button
                onClick={() => handleExtract(true)}
                disabled={!selectedTitle || extracting}
                variant="outline"
                className="border-purple-300 hover:bg-purple-50"
              >
                {extracting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Test Extract (Preview Only)
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleExtract(false)}
                disabled={!selectedTitle || extracting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Extract & Save to Database
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Extraction Failed</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Success Banner */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800 mb-1">
                      ✅ Extraction Complete for "{displayName}"
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-green-700">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Cost: ${result.cost.toFixed(4)}
                      </div>
                      <div>
                        Tokens: {result.tokens_used.input.toLocaleString()} input + {result.tokens_used.output.toLocaleString()} output
                      </div>
                      <div>
                        {result.saved_to_db ? '💾 Saved to Database' : '🧪 Preview Only (Not Saved)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extracted Text Preview */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-midnight-ink mb-2">Extracted Text Preview</h4>
                  <p className="text-xs text-gray-500 mb-2">
                    Showing first 500 characters of {result.full_text_length.toLocaleString()} total
                  </p>
                  <pre className="text-xs overflow-auto bg-white p-3 rounded border border-gray-200 max-h-48">
                    {result.extracted_text}
                  </pre>
                </div>

                {/* AI Analysis Results */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-4">🤖 AI Analysis Results</h4>

                  <div className="space-y-4">
                    {/* Summary */}
                    <div>
                      <h5 className="text-sm font-semibold text-blue-800 mb-1">Executive Summary</h5>
                      <p className="text-sm text-blue-900 bg-white p-3 rounded border border-blue-100">
                        {result.analysis.summary}
                      </p>
                    </div>

                    {/* Highlights */}
                    {result.analysis.highlights.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-blue-800 mb-1">Key Highlights</h5>
                        <ul className="list-disc list-inside space-y-1 bg-white p-3 rounded border border-blue-100">
                          {result.analysis.highlights.map((highlight, idx) => (
                            <li key={idx} className="text-sm text-blue-900">{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Comparable Titles */}
                    {result.analysis.comparable_titles.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-blue-800 mb-1">Comparable Titles (Comps)</h5>
                        <div className="flex flex-wrap gap-2">
                          {result.analysis.comparable_titles.map((comp, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white text-sm text-blue-900 rounded-full border border-blue-200">
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Target Audience */}
                    <div>
                      <h5 className="text-sm font-semibold text-blue-800 mb-1">Target Audience</h5>
                      <p className="text-sm text-blue-900 bg-white p-3 rounded border border-blue-100">
                        {result.analysis.target_audience}
                      </p>
                    </div>

                    {/* Production Details */}
                    {(result.analysis.production.budget || result.analysis.production.timeline || result.analysis.production.format) && (
                      <div>
                        <h5 className="text-sm font-semibold text-blue-800 mb-1">Production Details</h5>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {result.analysis.production.budget && (
                            <div className="bg-white p-2 rounded border border-blue-100">
                              <span className="text-xs text-blue-600">Budget:</span>
                              <p className="text-blue-900 font-medium">{result.analysis.production.budget}</p>
                            </div>
                          )}
                          {result.analysis.production.timeline && (
                            <div className="bg-white p-2 rounded border border-blue-100">
                              <span className="text-xs text-blue-600">Timeline:</span>
                              <p className="text-blue-900 font-medium">{result.analysis.production.timeline}</p>
                            </div>
                          )}
                          {result.analysis.production.format && (
                            <div className="bg-white p-2 rounded border border-blue-100">
                              <span className="text-xs text-blue-600">Format:</span>
                              <p className="text-blue-900 font-medium">{result.analysis.production.format}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selling Points */}
                    {result.analysis.selling_points.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-blue-800 mb-1">Unique Selling Points</h5>
                        <ul className="list-disc list-inside space-y-1 bg-white p-3 rounded border border-blue-100">
                          {result.analysis.selling_points.map((point, idx) => (
                            <li key={idx} className="text-sm text-blue-900">{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw JSON (for debugging) */}
                <details className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                    View Raw JSON (Debug)
                  </summary>
                  <pre className="text-xs overflow-auto bg-white p-3 rounded border border-gray-200 mt-2 max-h-96">
                    {JSON.stringify(result.analysis, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Tracker */}
        <Card className="bg-yellow-50 border-yellow-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-yellow-700" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Total Cost This Session</h3>
                  <p className="text-sm text-yellow-700">OpenAI API usage</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-900">
                ${totalCost.toFixed(4)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Testing Instructions</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li>1. Select a title with a pitch deck from the dropdown</li>
            <li>2. Click "Test Extract (Preview Only)" to see results without saving to database</li>
            <li>3. Review the extracted data and AI analysis for accuracy</li>
            <li>4. If results look good, click "Extract & Save to Database" to persist the data</li>
            <li>5. Monitor the cost tracker to ensure API usage is within budget (~$0.12 per title)</li>
            <li>6. Test with 1-2 titles first, then scale to more if successful</li>
          </ol>
        </div>
      </div>
    </PageContainer>
  );
}
