import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title, TitleFilters } from '@/services/titlesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { TitleCard } from '@/components/title/TitleCard';
import { Search, Loader2 } from 'lucide-react';

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
        const filters: TitleFilters = {
          search: searchQuery || undefined,
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

    fetchTitles();
  }, [searchQuery, selectedGenre, selectedFormat, toast]);

  // Load more titles on scroll
  const loadMoreTitles = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const filters: TitleFilters = {
        search: searchQuery || undefined,
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
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Discover Titles</h1>
          <p className="text-sm text-gray-600 mt-1">Browse and search Korean content</p>
        </div>
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search titles..."
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
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
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchQuery && (
                  <span className="px-2 py-1 bg-hanok-teal/10 text-hanok-teal text-xs rounded-full">
                    Search: "{searchQuery}"
                  </span>
                )}
                {selectedGenre && (
                  <span className="px-2 py-1 bg-hanok-teal/10 text-hanok-teal text-xs rounded-full">
                    {selectedGenre}
                  </span>
                )}
                {selectedFormat && (
                  <span className="px-2 py-1 bg-hanok-teal/10 text-hanok-teal text-xs rounded-full">
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
                  className="h-6 px-2 text-xs"
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
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : titles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No titles found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {titles.length} title{titles.length !== 1 ? 's' : ''}
              {hasMore && ' (scroll for more)'}
            </div>

            {/* Title Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {titles.map((title) => (
                <TitleCard key={title.title_id} title={title} variant="grid" />
              ))}
            </div>

            {/* Infinite Scroll Observer Target */}
            <div ref={observerTarget} className="py-8">
              {loadingMore && (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading more...</span>
                </div>
              )}
              {!hasMore && titles.length > 0 && (
                <div className="text-center text-sm text-gray-500">
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
