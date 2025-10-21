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
  pdf_size?: number; // File size in bytes
  has_analysis?: boolean; // Indicates if pitch_analysis exists in database
}

interface ExtractionResult {
  extracted_text: string;
  full_text_length: number;
  analysis: any; // Flexible type to accept both old and new structures
  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
  saved_to_db: boolean;
  processing_confidence?: number;
}

export default function PitchExtractionTest() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Validate if pitch_analysis JSON contains meaningful data (not just structure)
  function hasValidAnalysis(pitchAnalysis: any): boolean {
    if (!pitchAnalysis || typeof pitchAnalysis !== 'object') {
      return false;
    }

    // Check key sections for non-empty, meaningful data
    const hasCharacters = Array.isArray(pitchAnalysis.characters) &&
                          pitchAnalysis.characters.length > 0;

    const hasStoryElements = (pitchAnalysis.story_elements?.logline &&
                              pitchAnalysis.story_elements.logline !== null) ||
                             (pitchAnalysis.story_elements?.plot_summary &&
                              pitchAnalysis.story_elements.plot_summary !== null);

    const hasThemes = Array.isArray(pitchAnalysis.themes_and_tone?.primary_themes) &&
                      pitchAnalysis.themes_and_tone.primary_themes.length > 0;

    const hasMarketPositioning = Array.isArray(pitchAnalysis.market_positioning?.comparable_titles) &&
                                 pitchAnalysis.market_positioning.comparable_titles.length > 0;

    const hasSellingPoints = Array.isArray(pitchAnalysis.ip_value?.unique_selling_points) &&
                             pitchAnalysis.ip_value.unique_selling_points.length > 0;

    // Title is considered "analyzed" if it has at least 2 of these sections with real data
    const validSections = [
      hasCharacters,
      hasStoryElements,
      hasThemes,
      hasMarketPositioning,
      hasSellingPoints
    ].filter(Boolean).length;

    return validSections >= 2;
  }

  // Load titles with pitch decks
  useEffect(() => {
    loadTitlesWithPitch();
  }, []);

  async function loadTitlesWithPitch() {
    try {
      // Step 1: Load titles with pitch URLs
      const { data, error } = await supabase
        .from('titles')
        .select('title_id, title_name_en, title_name_kr, pitch')
        .not('pitch', 'is', null)
        .order('title_name_en');

      if (error) throw error;

      // Step 2: Check which titles have analysis data
      const { data: analysisData, error: analysisError } = await supabase
        .from('title_content_analysis')
        .select('title_id, pitch_analysis')
        .in('title_id', (data || []).map(t => t.title_id));

      if (analysisError) {
        console.warn('⚠️ Failed to load analysis data:', analysisError);
      }

      // Create a map of title_id -> has_analysis with content validation
      const analysisMap = new Map(
        (analysisData || []).map(a => [
          a.title_id,
          hasValidAnalysis(a.pitch_analysis)
        ])
      );

      const validCount = Array.from(analysisMap.values()).filter(Boolean).length;
      console.log(`📊 Analysis status: ${validCount} titles with valid data out of ${analysisMap.size} checked`);

      // Step 3: Fetch file sizes and add analysis status
      const titlesWithData = await Promise.all(
        (data || []).map(async (title) => {
          try {
            const { data: fileList, error: fileError } = await supabase.storage
              .from('pitch-pdfs')
              .list(title.title_id, {
                search: 'pitch.pdf'
              });

            return {
              ...title,
              pdf_size: fileList && fileList.length > 0 ? fileList[0].metadata?.size || 0 : 0,
              has_analysis: analysisMap.get(title.title_id) || false
            };
          } catch (err) {
            console.warn(`⚠️ Failed to get data for ${title.title_id}:`, err);
            return {
              ...title,
              has_analysis: analysisMap.get(title.title_id) || false
            };
          }
        })
      );

      setTitles(titlesWithData);
      const analyzedCount = titlesWithData.filter(t => t.has_analysis).length;
      console.log(`📋 Loaded ${titlesWithData.length} titles with pitch decks (${analyzedCount} analyzed)`);
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

  // Format file size in human-readable format
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

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
          {titles.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              <span className="font-medium text-green-600">
                {titles.filter(t => t.has_analysis).length} analyzed
              </span>
              {' / '}
              <span className="font-medium text-gray-700">
                {titles.length} total
              </span>
              {' titles with pitch decks'}
            </p>
          )}
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
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
                  {title.has_analysis ? '✓ ' : '✗ '}
                  {title.title_name_en || title.title_name_kr}
                  {title.pdf_size ? ` (${formatFileSize(title.pdf_size)})` : ''}
                </option>
              ))}
            </select>

            {selectedTitle && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Pitch Deck URL:</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    selectedTitle.has_analysis
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedTitle.has_analysis ? '✓ Analysis Exists' : '✗ No Analysis'}
                  </span>
                </div>
                <code className="text-xs text-gray-600 break-all block bg-white p-2 rounded border border-gray-200">
                  {selectedTitle.pitch}
                </code>
                {selectedTitle.pdf_size && (
                  <p className="text-xs text-gray-500 mt-2">
                    File Size: <span className="font-medium text-gray-700">{formatFileSize(selectedTitle.pdf_size)}</span>
                    {selectedTitle.pdf_size > 5 * 1024 * 1024 && (
                      <span className="ml-2 text-orange-600 font-medium">
                        ⚠️ Large file (may take longer to process)
                      </span>
                    )}
                  </p>
                )}
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
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-blue-900">🤖 AI Analysis Results (v2.0 Enhanced)</h4>
                    {result.processing_confidence && (
                      <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded">
                        Confidence: {(result.processing_confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Story World & Setting */}
                    {result.analysis.story_world && (
                      <details open className="bg-white p-3 rounded border border-blue-100">
                        <summary className="cursor-pointer font-semibold text-blue-800 mb-2">🌍 Story World & Setting</summary>
                        <div className="space-y-2 mt-2 text-sm">
                          {result.analysis.story_world.setting && (
                            <div><span className="font-medium">Setting:</span> {result.analysis.story_world.setting}</div>
                          )}
                          {result.analysis.story_world.time_period && (
                            <div><span className="font-medium">Time Period:</span> {result.analysis.story_world.time_period}</div>
                          )}
                          {result.analysis.story_world.world_building?.length > 0 && (
                            <div>
                              <span className="font-medium">World Building:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {result.analysis.story_world.world_building.map((elem: string, idx: number) => (
                                  <li key={idx}>{elem}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Characters */}
                    {result.analysis.characters?.length > 0 && (
                      <details open className="bg-white p-3 rounded border border-blue-100">
                        <summary className="cursor-pointer font-semibold text-blue-800 mb-2">👥 Characters ({result.analysis.characters.length})</summary>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {result.analysis.characters.map((char: any, idx: number) => (
                            <div key={idx} className="p-2 bg-blue-50 rounded text-sm">
                              <div className="font-semibold text-blue-900">{char.name || 'Unnamed'}</div>
                              <div className="text-xs text-blue-700">{char.role} | {char.archetype}</div>
                              <div className="text-xs text-blue-800 mt-1">{char.description}</div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Story Elements */}
                    {result.analysis.story_elements && (
                      <details open className="bg-white p-3 rounded border border-blue-100">
                        <summary className="cursor-pointer font-semibold text-blue-800 mb-2">📖 Story Elements</summary>
                        <div className="space-y-2 mt-2 text-sm">
                          {result.analysis.story_elements.logline && (
                            <div><span className="font-medium">Logline:</span> <em>{result.analysis.story_elements.logline}</em></div>
                          )}
                          {result.analysis.story_elements.plot_summary && (
                            <div><span className="font-medium">Plot Summary:</span> {result.analysis.story_elements.plot_summary}</div>
                          )}
                          {result.analysis.story_elements.key_plot_points?.length > 0 && (
                            <div>
                              <span className="font-medium">Key Plot Points:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {result.analysis.story_elements.key_plot_points.map((point: string, idx: number) => (
                                  <li key={idx}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.analysis.story_elements.genre_blend?.length > 0 && (
                            <div><span className="font-medium">Genre:</span> {result.analysis.story_elements.genre_blend.join(', ')}</div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Themes & Tone */}
                    {result.analysis.themes_and_tone && (
                      <details open className="bg-white p-3 rounded border border-blue-100">
                        <summary className="cursor-pointer font-semibold text-blue-800 mb-2">🎨 Themes & Tone</summary>
                        <div className="space-y-2 mt-2 text-sm">
                          {result.analysis.themes_and_tone.primary_themes?.length > 0 && (
                            <div><span className="font-medium">Themes:</span> {result.analysis.themes_and_tone.primary_themes.join(', ')}</div>
                          )}
                          {result.analysis.themes_and_tone.emotional_tone && (
                            <div><span className="font-medium">Emotional Tone:</span> {result.analysis.themes_and_tone.emotional_tone}</div>
                          )}
                          {result.analysis.themes_and_tone.visual_style && (
                            <div><span className="font-medium">Visual Style:</span> {result.analysis.themes_and_tone.visual_style}</div>
                          )}
                          {result.analysis.themes_and_tone.mood_keywords?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.analysis.themes_and_tone.mood_keywords.map((mood: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{mood}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Market Positioning */}
                    {result.analysis.market_positioning && (
                      <details open className="bg-white p-3 rounded border border-blue-100">
                        <summary className="cursor-pointer font-semibold text-blue-800 mb-2">🎯 Market Positioning</summary>
                        <div className="space-y-2 mt-2 text-sm">
                          {result.analysis.market_positioning.target_audience && (
                            <div className="bg-blue-50 p-2 rounded">
                              <span className="font-medium">Target Audience:</span> {result.analysis.market_positioning.target_audience.age_range} • {result.analysis.market_positioning.target_audience.gender_skew} • {result.analysis.market_positioning.target_audience.psychographics}
                            </div>
                          )}
                          {result.analysis.market_positioning.comparable_titles?.length > 0 && (
                            <div>
                              <span className="font-medium">Comparable Titles:</span>
                              <div className="grid grid-cols-1 gap-2 mt-1">
                                {result.analysis.market_positioning.comparable_titles.map((comp: any, idx: number) => (
                                  <div key={idx} className="p-2 bg-gray-50 rounded text-xs">
                                    <strong>{comp.title}</strong> ({comp.platform}) - {comp.similarity}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {result.analysis.market_positioning.platform_fit?.length > 0 && (
                            <div><span className="font-medium">Platform Fit:</span> {result.analysis.market_positioning.platform_fit.join(', ')}</div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Source Material */}
                    {result.analysis.source_material && (
                      <details className="bg-white p-3 rounded border border-blue-100">
                        <summary className="cursor-pointer font-semibold text-blue-800 mb-2">📚 Source Material</summary>
                        <div className="space-y-2 mt-2 text-sm">
                          {result.analysis.source_material.original_platform && (
                            <div><span className="font-medium">Platform:</span> {result.analysis.source_material.original_platform}</div>
                          )}
                          {result.analysis.source_material.metrics && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {result.analysis.source_material.metrics.views && (
                                <div className="bg-green-50 p-2 rounded text-center">
                                  <div className="text-xs text-green-700">Views</div>
                                  <div className="font-bold text-green-900">{Number(result.analysis.source_material.metrics.views).toLocaleString()}</div>
                                </div>
                              )}
                              {result.analysis.source_material.metrics.chapters && (
                                <div className="bg-purple-50 p-2 rounded text-center">
                                  <div className="text-xs text-purple-700">Chapters</div>
                                  <div className="font-bold text-purple-900">{result.analysis.source_material.metrics.chapters}</div>
                                </div>
                              )}
                              {result.analysis.source_material.serialization_status && (
                                <div className="bg-blue-50 p-2 rounded text-center">
                                  <div className="text-xs text-blue-700">Status</div>
                                  <div className="font-bold text-blue-900 capitalize">{result.analysis.source_material.serialization_status}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Korean Cultural Elements */}
                    {result.analysis.korean_cultural_elements?.length > 0 && (
                      <details className="bg-white p-3 rounded border border-blue-100">
                        <summary className="cursor-pointer font-semibold text-blue-800 mb-2">🇰🇷 Korean Cultural Elements</summary>
                        <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                          {result.analysis.korean_cultural_elements.map((elem: string, idx: number) => (
                            <li key={idx}>{elem}</li>
                          ))}
                        </ul>
                      </details>
                    )}

                    {/* IP Value */}
                    {result.analysis.ip_value && (
                      <details className="bg-white p-3 rounded border border-blue-100">
                        <summary className="cursor-pointer font-semibold text-blue-800 mb-2">💎 IP Value & Selling Points</summary>
                        <div className="space-y-2 mt-2 text-sm">
                          {result.analysis.ip_value.franchise_potential && (
                            <div><span className="font-medium">Franchise Potential:</span> <span className="capitalize">{result.analysis.ip_value.franchise_potential}</span></div>
                          )}
                          {result.analysis.ip_value.unique_selling_points?.length > 0 && (
                            <div>
                              <span className="font-medium">Unique Selling Points:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {result.analysis.ip_value.unique_selling_points.map((point: string, idx: number) => (
                                  <li key={idx}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Production Details */}
                    {result.analysis.production_details && (
                      <details className="bg-white p-3 rounded border border-blue-100">
                        <summary className="cursor-pointer font-semibold text-blue-800 mb-2">🎬 Production Details</summary>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          {result.analysis.production_details.format && (
                            <div><span className="font-medium">Format:</span> {result.analysis.production_details.format}</div>
                          )}
                          {result.analysis.production_details.estimated_episodes && (
                            <div><span className="font-medium">Episodes:</span> {result.analysis.production_details.estimated_episodes}</div>
                          )}
                          {result.analysis.production_details.budget_range && (
                            <div><span className="font-medium">Budget:</span> {result.analysis.production_details.budget_range}</div>
                          )}
                          {result.analysis.production_details.adaptation_type && (
                            <div><span className="font-medium">Type:</span> {result.analysis.production_details.adaptation_type}</div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Backward Compatibility - Show old format if new format not present */}
                    {!result.analysis.story_world && result.analysis.summary && (
                      <div>
                        <h5 className="text-sm font-semibold text-blue-800 mb-1">Executive Summary (Legacy Format)</h5>
                        <p className="text-sm text-blue-900 bg-white p-3 rounded border border-blue-100">
                          {result.analysis.summary}
                        </p>
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
            <li>3. Review the extracted data and AI analysis for accuracy (v2.0 Enhanced extracts 5-7x more data)</li>
            <li>4. If results look good, click "Extract & Save to Database" to persist the data</li>
            <li>5. Monitor the cost tracker to ensure API usage is within budget (~$0.15-0.20 per title with enhanced extraction)</li>
            <li>6. Test with 1-2 titles first, then scale to more if successful</li>
            <li>7. Check processing confidence score - should be &gt;70% for quality results</li>
          </ol>
        </div>
      </div>
    </PageContainer>
  );
}
