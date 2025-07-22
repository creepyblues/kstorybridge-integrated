import React from 'react';
import Header from './Header';
import Footer from './Footer';
import KoreanPattern from './KoreanPattern';

interface PageLayoutProps {
  children: React.ReactNode;
  background?: 'white' | 'gray' | 'gradient';
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  background = 'white',
  className = '' 
}) => {
  const getBackgroundClasses = () => {
    switch (background) {
      case 'gray':
        return 'bg-gray-50';
      case 'gradient':
        return 'bg-gradient-to-br from-blue-50 via-white to-purple-50';
      default:
        return 'bg-white';
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundClasses()} ${className}`}>
      <Header />
      <main className="relative">
        {background === 'gradient' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <KoreanPattern />
          </div>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;