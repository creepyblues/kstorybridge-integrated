import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title, TitleFilters } from '@/services/titlesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { TitleCard } from '@/components/title/TitleCard';
import { Search, Loader2, BookOpen } from 'lucide-react';

const PAGE_SIZE = 12;

export default function Titles() {
  const { toast } = useToast();

  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch genres and formats on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [genresData, formatsData] = await Promise.all([
          titlesService.getGenres(),
          titlesService.getFormats(),
        ]);
        setGenres(genresData);
        setFormats(formatsData);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };
    fetchMetadata();
  }, []);

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

          // Apply genre/format filters to vector results
          let filteredResults = vectorResults;

          if (selectedGenre) {
            filteredResults = filteredResults.filter(
              title => title.genre?.includes(selectedGenre)
            );
          }

          if (selectedFormat) {
            filteredResults = filteredResults.filter(
              title => title.content_format === selectedFormat
            );
          }

          setTitles(filteredResults);
          setHasMore(false); // Vector search returns all results at once
          setOffset(0);
        } else {
          // Use traditional pagination when no search query
          const filters: TitleFilters = {
            genre: selectedGenre || undefined,
            format: selectedFormat || undefined,
          };

          const { data, hasMore: more } = await titlesService.getTitlesPaginated(
            filters,
            0,
            PAGE_SIZE
          );
          setTitles(data);
          setHasMore(more);
          setOffset(PAGE_SIZE);
        }
      } catch (error: any) {
        console.error('Error fetching titles:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch titles',
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
  }, [searchQuery, selectedGenre, selectedFormat, toast]);

  // Load more titles on scroll (only works for non-vector search)
  const loadMoreTitles = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    // Don't paginate vector search results (all results returned at once)
    if (searchQuery && searchQuery.trim().length > 0) {
      return;
    }

    setLoadingMore(true);
    try {
      const filters: TitleFilters = {
        genre: selectedGenre || undefined,
        format: selectedFormat || undefined,
      };

      const { data, hasMore: more } = await titlesService.getTitlesPaginated(
        filters,
        offset,
        PAGE_SIZE
      );

      setTitles((prev) => [...prev, ...data]);
      setHasMore(more);
      setOffset((prev) => prev + PAGE_SIZE);
    } catch (error: any) {
      console.error('Error loading more titles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more titles',
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, offset, searchQuery, selectedGenre, selectedFormat, toast]);

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
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 p-3 rounded-2xl shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-hanok-teal">Discover Titles</h1>
              <p className="text-lg text-gray-600 mt-1">Browse & Search Korean Content</p>
            </div>
          </div>
          <p className="text-gray-600 text-base">
            Explore our catalog of Korean webtoons, web novels, and stories with intelligent search and filtering.
          </p>
        </div>
        {/* Search and Filters */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search titles (e.g., 'romantic comedy in Seoul')..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Genre Filter */}
              <div>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-hanok-teal/20 focus:border-hanok-teal"
                >
                  <option value="">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Format Filter */}
              <div>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-hanok-teal/20 focus:border-hanok-teal"
                >
                  <option value="">All Formats</option>
                  {formats.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || selectedGenre || selectedFormat) && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                {searchQuery && (
                  <span className="px-3 py-1 bg-hanok-teal/10 text-hanok-teal text-xs font-medium rounded-full border border-hanok-teal/20">
                    Search: "{searchQuery}"
                  </span>
                )}
                {selectedGenre && (
                  <span className="px-3 py-1 bg-hanok-teal/10 text-hanok-teal text-xs font-medium rounded-full border border-hanok-teal/20">
                    {selectedGenre}
                  </span>
                )}
                {selectedFormat && (
                  <span className="px-3 py-1 bg-hanok-teal/10 text-hanok-teal text-xs font-medium rounded-full border border-hanok-teal/20">
                    {selectedFormat}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('');
                    setSelectedFormat('');
                  }}
                  className="h-7 px-3 text-xs text-gray-600 hover:text-hanok-teal hover:bg-hanok-teal/5"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
                <TitleCard key={title.title_id} title={title} variant="grid" />
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
