import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { titlesService, Title, TitleFilters } from '@/services/titlesService';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { TitleCard } from '@/components/title/TitleCard';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { trackTitleSearch, trackFeatureUsage, trackPageView, trackSearchZeroResults, trackTitlesFilterApplied, trackSessionSearches } from '@/utils/analytics';
import {
  type FormatType,
  type FormatFitSummary,
  formatFitService,
} from '@/services/formatFitService';

const PAGE_SIZE = 12;

const FORMAT_FILTER_OPTIONS: { value: FormatType | null; label: string; icon: React.ReactNode }[] = [
  { value: null, label: 'All Formats', icon: null },
  { value: 'film', label: 'Film', icon: <Icon icon="solar:clapperboard-bold-duotone" className="h-4 w-4" /> },
  { value: 'tv_series', label: 'TV Series', icon: <Icon icon="solar:tv-bold-duotone" className="h-4 w-4" /> },
  { value: 'animation', label: 'Animation', icon: <Icon icon="solar:palette-bold-duotone" className="h-4 w-4" /> },
  { value: 'microdrama', label: 'Microdrama', icon: <Icon icon="solar:smartphone-bold-duotone" className="h-4 w-4" /> },
  { value: 'audio_drama', label: 'Audio Drama', icon: <Icon icon="solar:headphones-bold-duotone" className="h-4 w-4" /> },
];

