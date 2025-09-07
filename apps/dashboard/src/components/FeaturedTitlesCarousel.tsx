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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  const totalTitles = allFeaturedTitles.length;

  const goToPreviousPage = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalTitles - 1));
  };

  const goToNextPage = () => {
    setCurrentIndex(prev => (prev < totalTitles - 1 ? prev + 1 : 0));
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

      {/* Horizontal Featured Card */}
      <div className="relative max-w-7xl mx-auto">
        {/* Navigation Arrows - Desktop */}
        {totalTitles > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousPage}
              className="absolute -left-6 top-1/2 transform -translate-y-1/2 z-10 h-12 w-12 p-0 bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-full hover:bg-white hover:scale-110 transition-all duration-300 hidden md:flex items-center justify-center"
              aria-label="Previous featured title"
            >
              <ChevronLeft className="h-6 w-6 text-hanok-teal" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              className="absolute -right-6 top-1/2 transform -translate-y-1/2 z-10 h-12 w-12 p-0 bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-full hover:bg-white hover:scale-110 transition-all duration-300 hidden md:flex items-center justify-center"
              aria-label="Next featured title"
            >
              <ChevronRight className="h-6 w-6 text-hanok-teal" />
            </Button>
          </>
        )}

        {/* Scrollable container for mobile, single title for desktop */}
        <div className="overflow-x-auto scrollbar-hide md:overflow-visible">
          <div className="flex md:block space-x-4 md:space-x-0 px-4 md:px-12">
            {/* Mobile: Show all titles for horizontal scroll, Desktop: Show current title only */}
            {(isMobile ? allFeaturedTitles : allFeaturedTitles.slice(currentIndex, currentIndex + 1)).map((featured) => {
              const title = featured.titles;
              return (
                <Card key={featured.id} className="flex-shrink-0 w-80 sm:w-96 md:w-auto h-[34rem] md:h-96 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden">
                  <Link to={`/titles/${title.title_id}`}>
                    <CardContent className="p-0 flex flex-col md:flex-row h-full">
                      {/* Left Section - Image and Badges */}
                      <div className="relative w-full h-96 md:w-[30%] md:h-full bg-gray-100 overflow-hidden">
                        {title.title_image ? (
                          <img 
                            src={title.title_image} 
                            alt={title.title_name_en || title.title_name_kr}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-midnight-ink-400">
                            <div className="text-center">
                              <div className="text-4xl mb-4">📚</div>
                              <div className="text-lg font-medium">Featured Story</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {title.pitch && title.pitch.trim() && (
                            <div className="px-3 py-1.5 rounded-full shadow-lg text-white text-sm font-medium" style={{backgroundColor: '#FF6B6B'}}>
                              Pitch Available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Section - Title Details */}
                      <div className="flex-1 md:w-[70%] p-3 md:p-6 lg:p-8 flex flex-col justify-between">
                        <div className="flex-1">
                          {/* Title Section - Fixed Height */}
                          <div className="h-[4.5rem] md:h-[6rem] mb-2 md:mb-3 flex flex-col justify-start overflow-hidden">
                            <h2 className="text-base md:text-xl lg:text-2xl font-bold text-midnight-ink mb-1 md:mb-2 line-clamp-2 group-hover:text-hanok-teal transition-colors duration-300 leading-tight">
                              {title.title_name_en || title.title_name_kr}
                            </h2>
                            
                            {title.title_name_en && title.title_name_kr && (
                              <p className="text-sm md:text-base text-midnight-ink-500 line-clamp-1 font-medium leading-tight">
                                {title.title_name_kr}
                              </p>
                            )}
                          </div>

                          {/* Horizontal divider */}
                          <div className="w-full h-px bg-gray-300 mb-3"></div>

                          {/* Note Section - Fixed Height */}
                          <div className="h-[3rem] mb-3 flex items-start overflow-hidden">
                            {featured.note ? (
                              <div className="w-full p-2 md:p-3 bg-red-50 border-l-4 border-r-4 rounded-lg overflow-hidden" style={{borderColor: '#FF6B6B'}}>
                                <p className="text-xs md:text-sm italic leading-tight line-clamp-2 overflow-hidden" style={{color: '#FF6B6B'}}>
                                  "{featured.note}"
                                </p>
                              </div>
                            ) : (
                              <div className="w-full"></div>
                            )}
                          </div>

                          {/* Synopsis Section - More Lines */}
                          <div className="flex-1 flex items-start overflow-hidden mb-3">
                            {title.synopsis ? (
                              <p className="text-xs md:text-sm text-midnight-ink-600 line-clamp-4 leading-relaxed font-light overflow-hidden">
                                {title.synopsis}
                              </p>
                            ) : (
                              <div></div>
                            )}
                          </div>
                        </div>

                        {/* Tags Section - Always at Bottom */}
                        <div className="h-[4rem] flex flex-wrap items-end gap-1 overflow-hidden mt-auto">
                          {/* Genre badges */}
                          {title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : true) && (
                            <>
                              {Array.isArray(title.genre) ? (
                                title.genre.slice(0, 2).map((g, idx) => (
                                  <div key={`${title.title_id}-genre-${idx}`} className="inline-block bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs font-medium border border-cyan-200">
                                    {formatGenre(g)}
                                  </div>
                                ))
                              ) : (
                                <div className="inline-block bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs font-medium border border-cyan-200">
                                  {formatGenre(title.genre)}
                                </div>
                              )}
                              {Array.isArray(title.genre) && title.genre.length > 2 && (
                                <span className="text-xs text-midnight-ink-400 font-medium">+{title.genre.length - 2}</span>
                              )}
                            </>
                          )}

                          {/* Tone badge */}
                          {title.tone && (
                            <div className="inline-block bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-2 py-1 rounded-md text-xs font-medium border border-purple-200">
                              {title.tone}
                            </div>
                          )}

                          {/* Comps badges */}
                          {title.comps && title.comps.length > 0 && (
                            <>
                              {title.comps.slice(0, 2).map((comp, idx) => (
                                <div key={`${title.title_id}-comp-${idx}`} className="inline-block bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 px-2 py-1 rounded-md text-xs font-medium border border-emerald-200">
                                  {comp}
                                </div>
                              ))}
                              {title.comps.length > 2 && (
                                <span className="text-xs text-midnight-ink-400 font-medium">+{title.comps.length - 2}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

export default FeaturedTitlesCarousel;