import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Menu, X } from 'lucide-react';
import { getDashboardUrl } from '../config/urls';

const PageHeader = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
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
            id="pageheader-nav-creators-btn"
            onClick={() => navigate('/creators')}
            className="text-midnight-ink font-medium hover:text-hanok-teal transition-colors"
          >
            CREATORS
          </button>
          <button 
            id="pageheader-nav-buyers-btn"
            onClick={() => navigate('/buyers')}
            className="text-midnight-ink font-medium hover:text-hanok-teal transition-colors"
          >
            BUYERS
          </button>
          <button 
            id="pageheader-nav-about-btn"
            onClick={() => navigate('/about')}
            className="text-midnight-ink font-medium hover:text-hanok-teal transition-colors"
          >
            ABOUT
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Desktop Sign In button */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              id="pageheader-signin-btn"
              className="border-2 border-hanok-teal text-hanok-teal bg-white hover:bg-hanok-teal hover:text-white px-6 py-2 rounded-full font-medium transition-colors"
              onClick={() => window.location.href = `${getDashboardUrl()}/signin`}
            >
              SIGN IN
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <button
            id="pageheader-mobile-menu-toggle-btn"
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
              id="pageheader-mobile-creators-btn"
              onClick={() => {
                navigate('/creators');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-midnight-ink font-medium hover:text-hanok-teal transition-colors py-2"
            >
              CREATORS
            </button>
            <button 
              id="pageheader-mobile-buyers-btn"
              onClick={() => {
                navigate('/buyers');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-midnight-ink font-medium hover:text-hanok-teal transition-colors py-2"
            >
              BUYERS
            </button>
            <button 
              id="pageheader-mobile-about-btn"
              onClick={() => {
                navigate('/about');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-midnight-ink font-medium hover:text-hanok-teal transition-colors py-2"
            >
              ABOUT
            </button>
            <div className="pt-4 border-t border-porcelain-blue-200 space-y-3">
              <Button 
                id="pageheader-mobile-signin-btn"
                className="w-full border-2 border-hanok-teal text-hanok-teal bg-white hover:bg-hanok-teal hover:text-white px-6 py-3 rounded-full font-medium transition-colors"
                onClick={() => {
                  window.location.href = `${getDashboardUrl()}/signin`;
                  setMobileMenuOpen(false);
                }}
              >
                SIGN IN
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PageHeader;