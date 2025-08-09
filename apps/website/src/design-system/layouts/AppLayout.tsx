/**
 * Main Application Layout
 * Professional, consistent layout wrapper for all pages
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
  
  // Layout options
  variant?: 'default' | 'centered' | 'wide';
  background?: 'white' | 'muted' | 'gradient';
  
  // Header options
  headerVariant?: 'default' | 'transparent' | 'minimal';
  showHeader?: boolean;
  
  // Footer options
  showFooter?: boolean;
  footerVariant?: 'default' | 'minimal';
  
  // Page metadata
  title?: string;
  description?: string;
  
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  variant = 'default',
  background = 'white',
  headerVariant = 'default',
  showHeader = true,
  showFooter = true,
  footerVariant = 'default',
  title,
  description,
  className,
}) => {
  // Set document title if provided
  React.useEffect(() => {
    if (title) {
      document.title = title.includes('KStoryBridge') ? title : `${title} | KStoryBridge`;
    }
  }, [title]);

  // Set meta description if provided
  React.useEffect(() => {
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }
  }, [description]);

  const backgroundClasses = {
    white: 'bg-white',
    muted: 'bg-porcelain-blue-50',
    gradient: 'bg-gradient-to-br from-porcelain-blue-50 via-white to-hanok-teal-50',
  };

  const variantClasses = {
    default: 'min-h-screen',
    centered: 'min-h-screen flex flex-col',
    wide: 'min-h-screen w-full',
  };

  return (
    <div className={cn(
      variantClasses[variant],
      backgroundClasses[background],
      className
    )}>
      {showHeader && (
        <Header variant={headerVariant} />
      )}
      
      <main className={cn(
        'flex-1',
        variant === 'centered' && 'flex flex-col justify-center'
      )}>
        {children}
      </main>
      
      {showFooter && (
        <Footer variant={footerVariant} />
      )}
    </div>
  );
};

// Page-specific layout variants
export const LandingLayout: React.FC<Omit<AppLayoutProps, 'variant' | 'background'>> = (props) => (
  <AppLayout
    variant="default"
    background="gradient" 
    headerVariant="transparent"
    {...props}
  />
);

export const ContentLayout: React.FC<Omit<AppLayoutProps, 'variant'>> = (props) => (
  <AppLayout
    variant="default"
    {...props}
  />
);

export const CenteredLayout: React.FC<Omit<AppLayoutProps, 'variant' | 'background'>> = (props) => (
  <AppLayout
    variant="centered"
    background="muted"
    headerVariant="minimal"
    footerVariant="minimal"
    {...props}
  />
);