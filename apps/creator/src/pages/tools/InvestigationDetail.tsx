import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  getIntelligenceTitleWithSources,
  searchTitlesForIngestion,
  createIngestionRequest,
  executeIngestion,
  type IntelligenceTitleWithSources,
  type IntelligenceSource,
  type IntelligenceMetrics,
  type FieldSelection,
} from '@/services/intelligenceService';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Database,
  ExternalLink,
  Search,
  Loader2,
} from 'lucide-react';

/**
 * Investigation Detail - View intelligence data and ingest into titles
 *
 * Features:
 * - View intelligence title with all sources
 * - Compare metrics across sources side-by-side
 * - Select which source values to use per field
 * - Search and select target title for ingestion
 * - Execute ingestion with audit trail
 *
 * Updated: Uses normalized intelligence_* schema
 */
export function InvestigationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [record, setRecord] = useState<IntelligenceTitleWithSources | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ingestion state
  const [showIngestionWizard, setShowIngestionWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    title_id: string;
    title_name_kr: string;
    title_name_en: string | null;
    creator_id: string | null;
  }>>([]);
  const [selectedTargetTitle, setSelectedTargetTitle] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Record<string, FieldSelection>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);

  useEffect(() => {
    if (id) {
      loadRecord();
    }
  }, [id]);

  const loadRecord = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getIntelligenceTitleWithSources(id);
      setRecord(data);
    } catch (err) {
      console.error('Failed to load intelligence record:', err);
      setError(err instanceof Error ? err.message : 'Failed to load record');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchTitlesForIngestion(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      toast({
        title: 'Search failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFieldToggle = (fieldName: string, source: IntelligenceSource, value: any) => {
    setSelectedFields(prev => {
      const newFields = { ...prev };
      if (newFields[fieldName]?.source_id === source.id) {
        // Deselect
        delete newFields[fieldName];
      } else {
        // Select
        newFields[fieldName] = {
          source_id: source.id,
          value: value,
        };
      }
      return newFields;
    });
  };

  const handleIngest = async () => {
    if (!record || !selectedTargetTitle || !user?.email) {
      toast({
        title: 'Missing information',
        description: 'Please select a target title and at least one field',
        variant: 'destructive',
      });
      return;
    }

    if (Object.keys(selectedFields).length === 0) {
      toast({
        title: 'No fields selected',
        description: 'Please select at least one field to ingest',
        variant: 'destructive',
      });
      return;
    }

    setIsIngesting(true);
    try {
      // Create and immediately execute ingestion request
      const request = await createIngestionRequest(
        record.id,
        selectedTargetTitle,
        selectedFields,
        user.email,
        `Ingestion from intelligence: ${record.original_title_ko || record.slug}`
      );

      await executeIngestion(request.id, user.email);

      toast({
        title: 'Ingestion complete',
        description: `Successfully updated ${Object.keys(selectedFields).length} field(s)`,
      });

      // Reset wizard
      setShowIngestionWizard(false);
      setSelectedTargetTitle(null);
      setSelectedFields({});
      setSearchResults([]);
      setSearchQuery('');

    } catch (err) {
      console.error('Ingestion failed:', err);
      toast({
        title: 'Ingestion failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // Get latest metrics for a source
  const getLatestMetrics = (sourceId: string): IntelligenceMetrics | null => {
    if (!record) return null;
    return record.metrics.find(m => m.source_id === sourceId) || null;
  };

  // Format large numbers
  const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return '-';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading intelligence record...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !record) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500">{error || 'Intelligence record not found'}</p>
            <Button
              onClick={() => navigate('/tools')}
              variant="outline"
              className="mt-4 border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            onClick={() => navigate('/tools')}
            variant="outline"
            className="mb-4 border-gray-300 hover:bg-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                {record.original_title_ko || record.slug}
              </h1>
              {record.original_title_en && (
                <p className="text-lg text-gray-600 mt-1">{record.original_title_en}</p>
              )}
              <p className="text-gray-500 mt-2">
                {record.type} · {record.sources.length} source(s) collected
              </p>
            </div>
            <Badge className="bg-black text-white capitalize">{record.type}</Badge>
          </div>
        </div>

        {/* Metadata Card */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-black mb-4">Intelligence Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Slug:</span>
                <span className="ml-2 text-black font-medium font-mono">{record.slug}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 text-black font-medium capitalize">{record.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Original Language:</span>
                <span className="ml-2 text-black font-medium">{record.original_language || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-600">Has Web Novel:</span>
                <span className="ml-2 text-black font-medium">{record.has_webnovel ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 text-black font-medium">
                  {new Date(record.created_at).toLocaleDateString()}
                </span>
              </div>
              {record.primary_genres && record.primary_genres.length > 0 && (
                <div>
                  <span className="text-gray-600">Genres:</span>
                  <span className="ml-2 text-black font-medium">
                    {record.primary_genres.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Source Comparison Cards */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            Source Comparison
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({record.sources.length} sources)
            </span>
          </h3>

          {record.sources.length === 0 ? (
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
              <CardContent className="p-6">
                <p className="text-gray-500 text-center">No sources collected yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {record.sources.map((source) => {
                const metrics = getLatestMetrics(source.id);
                return (
                  <Card key={source.id} className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-black capitalize">{source.domain}</h4>
                        <Badge variant="outline" className="capitalize">
                          {source.category.replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* Source URL */}
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View on Platform
                      </a>

                      {/* Metrics */}
                      {metrics ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Views:</span>
                              <span className="font-medium">{formatNumber(metrics.views)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rating:</span>
                              <span className="font-medium">
                                {metrics.rating_score ? `${metrics.rating_score}/10` : '-'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subscribers:</span>
                              <span className="font-medium">{formatNumber(metrics.subscribers)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Episodes:</span>
                              <span className="font-medium">{metrics.episode_count || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className="font-medium capitalize">{metrics.status || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Favorites:</span>
                              <span className="font-medium">{formatNumber(metrics.favorites)}</span>
                            </div>
                            {/* Rating count */}
                            {(metrics.rating_votes || metrics.raw?.rating_count) && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Rating Count:</span>
                                <span className="font-medium">{formatNumber(metrics.rating_votes || metrics.raw?.rating_count)}</span>
                              </div>
                            )}
                            {/* Comment count from raw data */}
                            {metrics.raw?.comment_count !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Comments:</span>
                                <span className="font-medium">{formatNumber(metrics.raw.comment_count)}</span>
                              </div>
                            )}
                            {metrics.age_rating && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Age Rating:</span>
                                <span className="font-medium">{metrics.age_rating}</span>
                              </div>
                            )}
                          </div>

                          {/* Genre/Tags from raw data */}
                          {(metrics.raw?.genre?.length > 0 || metrics.raw?.tags?.length > 0) && (
                            <div className="pt-2 border-t border-gray-100">
                              {metrics.raw?.genre?.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs text-gray-500 block mb-1">Genres:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {metrics.raw.genre.map((g: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {g}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {metrics.raw?.tags?.length > 0 && (
                                <div>
                                  <span className="text-xs text-gray-500 block mb-1">Tags:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {metrics.raw.tags.slice(0, 5).map((t: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs bg-gray-50">
                                        #{t}
                                      </Badge>
                                    ))}
                                    {metrics.raw.tags.length > 5 && (
                                      <span className="text-xs text-gray-400">
                                        +{metrics.raw.tags.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Author info from raw data */}
                          {(metrics.raw?.author || metrics.raw?.artist) && (
                            <div className="pt-2 border-t border-gray-100 text-sm">
                              {metrics.raw?.author && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Author:</span>
                                  <span className="font-medium">{metrics.raw.author}</span>
                                </div>
                              )}
                              {metrics.raw?.artist && metrics.raw?.artist !== metrics.raw?.author && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Artist:</span>
                                  <span className="font-medium">{metrics.raw.artist}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Synopsis from raw data */}
                          {metrics.raw?.synopsis_kr && (
                            <div className="pt-2 border-t border-gray-100">
                              <span className="text-xs text-gray-500 block mb-1">Synopsis (KR):</span>
                              <p className="text-sm text-gray-700 line-clamp-3">{metrics.raw.synopsis_kr}</p>
                            </div>
                          )}

                          {/* Thumbnail from raw data */}
                          {metrics.raw?.thumbnail && (
                            <div className="pt-2 border-t border-gray-100">
                              <span className="text-xs text-gray-500 block mb-1">Thumbnail:</span>
                              <img
                                src={metrics.raw.thumbnail}
                                alt="Thumbnail"
                                className="w-16 h-24 object-cover rounded border border-gray-200"
                              />
                            </div>
                          )}

                          <p className="text-xs text-gray-400">
                            Snapshot: {new Date(metrics.snapshot_time).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No metrics available</p>
                      )}

                      {/* Selection checkboxes for ingestion */}
                      {showIngestionWizard && metrics && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Select fields to ingest:</p>
                          <div className="space-y-2">
                            {metrics.views !== null && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['views']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('views', source, metrics.views)}
                                />
                                <span>Views: {formatNumber(metrics.views)}</span>
                              </label>
                            )}
                            {metrics.subscribers !== null && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['subscribers']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('subscribers', source, metrics.subscribers)}
                                />
                                <span>Subscribers (→ Likes): {formatNumber(metrics.subscribers)}</span>
                              </label>
                            )}
                            {metrics.rating_score !== null && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['rating']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('rating', source, metrics.rating_score)}
                                />
                                <span>Rating: {metrics.rating_score}</span>
                              </label>
                            )}
                            {metrics.episode_count !== null && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['chapters']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('chapters', source, metrics.episode_count)}
                                />
                                <span>Episodes: {metrics.episode_count}</span>
                              </label>
                            )}
                            {/* New ingestible fields from raw data */}
                            {metrics.raw?.author && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['author']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('author', source, metrics.raw.author)}
                                />
                                <span>Author: {metrics.raw.author}</span>
                              </label>
                            )}
                            {metrics.raw?.genre?.length > 0 && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['genre']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('genre', source, metrics.raw.genre)}
                                />
                                <span>Genre: {metrics.raw.genre.join(', ')}</span>
                              </label>
                            )}
                            {metrics.age_rating && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['age_rating']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('age_rating', source, metrics.age_rating)}
                                />
                                <span>Age Rating: {metrics.age_rating}</span>
                              </label>
                            )}
                            {/* Rating count */}
                            {(metrics.rating_votes || metrics.raw?.rating_count) && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['rating_count']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('rating_count', source, metrics.rating_votes || metrics.raw?.rating_count)}
                                />
                                <span>Rating Count: {formatNumber(metrics.rating_votes || metrics.raw?.rating_count)}</span>
                              </label>
                            )}
                            {/* Comment count */}
                            {metrics.raw?.comment_count !== undefined && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['comment_count']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('comment_count', source, metrics.raw.comment_count)}
                                />
                                <span>Comment Count: {formatNumber(metrics.raw.comment_count)}</span>
                              </label>
                            )}
                            {/* Synopsis KR */}
                            {metrics.raw?.synopsis_kr && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['synopsis_kr']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('synopsis_kr', source, metrics.raw.synopsis_kr)}
                                />
                                <span>Synopsis (KR) (→ Description KR): <span className="text-gray-500 truncate max-w-[200px] inline-block align-bottom">{metrics.raw.synopsis_kr.substring(0, 50)}...</span></span>
                              </label>
                            )}
                            {/* Thumbnail */}
                            {metrics.raw?.thumbnail && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['thumbnail']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('thumbnail', source, metrics.raw.thumbnail)}
                                />
                                <span>Thumbnail (→ Title Image)</span>
                                <img src={metrics.raw.thumbnail} alt="" className="w-6 h-8 object-cover rounded" />
                              </label>
                            )}
                            {metrics.raw?.tags?.length > 0 && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedFields['tags']?.source_id === source.id}
                                  onCheckedChange={() => handleFieldToggle('tags', source, metrics.raw.tags)}
                                />
                                <span>Tags (→ Keywords): {metrics.raw.tags.join(', ')}</span>
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Raw Data (Collapsible) */}
        {record.sources.length > 0 && (
          <details className="mb-6">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-black">
              View raw data (JSON)
            </summary>
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mt-2">
              <CardContent className="p-6">
                {record.sources.map((source) => (
                  <div key={source.id} className="mb-4 last:mb-0">
                    <h4 className="text-sm font-semibold text-black mb-2 capitalize">{source.domain}</h4>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(source.raw_meta, null, 2)}
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          </details>
        )}

        {/* Ingestion Wizard */}
        {!showIngestionWizard ? (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-black mb-1">
                    Ready to ingest into titles?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select field values and update an existing title with this intelligence data
                  </p>
                </div>
                <Button
                  onClick={() => setShowIngestionWizard(true)}
                  className="bg-black text-white hover:bg-gray-800"
                  disabled={record.sources.length === 0}
                >
                  <Database className="mr-2 h-4 w-4" />
                  Prepare Ingestion
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-black mb-4">Ingestion Wizard</h3>

              {/* Step 1: Search for target title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">
                  Step 1: Search for target title
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search by Korean or English title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="border-gray-300"
                  />
                  <Button
                    onClick={handleSearch}
                    variant="outline"
                    className="border-gray-300"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((title) => (
                      <div
                        key={title.title_id}
                        onClick={() => setSelectedTargetTitle(title.title_id)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                          selectedTargetTitle === title.title_id ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-black">{title.title_name_kr}</p>
                            {title.title_name_en && (
                              <p className="text-xs text-gray-500">{title.title_name_en}</p>
                            )}
                          </div>
                          {selectedTargetTitle === title.title_id && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTargetTitle && (
                  <p className="text-xs text-green-600 mt-2">
                    Target title selected
                  </p>
                )}
              </div>

              {/* Step 2: Select fields (shown in source cards above) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">
                  Step 2: Select field values from sources above
                </label>
                <p className="text-sm text-gray-600">
                  Check the fields you want to ingest in each source card above.
                  Selected: {Object.keys(selectedFields).length} field(s)
                </p>
                {Object.keys(selectedFields).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(selectedFields).map(([field, selection]) => (
                      <Badge key={field} variant="outline" className="capitalize">
                        {field}: {selection.value?.toString() || '-'}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setShowIngestionWizard(false);
                    setSelectedTargetTitle(null);
                    setSelectedFields({});
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  variant="outline"
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleIngest}
                  className="bg-black text-white hover:bg-gray-800"
                  disabled={!selectedTargetTitle || Object.keys(selectedFields).length === 0 || isIngesting}
                >
                  {isIngesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ingesting...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Execute Ingestion
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
