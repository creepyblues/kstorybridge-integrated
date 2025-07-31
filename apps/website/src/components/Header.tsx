
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Logo from './header/Logo';
import Navigation from './header/Navigation';
import LanguageSelector from './header/LanguageSelector';
import AuthSection from './header/AuthSection';
import MobileMenu from './header/MobileMenu';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userProfile, signOut, isLoading, isRedirecting } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
      {/* DEBUG: Auth Status Banner */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-1 text-xs">
        <div className="container mx-auto">
          <strong>🔍 WEBSITE AUTH DEBUG:</strong>
          {' '}Loading: {isLoading?.toString() || 'undefined'}
          {' '}| Redirecting: {isRedirecting?.toString() || 'undefined'}
          {' '}| User: {user ? `${user.email} (${user.user_metadata?.account_type})` : 'None'}
          {' '}| Profile: {userProfile ? `${userProfile.invitation_status}` : 'None'}
          {' '}| Path: {window.location.pathname}
        </div>
      </div>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Navigation isLoggedIn={!!user} />
            <LanguageSelector />
            <AuthSection 
              user={user} 
              userProfile={userProfile} 
              onSignOut={signOut} 
            />
          </nav>

          <MobileMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-slide-up">
            <nav className="flex flex-col space-y-4">
              <Navigation 
                isLoggedIn={!!user} 
                isMobile={true} 
                onLinkClick={() => setIsMenuOpen(false)} 
              />
              <LanguageSelector isMobile={true} />
              <AuthSection 
                user={user} 
                userProfile={userProfile} 
                onSignOut={signOut} 
                isMobile={true} 
              />
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
