import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@kstorybridge/ui';
import { Menu, X } from 'lucide-react';
import { getDashboardUrl } from '../config/urls';
import LanguageSelector from './header/LanguageSelector';

const UniversalHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation('common');

  // Check if current page is in the nav
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Header with improved mobile padding */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          {/* Logo - text version */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
          >
            <span className="text-xl sm:text-2xl font-bold tracking-tight">
              <span className="text-black">K</span>
              <span className="text-hanok-teal">Story</span>
              <span className="text-black">Bridge</span>
            </span>
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
              {t('nav.creators').toUpperCase()}
            </button>
            <button
              onClick={() => navigate('/producers')}
              className={`font-medium transition-colors ${
                isActive('/producers')
                  ? 'text-hanok-teal'
                  : 'text-midnight-ink hover:text-hanok-teal'
              }`}
            >
              {t('nav.producers').toUpperCase()}
            </button>
            <button
              onClick={() => navigate('/about')}
              className={`font-medium transition-colors ${
                isActive('/about')
                  ? 'text-hanok-teal'
                  : 'text-midnight-ink hover:text-hanok-teal'
              }`}
            >
              {t('nav.about').toUpperCase()}
            </button>

            {/* Auth Buttons */}
            <Button
              className="border-2 border-hanok-teal text-hanok-teal bg-white hover:bg-hanok-teal hover:text-white px-6 py-2 rounded-full font-medium transition-colors"
              onClick={() => navigate('/signup')}
            >
              {t('cta.getStarted').toUpperCase()}
            </Button>

            {/* Language Selector */}
            <LanguageSelector />
          </div>
          
          {/* Mobile: Sign Up button + Language selector + menu button */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              className="border-2 border-hanok-teal text-hanok-teal bg-white hover:bg-hanok-teal hover:text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              onClick={() => navigate('/signup')}
            >
              {t('cta.signUp').toUpperCase()}
            </Button>
            <LanguageSelector />
            <button
              className="p-2 -mr-2 touch-manipulation"
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
                {t('nav.creators').toUpperCase()}
              </button>
              <button
                onClick={() => {
                  navigate('/producers');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left font-medium py-3 px-4 rounded-lg transition-colors ${
                  isActive('/producers')
                    ? 'bg-hanok-teal/10 text-hanok-teal'
                    : 'text-midnight-ink hover:bg-gray-50'
                }`}
              >
                {t('nav.producers').toUpperCase()}
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
                {t('nav.about').toUpperCase()}
              </button>
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