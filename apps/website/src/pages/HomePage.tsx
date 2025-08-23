import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@kstorybridge/ui';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight } from 'lucide-react';
import UniversalHeader from '../components/UniversalHeader';
import FeaturedTitlesCarousel from '../components/FeaturedTitlesCarousel';
import { useAuth } from '../hooks/useAuth';
import Footer from '../components/Footer';

const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Add authentication hook to handle redirects
  const { user, userProfile, isLoading, isRedirecting } = useAuth();

  // Check for invitation links that might land on homepage
  useEffect(() => {
    const checkForInvitationLink = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Check both URL and hash parameters for invitation indicators
      const type = urlParams.get('type') || hashParams.get('type');
      const inviteToken = urlParams.get('invite_token') || hashParams.get('invite_token');
      const invitationToken = urlParams.get('invitation_token') || hashParams.get('invitation_token');
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      
      console.log('🔍 HOMEPAGE: Checking for invitation parameters');
      console.log('🔍 HOMEPAGE: Full URL:', window.location.href);
      console.log('🔍 HOMEPAGE: Search params:', window.location.search);
      console.log('🔍 HOMEPAGE: Hash:', window.location.hash);
      console.log('🔍 HOMEPAGE: Type:', type);
      console.log('🔍 HOMEPAGE: Invite token:', inviteToken ? 'present' : 'not present');
      console.log('🔍 HOMEPAGE: Invitation token:', invitationToken ? 'present' : 'not present');
      console.log('🔍 HOMEPAGE: Access token:', accessToken ? 'present' : 'not present');
      console.log('🔍 HOMEPAGE: Refresh token:', refreshToken ? 'present' : 'not present');
      
      // If we have auth tokens (which suggest this is from an invitation link)
      // or explicit invitation parameters, redirect to invitation acceptance
      if (type === 'invite' || type === 'invitation' || 
          inviteToken || invitationToken ||
          (accessToken && refreshToken)) {
        console.log('🎯 HOMEPAGE: Invitation/auth parameters detected, redirecting to invitation setup');
        navigate('/invitation/accept');
        return;
      }
    };

    // Run the check immediately
    checkForInvitationLink();
  }, [navigate]);

  const handleTitleClick = (titleId: string) => {
    navigate(`/title/${titleId}`);
  };

  // Temporary debug helper - show invitation parameters
  const getDebugInfo = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    return {
      url: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      type: urlParams.get('type') || hashParams.get('type'),
      inviteToken: urlParams.get('invite_token') || hashParams.get('invite_token'),
      invitationToken: urlParams.get('invitation_token') || hashParams.get('invitation_token'),
      accessToken: urlParams.get('access_token') || hashParams.get('access_token'),
      refreshToken: urlParams.get('refresh_token') || hashParams.get('refresh_token'),
    };
  };

  const debugInfo = getDebugInfo();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      
      {/* Temporary Debug Panel - only show if there are URL parameters */}
      {(debugInfo.search || debugInfo.hash) && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Debug: Invitation Link Detection
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p><strong>URL:</strong> {debugInfo.url}</p>
                <p><strong>Search:</strong> {debugInfo.search || 'none'}</p>
                <p><strong>Hash:</strong> {debugInfo.hash || 'none'}</p>
                <p><strong>Type:</strong> {debugInfo.type || 'none'}</p>
                <p><strong>Tokens:</strong> {[
                  debugInfo.inviteToken && 'invite_token',
                  debugInfo.invitationToken && 'invitation_token', 
                  debugInfo.accessToken && 'access_token',
                  debugInfo.refreshToken && 'refresh_token'
                ].filter(Boolean).join(', ') || 'none'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <UniversalHeader />


      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-midnight-ink leading-tight">
                Where Korean Stories Meet Global Screens
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-midnight-ink-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                KStoryBridge gives studios first-look access to Korea's next breakout hit, while creators keep control and capture more upside.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button 
                id="homepage-creator-btn"
                size="lg"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full font-medium w-full sm:w-auto"
                onClick={() => navigate('/creators')}
              >
                I'M A CREATOR
              </Button>
              <Button 
                id="homepage-buyer-btn"
                size="lg"
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full font-medium w-full sm:w-auto"
                onClick={() => navigate('/buyers')}
              >
                I'M A BUYER
              </Button>
            </div>
          </div>
          
          <div className="relative order-first lg:order-last">
            <div className="relative z-10">
              {/* Hero Illustration */}
              <div className="w-full max-w-md lg:max-w-lg mx-auto">
                <img 
                  src="/hero-illustration.svg" 
                  alt="Korean content streaming across devices"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Titles Section */}
      <div className="bg-porcelain-blue-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-8 sm:mb-12 text-center lg:text-left">FEATURED TITLES</h2>
          
          <FeaturedTitlesCarousel 
            onTitleClick={handleTitleClick}
            className=""
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;