import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title, TitleFilters } from '@/services/titlesService';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { TitleCard } from '@/components/title/TitleCard';
import { Search, Loader2, BookOpen, X } from 'lucide-react';

const PAGE_SIZE = 12;

export default function Titles() {
  const { toast } = useToast();

  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const observerTarget = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch initial titles with filters
  useEffect(() => {
    const fetchTitles = async () => {
      setLoading(true);
      setOffset(0); // Reset offset when filters change
      try {
        // Use vector search if there's a search query
        if (searchQuery && searchQuery.trim().length > 0) {
          console.log('🔍 Using vector search for:', searchQuery);

          // Vector search returns all results at once (no pagination)
          const vectorResults = await titlesService.searchTitlesVector(searchQuery, 30);

          setTitles(vectorResults);
          setHasMore(false); // Vector search returns all results at once
          setOffset(0);
        } else {
          // Use traditional pagination when no search query
          const filters: TitleFilters = {};

          const { data, hasMore: more } = await titlesService.getTitlesPaginated(
            filters,
            0,
            PAGE_SIZE
          );
          setTitles(data);
          setHasMore(more);
          setOffset(PAGE_SIZE);
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
    }, searchQuery ? 500 : 0); // 500ms debounce for search, instant for filters

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, toast]);

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
                <BookOpen className="h-8 w-8 text-white" />
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
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
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
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Using AI-powered semantic search
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-hanok-teal" />
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
              {titles.map((title) => (
                <div key={title.title_id} className="min-w-0">
                  <TitleCard title={title} variant="grid" />
                </div>
              ))}
            </div>

            {/* Infinite Scroll Observer Target */}
            <div ref={observerTarget} className="py-8">
              {loadingMore && (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-hanok-teal" />
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