export default function Titles() {
  const { toast } = useToast();

  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<FormatType | null>(null);
  const [formatFilteredTitleIds, setFormatFilteredTitleIds] = useState<Set<string> | null>(null);
  const [formatFitSummaries, setFormatFitSummaries] = useState<Map<string, FormatFitSummary>>(new Map());

  const [vectorPending, setVectorPending] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchCountRef = useRef(0); // Track searches per session for analytics
  const searchRequestIdRef = useRef(0); // Discard stale search responses

  // Track page view on mount
  useEffect(() => {
    trackPageView('/buyers/titles', 'Discover Titles');
    trackFeatureUsage('titles_browse');
  }, []);

  // Track session searches on page leave
  useEffect(() => {
    return () => {
      if (searchCountRef.current > 0) {
        trackSessionSearches('titles', searchCountRef.current);
      }
    };
  }, []);

  // Fetch format-filtered title IDs when format filter changes
  useEffect(() => {
    const fetchFormatFilteredIds = async () => {
      if (!formatFilter) {
        setFormatFilteredTitleIds(null);
        return;
      }

      try {
        const results = await formatFitService.getTitlesForFormat(formatFilter, 50, 100);
        // The shared format-fit service in @kstorybridge/tools doesn't gate
        // on priority; trim Low-priority IDs here so the buyer count and
        // empty-state messages reflect only published titles.
        const candidateIds = results.map((r) => r.title_id);
        if (candidateIds.length === 0) {
          setFormatFilteredTitleIds(new Set());
          return;
        }
        const { data: published } = await supabase
          .from('titles')
          .select('title_id')
          .in('title_id', candidateIds)
          .in('priority', ['1', '2']);
        const ids = new Set<string>(((published || []) as Array<{ title_id: string }>).map((r) => r.title_id));
        setFormatFilteredTitleIds(ids);
      } catch (error) {
        console.error('Error fetching format-filtered titles:', error);
        setFormatFilteredTitleIds(new Set());
      }
    };

    fetchFormatFilteredIds();
  }, [formatFilter]);

  // Fetch initial titles with filters
  useEffect(() => {
    const fetchTitles = async () => {
      setLoading(true);
      setOffset(0); // Reset offset when filters change
      // Any new fetch invalidates in-flight hybrid search stages
      searchRequestIdRef.current += 1;
      setVectorPending(false);
      try {
        // Use hybrid search if there's a search query:
        // stage 1 = fast ilike name/synopsis matches, stage 2 = semantic vector results appended
        if (searchQuery && searchQuery.trim().length > 0) {
          console.log('🔍 Using hybrid search for:', searchQuery);
          const requestId = searchRequestIdRef.current;

          const { nameMatches, vectorPromise } = await titlesService.searchTitlesHybrid(searchQuery, 50);
          if (requestId !== searchRequestIdRef.current) return; // stale

          trackTitleSearch('hybrid', formatFilter ? 1 : 0);

          // Apply format filter if set
          const applyFormatFilter = (list: Title[]) =>
            formatFilteredTitleIds !== null
              ? list.filter((t) => formatFilteredTitleIds.has(t.title_id))
              : list;

          const stage1 = applyFormatFilter(nameMatches);
          setTitles(stage1);
          setHasMore(false); // Search returns all results at once (no pagination)
          setOffset(0);
          setLoading(false); // Show exact matches immediately
          setVectorPending(true);

          // Increment search counter for session analytics
          searchCountRef.current += 1;

          // Stage 2: append semantic results (deduped) once ready
          vectorPromise.then((vectorResults) => {
            if (requestId !== searchRequestIdRef.current) return; // stale
            setVectorPending(false);

            const seen = new Set(stage1.map((t) => t.title_id));
            const additions = applyFormatFilter(vectorResults).filter((t) => !seen.has(t.title_id));
            const totalCount = stage1.length + additions.length;
            if (additions.length > 0) {
              setTitles((prev) => [...prev, ...additions]);
            }

            // Track zero results for search quality analysis
            if (totalCount === 0) {
              trackSearchZeroResults('hybrid');
            }
          });
        } else if (formatFilteredTitleIds !== null && formatFilter) {
          // Format filter is active - get those specific titles
          const titleIds = Array.from(formatFilteredTitleIds).slice(0, 30);
          if (titleIds.length > 0) {
            // Fetch titles and format fit summaries in parallel
            const [filteredTitles, summaries] = await Promise.all([
              titlesService.getTitlesByIds(titleIds),
              formatFitService.getFormatFitSummariesForFormat(titleIds, formatFilter),
            ]);
            setTitles(filteredTitles);
            setFormatFitSummaries(summaries);
          } else {
            setTitles([]);
            setFormatFitSummaries(new Map());
          }
          setHasMore(false);
          setOffset(0);
        } else {
          // Use traditional pagination when no search query or format filter
          const filters: TitleFilters = {};

          const { data, hasMore: more } = await titlesService.getTitlesPaginated(
            filters,
            0,
            PAGE_SIZE
          );
          setTitles(data);
          setHasMore(more);
          setOffset(PAGE_SIZE);
          setFormatFitSummaries(new Map()); // Clear summaries when no filter
        }
      } catch (error: unknown) {
        console.error('Error fetching titles:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch titles';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid excessive API calls
    const debounceTimer = setTimeout(() => {
      fetchTitles();
    }, searchQuery ? 300 : 0); // 300ms debounce for search, instant for filters

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, formatFilteredTitleIds, toast]);

  // Load more titles on scroll (only works for non-vector search)
  const loadMoreTitles = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    // Don't paginate vector search results (all results returned at once)
    if (searchQuery && searchQuery.trim().length > 0) {
      return;
    }

    setLoadingMore(true);
    try {
      const filters: TitleFilters = {};

      const { data, hasMore: more } = await titlesService.getTitlesPaginated(
        filters,
        offset,
        PAGE_SIZE
      );

      setTitles((prev) => [...prev, ...data]);
      setHasMore(more);
      setOffset((prev) => prev + PAGE_SIZE);
    } catch (error: unknown) {
      console.error('Error loading more titles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more titles',
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, offset, searchQuery, toast]);

  // Handle format filter change with tracking
  const handleFormatFilterChange = (newFormat: FormatType | null) => {
    // Track filter change
    trackTitlesFilterApplied('format', newFormat);
    setFormatFilter(newFormat);
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreTitles();
        }
      },
      { rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loadMoreTitles, loading]);

  return (
    <BuyerLayout>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 p-3 rounded-2xl shadow-lg">
                <Icon icon="solar:book-bold-duotone" className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-hanok-teal">Discover Titles</h1>
                <p className="text-base sm:text-lg text-gray-600 mt-1">Browse & Search Korean Content</p>
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Explore our catalog of Korean webtoons, web novels, and stories with intelligent search and filtering.
          </p>
        </div>
        {/* Elegant Search Box */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center bg-white border border-gray-200 rounded-3xl shadow-lg px-5 py-2">
            <Icon icon="solar:magnifer-bold-duotone" className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search titles (e.g., 'romantic comedy in Seoul')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 ml-3 py-2 text-[15px] text-gray-900 placeholder-gray-400 bg-transparent border-0 focus:outline-none focus:ring-0"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-500 text-center mt-2">
              {vectorPending ? (
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon="solar:refresh-bold-duotone" className="h-3.5 w-3.5 animate-spin" />
                  Finding similar titles with AI…
                </span>
              ) : (
                'Name matches first, AI-powered similar titles below'
              )}
            </p>
          )}
        </div>

        {/* Format Fit Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-sm text-gray-500 self-center mr-2">Best for:</span>
          {FORMAT_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value || 'all'}
              onClick={() => handleFormatFilterChange(option.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                formatFilter === option.value
                  ? 'bg-hanok-teal text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-hanok-teal hover:text-hanok-teal'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
          {formatFilter && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 self-center ml-2">
              Score 50+
            </Badge>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-hanok-teal" />
          </div>
        ) : titles.length === 0 ? (
          <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-700 text-lg font-medium">No titles found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-600 font-medium">
              Showing {titles.length} title{titles.length !== 1 ? 's' : ''}
              {hasMore && ' (scroll for more)'}
            </div>

            {/* Title Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {titles.map((title, index) => (
                <div key={title.title_id} className="min-w-0">
                  <TitleCard
                    title={title}
                    variant="grid"
                    source={searchQuery ? 'search' : formatFilter ? 'format_filter' : 'browse'}
                    position={index + 1}
                    formatFitSummary={formatFilter ? formatFitSummaries.get(title.title_id) : undefined}
                    selectedFormat={formatFilter || undefined}
                  />
                </div>
              ))}
            </div>

            {/* Infinite Scroll Observer Target */}
            <div ref={observerTarget} className="py-8">
              {loadingMore && (
                <div className="flex items-center justify-center">
                  <Icon icon="solar:refresh-circle-bold-duotone" className="h-6 w-6 animate-spin text-hanok-teal" />
                  <span className="ml-2 text-sm text-gray-600">Loading more...</span>
                </div>
              )}
              {!hasMore && titles.length > 0 && (
                <div className="text-center text-sm text-gray-500 font-medium">
                  You've reached the end of the list
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </BuyerLayout>
  );
}
