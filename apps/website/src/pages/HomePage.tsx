import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Star, Menu, X } from 'lucide-react';
import { featuredService, type FeaturedWithTitle } from '../services/featuredService';
import { useAuth } from '../hooks/useAuth';

const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [featuredTitles, setFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Add authentication hook to handle redirects
  const { user, userProfile, isLoading, isRedirecting } = useAuth();

  useEffect(() => {
    const loadFeaturedTitles = async () => {
      try {
        setLoading(true);
        const titles = await featuredService.getFeaturedTitles();
        setFeaturedTitles(titles);
      } catch (error) {
        console.error('Error loading featured titles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedTitles();
  }, []);

  const formatGenre = (genre: string | null) => {
    if (!genre) return '';
    return genre.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center">
          <img 
            src="/logo-new-teal.png" 
            alt="KStoryBridge" 
            className="h-10 w-auto cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => navigate('/creators')}
            className="text-midnight-ink font-medium hover:text-hanok-teal transition-colors"
          >
            CREATORS
          </button>
          <button 
            onClick={() => navigate('/buyers')}
            className="text-midnight-ink font-medium hover:text-hanok-teal transition-colors"
          >
            BUYERS
          </button>
          <button 
            onClick={() => navigate('/about')}
            className="text-midnight-ink font-medium hover:text-hanok-teal transition-colors"
          >
            ABOUT
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Desktop Sign In/Up buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline"
              className="border-2 border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-white px-6 py-2 rounded-full font-medium transition-colors"
              onClick={() => navigate('/signin')}
            >
              SIGN IN
            </Button>
            <Button 
              className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-6 py-2 rounded-full font-medium"
              onClick={() => navigate('/signup')}
            >
              SIGN UP
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-midnight-ink" />
            ) : (
              <Menu className="h-6 w-6 text-midnight-ink" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-porcelain-blue-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
            <button 
              onClick={() => {
                navigate('/creators');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-midnight-ink font-medium hover:text-hanok-teal transition-colors py-2"
            >
              CREATORS
            </button>
            <button 
              onClick={() => {
                navigate('/buyers');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-midnight-ink font-medium hover:text-hanok-teal transition-colors py-2"
            >
              BUYERS
            </button>
            <button 
              onClick={() => {
                navigate('/about');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-midnight-ink font-medium hover:text-hanok-teal transition-colors py-2"
            >
              ABOUT
            </button>
            
            {/* Mobile Sign In/Up buttons */}
            <div className="pt-4 border-t border-porcelain-blue-200 space-y-3">
              <Button 
                variant="outline"
                className="w-full border-2 border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-white py-2 rounded-full font-medium transition-colors"
                onClick={() => {
                  navigate('/signin');
                  setMobileMenuOpen(false);
                }}
              >
                SIGN IN
              </Button>
              <Button 
                className="w-full bg-sunrise-coral hover:bg-sunrise-coral-600 text-white py-2 rounded-full font-medium"
                onClick={() => {
                  navigate('/signup');
                  setMobileMenuOpen(false);
                }}
              >
                SIGN UP
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight">
                Where Korean Stories Meet Global Screens
              </h1>
              <p className="text-xl text-midnight-ink-600 leading-relaxed max-w-lg">
                KStoryBridge gives studios first-look access to Korea's next breakout hit, while creators keep control and capture more upside.
              </p>
            </div>
            
            <Button 
              size="lg"
              className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-4 text-lg rounded-full font-medium"
              onClick={() => navigate('/signup')}
            >
              BROWSE NOW
            </Button>
          </div>
          
          <div className="relative">
            <div className="relative z-10">
              {/* Character Illustration */}
              <div className="w-full max-w-md mx-auto">
                <div className="relative">
                  {/* Character */}
                  <div className="bg-gradient-to-br from-sunrise-coral-100 to-sunrise-coral-200 rounded-full w-80 h-80 mx-auto flex items-center justify-center relative overflow-hidden">
                    {/* Simple character illustration */}
                    <div className="text-8xl">📚</div>
                    <div className="absolute top-16 right-16 text-4xl animate-pulse">✨</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Titles Section */}
      <div className="bg-porcelain-blue-200 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-midnight-ink mb-12">FEATURED TITLES</h2>
          
          {loading ? (
            <div className="text-center text-midnight-ink-600 py-8">Loading featured titles...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {featuredTitles.map((featured) => {
                const title = featured.titles;
                return (
                  <Card key={featured.id} className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                    onClick={() => navigate(`/title/${title.title_id}`)}>
                    <div className="aspect-[3/4] bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal-100 flex items-center justify-center relative overflow-hidden">
                      {title.title_image ? (
                        <img 
                          src={title.title_image} 
                          alt={title.title_name_en || title.title_name_kr}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <>
                          {/* Placeholder illustration */}
                          <div className="w-12 h-12 bg-hanok-teal rounded-full flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                              <div className="w-4 h-4 bg-hanok-teal rounded opacity-60"></div>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 w-3 h-3 bg-hanok-teal rounded-full"></div>
                        </>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="text-sm font-bold text-midnight-ink mb-1 line-clamp-2">
                        {title.title_name_en || title.title_name_kr}
                      </h3>
                      {title.title_name_en && title.title_name_kr && (
                        <p className="text-xs text-midnight-ink-500 mb-1 line-clamp-1">{title.title_name_kr}</p>
                      )}
                      <p className="text-xs text-midnight-ink-600 mb-2 line-clamp-2">
                        {title.tagline || title.pitch || 'Discover this amazing Korean story'}
                      </p>
                      {title.genre && (
                        <div className="inline-block bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full text-xs font-medium">
                          {formatGenre(title.genre)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          {!loading && featuredTitles.length === 0 && (
            <div className="text-center text-midnight-ink-600 py-8">No featured titles available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;