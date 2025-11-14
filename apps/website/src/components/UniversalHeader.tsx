import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Menu, X } from 'lucide-react';
import { getDashboardUrl } from '../config/urls';

const UniversalHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current page is in the nav
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Header with improved mobile padding */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          {/* Logo - smaller on mobile */}
          <div className="flex items-center">
            <img 
              src="/logo-new-teal.png" 
              alt="KStoryBridge" 
              className="h-8 sm:h-10 w-auto cursor-pointer"
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
              }}
            />
          </div>
          
          {/* Desktop Navigation and Auth Buttons */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => navigate('/creators')}
              className={`font-medium transition-colors ${
                isActive('/creators') 
                  ? 'text-hanok-teal' 
                  : 'text-midnight-ink hover:text-hanok-teal'
              }`}
            >
              CREATORS
            </button>
            <button 
              onClick={() => navigate('/buyers')}
              className={`font-medium transition-colors ${
                isActive('/buyers') 
                  ? 'text-hanok-teal' 
                  : 'text-midnight-ink hover:text-hanok-teal'
              }`}
            >
              BUYERS
            </button>
            <button 
              onClick={() => navigate('/news')}
              className={`font-medium transition-colors ${
                isActive('/news') 
                  ? 'text-hanok-teal' 
                  : 'text-midnight-ink hover:text-hanok-teal'
              }`}
            >
              NEWS
            </button>
            <button
              onClick={() => navigate('/about')}
              className={`font-medium transition-colors ${
                isActive('/about')
                  ? 'text-hanok-teal'
                  : 'text-midnight-ink hover:text-hanok-teal'
              }`}
            >
              ABOUT
            </button>
            {/* Pricing link hidden per requirements
            <button
              onClick={() => navigate('/creators/pricing')}
              className={`font-medium transition-colors ${
                isActive('/creators/pricing') || isActive('/pricing')
                  ? 'text-hanok-teal'
                  : 'text-midnight-ink hover:text-hanok-teal'
              }`}
            >
              PRICING
            </button>
            */}

            {/* Auth Buttons */}
            <Button
              className="border-2 border-hanok-teal text-hanok-teal bg-white hover:bg-hanok-teal hover:text-white px-6 py-2 rounded-full font-medium transition-colors"
              onClick={() => navigate('/signin')}
            >
              GET STARTED
            </Button>
          </div>
          
          {/* Mobile menu button - improved touch target */}
          <button
            className="md:hidden p-2 -mr-2 touch-manipulation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-midnight-ink" />
            ) : (
              <Menu className="h-6 w-6 text-midnight-ink" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu - Full screen for better UX */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bottom-0 bg-white z-40 overflow-y-auto">
          <div className="px-4 py-6 space-y-6">
            {/* Navigation Links */}
            <div className="space-y-1">
              <button 
                onClick={() => {
                  navigate('/creators');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left font-medium py-3 px-4 rounded-lg transition-colors ${
                  isActive('/creators')
                    ? 'bg-hanok-teal/10 text-hanok-teal'
                    : 'text-midnight-ink hover:bg-gray-50'
                }`}
              >
                CREATORS
              </button>
              <button 
                onClick={() => {
                  navigate('/buyers');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left font-medium py-3 px-4 rounded-lg transition-colors ${
                  isActive('/buyers')
                    ? 'bg-hanok-teal/10 text-hanok-teal'
                    : 'text-midnight-ink hover:bg-gray-50'
                }`}
              >
                BUYERS
              </button>
              <button 
                onClick={() => {
                  navigate('/news');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left font-medium py-3 px-4 rounded-lg transition-colors ${
                  isActive('/news')
                    ? 'bg-hanok-teal/10 text-hanok-teal'
                    : 'text-midnight-ink hover:bg-gray-50'
                }`}
              >
                NEWS
              </button>
              <button
                onClick={() => {
                  navigate('/about');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left font-medium py-3 px-4 rounded-lg transition-colors ${
                  isActive('/about')
                    ? 'bg-hanok-teal/10 text-hanok-teal'
                    : 'text-midnight-ink hover:bg-gray-50'
                }`}
              >
                ABOUT
              </button>
              {/* Pricing link hidden per requirements
              <button
                onClick={() => {
                  navigate('/creators/pricing');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left font-medium py-3 px-4 rounded-lg transition-colors ${
                  isActive('/creators/pricing') || isActive('/pricing')
                    ? 'bg-hanok-teal/10 text-hanok-teal'
                    : 'text-midnight-ink hover:bg-gray-50'
                }`}
              >
                PRICING
              </button>
              */}
            </div>

            {/* Auth Buttons - Full width on mobile */}
            <div className="pt-6 border-t border-gray-200 space-y-3">
              <Button
                className="w-full border-2 border-hanok-teal text-hanok-teal bg-white hover:bg-hanok-teal hover:text-white px-6 py-3 rounded-full font-medium transition-colors"
                onClick={() => {
                  navigate('/signin');
                  setMobileMenuOpen(false);
                }}
              >
                GET STARTED
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-30 top-[65px]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default UniversalHeader;