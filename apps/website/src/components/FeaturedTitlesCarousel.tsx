import { useState, useEffect } from 'react';
import { Card, CardContent } from '@kstorybridge/ui';
import { Button } from '@kstorybridge/ui';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { featuredService, type FeaturedWithTitle } from '../services/featuredService';

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
      // Match the actual grid CSS: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6
      if (width < 768) {
        setTitlesPerPage(2); // default: 2 cols
      } else if (width < 1024) {
        setTitlesPerPage(3); // md: 3 cols (768px+)
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

  // Links removed - cards are now display-only

  if (loading) {
    return (
      <div className={`text-center text-midnight-ink-600 py-8 ${className}`}>
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
      <div className="flex items-center justify-between mb-6">
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {currentTitles.map((featured) => {
          const title = featured.titles;
          return (
            <Card 
              key={featured.id} 
              className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col"
            >
              <div className="aspect-[3/4] bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal-100 flex items-center justify-center relative overflow-hidden">
                {title.title_image ? (
                  <img 
                    src={title.title_image} 
                    alt={title.title_name_en || title.title_name_kr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Star className="w-8 h-8 text-hanok-teal mx-auto mb-2" />
                    <p className="text-xs text-midnight-ink-600 leading-tight">
                      {title.title_name_en || title.title_name_kr}
                    </p>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-midnight-ink text-sm mb-2 line-clamp-2 flex-1">
                  {title.title_name_en || title.title_name_kr}
                </h3>
                
                {title.story_author && (
                  <p className="text-xs text-midnight-ink-600 mb-2">
                    by {title.story_author}
                  </p>
                )}
                
                {title.genre && (
                  <p className="text-xs text-hanok-teal font-medium mb-2">
                    {formatGenre(title.genre)}
                  </p>
                )}
                
                {title.tagline && (
                  <p className="text-xs text-midnight-ink-500 italic line-clamp-2">
                    {title.tagline}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Navigation for Mobile */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-8 md:hidden">
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