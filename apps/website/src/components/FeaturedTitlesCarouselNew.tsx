import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { featuredService, type FeaturedWithTitle } from '../services/featuredService';
import { 
  Grid,
  Stack,
  Card,
  Button,
  CardTitle,
  BodyText,
  Caption
} from '@/design-system';

interface FeaturedTitlesCarouselNewProps {
  className?: string;
}

const FeaturedTitlesCarouselNew = ({ className = "" }: FeaturedTitlesCarouselNewProps) => {
  const [allFeaturedTitles, setAllFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [titlesPerPage, setTitlesPerPage] = useState(6);
  
  // Calculate titles per page based on screen width - matching Grid component responsive behavior
  useEffect(() => {
    const calculateTitlesPerPage = () => {
      const width = window.innerWidth;
      // Assuming Grid component follows standard responsive pattern
      if (width < 768) {
        setTitlesPerPage(2); // mobile: 2 cols
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
      <div className={`text-center py-12 ${className}`}>
        <BodyText color="secondary">Loading featured titles...</BodyText>
      </div>
    );
  }

  if (allFeaturedTitles.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <BodyText color="secondary">No featured titles available.</BodyText>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Navigation and Pagination Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Caption>
            Page {currentPage + 1} of {totalPages}
          </Caption>
          <Caption color="secondary">
            ({allFeaturedTitles.length} total titles)
          </Caption>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousPage}
              className="h-8 w-8 flex items-center justify-center bg-white border border-midnight-ink-200 rounded hover:bg-white hover:border-hanok-teal-300 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={goToNextPage}
              className="h-8 w-8 flex items-center justify-center bg-white border border-midnight-ink-200 rounded hover:bg-white hover:border-hanok-teal-300 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Titles Grid */}
      <Grid cols={6} gap="lg" responsive>
        {currentTitles.map((featured) => {
          const title = featured.titles;
          return (
            <Card 
              key={featured.id} 
              variant="elevated"
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Title Image */}
              <div className="aspect-[3/4] bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal-100 flex items-center justify-center relative overflow-hidden">
                {title.title_image ? (
                  <img 
                    src={title.title_image} 
                    alt={title.title_name_en || title.title_name_kr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 bg-hanok-teal-500 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-lg opacity-80"></div>
                  </div>
                )}
                
                {/* Featured Badge */}
                <div className="absolute top-2 right-2 bg-sunrise-coral text-white text-xs px-2 py-1 rounded-full font-medium">
                  Featured
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <Stack spacing="sm">
                  <CardTitle className="line-clamp-2">
                    {title.title_name_en || title.title_name_kr}
                  </CardTitle>
                  
                  {title.title_name_en && title.title_name_kr && (
                    <Caption className="line-clamp-1">
                      {title.title_name_kr}
                    </Caption>
                  )}
                  
                  <BodyText size="sm" color="secondary" className="line-clamp-2">
                    {title.tagline || title.pitch || 'Discover this amazing Korean story'}
                  </BodyText>
                  
                  {title.genre && (
                    <div className="inline-flex">
                      <span className="bg-hanok-teal-100 text-hanok-teal-700 px-2 py-1 rounded-full text-xs font-medium">
                        {formatGenre(title.genre)}
                      </span>
                    </div>
                  )}
                </Stack>
              </div>
            </Card>
          );
        })}
      </Grid>

      {/* Bottom Navigation for Mobile */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-8 md:hidden">
          <button
            onClick={goToPreviousPage}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-midnight-ink-200 rounded hover:bg-white hover:border-hanok-teal-300 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          
          <Caption className="px-4">
            {currentPage + 1} / {totalPages}
          </Caption>
          
          <button
            onClick={goToNextPage}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-midnight-ink-200 rounded hover:bg-white hover:border-hanok-teal-300 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FeaturedTitlesCarouselNew;