import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@kstorybridge/ui';
import { Button } from '@kstorybridge/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { featuredService, type FeaturedWithTitle } from '@/services/featuredService';

interface FeaturedTitlesCarouselProps {
  className?: string;
}

const FeaturedTitlesCarousel = ({ className = "" }: FeaturedTitlesCarouselProps) => {
  const [allFeaturedTitles, setAllFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [titlesPerPage, setTitlesPerPage] = useState(6);
  
  // Calculate titles per page based on screen width - matching Tailwind breakpoints
  useEffect(() => {
    const calculateTitlesPerPage = () => {
      const width = window.innerWidth;
      // Match the actual grid CSS: grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6
      if (width < 640) {
        setTitlesPerPage(2); // default: 2 cols
      } else if (width < 1024) {
        setTitlesPerPage(3); // sm: 3 cols (640px+)
      } else if (width < 1280) {
        setTitlesPerPage(4); // lg: 4 cols (1024px+)
      } else {
        setTitlesPerPage(6); // xl: 6 cols (1280px+)
      }
    };

    calculateTitlesPerPage();
    window.addEventListener('resize', calculateTitlesPerPage);
    return () => window.removeEventListener('resize', calculateTitlesPerPage);
  }, []);
  
  useEffect(() => {
    const loadFeaturedTitles = async () => {
      try {
        setLoading(true);
        const titles = await featuredService.getFeaturedTitles();
        setAllFeaturedTitles(titles);
      } catch (error) {
        console.error('Error loading featured titles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedTitles();
  }, []);

  const totalPages = Math.ceil(allFeaturedTitles.length / titlesPerPage);
  const startIndex = currentPage * titlesPerPage;
  const endIndex = startIndex + titlesPerPage;
  const currentTitles = allFeaturedTitles.slice(startIndex, endIndex);

  // Reset to first page when titles per page changes
  useEffect(() => {
    setCurrentPage(0);
  }, [titlesPerPage]);

  const goToPreviousPage = () => {
    setCurrentPage(prev => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const formatGenre = (genre: string | string[] | null) => {
    if (!genre) return '';
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className}`}>
        Loading featured titles...
      </div>
    );
  }

  if (allFeaturedTitles.length === 0) {
    return (
      <div className={`text-center text-midnight-ink-600 py-8 ${className}`}>
        No featured titles available.
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Navigation and Pagination Info */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-midnight-ink-600">
            Page {currentPage + 1} of {totalPages}
          </span>
          <span className="text-xs text-midnight-ink-400">
            ({allFeaturedTitles.length} total titles)
          </span>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              className="h-8 w-8 p-0 bg-white border-midnight-ink-200 hover:bg-white hover:border-hanok-teal-300 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              className="h-8 w-8 p-0 bg-white border-midnight-ink-200 hover:bg-white hover:border-hanok-teal-300 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Titles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
        {currentTitles.map((featured) => {
          const title = featured.titles;
          return (
            <Link key={featured.id} to={`/titles/${title.title_id}`} className="block">
              <Card className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col">
                <div className="aspect-[3/4] bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal-100 flex items-center justify-center relative overflow-hidden">
                  {title.pitch && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-hanok-teal text-white text-xs font-medium px-2 py-1 rounded-full shadow-md">
                        Pitch
                      </span>
                    </div>
                  )}
                  
                  {/* Featured Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-sunrise-coral text-white text-xs font-medium px-2 py-1 rounded-full shadow-md">
                      Featured
                    </span>
                  </div>
                  
                  {title.title_image ? (
                    <img 
                      src={title.title_image} 
                      alt={title.title_name_en || title.title_name_kr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-hanok-teal rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                          <div className="w-4 h-4 bg-hanok-teal rounded opacity-60"></div>
                        </div>
                      </div>
                      {!title.pitch && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-hanok-teal rounded-full"></div>
                      )}
                    </>
                  )}
                </div>
                <CardContent className="p-3 flex flex-col flex-grow">
                  <div className="flex-grow">
                    <h3 className="text-sm font-bold text-midnight-ink mb-1 line-clamp-2">
                      {title.title_name_en || title.title_name_kr}
                    </h3>
                    {title.title_name_en && title.title_name_kr && (
                      <p className="text-xs text-midnight-ink-500 mb-1 line-clamp-1">{title.title_name_kr}</p>
                    )}
                    <p className="text-xs text-midnight-ink-600 mb-2 line-clamp-2">
                      {title.tagline || title.pitch || 'Discover this amazing Korean story'}
                    </p>
                  </div>
                  {title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : true) && (
                    <div className="mt-auto">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(title.genre) ? (
                          title.genre.slice(0, 1).map((g, idx) => (
                            <div key={`${title.title_id}-card-genre-${idx}`} className="inline-block bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full text-xs font-medium">
                              {formatGenre(g)}
                            </div>
                          ))
                        ) : (
                          <div className="inline-block bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full text-xs font-medium">
                            {formatGenre(title.genre)}
                          </div>
                        )}
                        {Array.isArray(title.genre) && title.genre.length > 1 && (
                          <span className="text-xs text-gray-500">+{title.genre.length - 1}</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Bottom Navigation for Mobile */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-6 sm:mt-8 md:hidden">
          <Button
            variant="outline"
            onClick={goToPreviousPage}
            className="flex items-center space-x-2 px-4 py-2 bg-white border-midnight-ink-200 hover:bg-white hover:border-hanok-teal-300 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
          
          <span className="text-sm text-midnight-ink-600 px-4">
            {currentPage + 1} / {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={goToNextPage}
            className="flex items-center space-x-2 px-4 py-2 bg-white border-midnight-ink-200 hover:bg-white hover:border-hanok-teal-300 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FeaturedTitlesCarousel;