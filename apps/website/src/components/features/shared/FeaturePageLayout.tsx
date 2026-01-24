import { ReactNode } from 'react';
import UniversalHeader from '../../UniversalHeader';
import Footer from '../../Footer';

interface FeaturePageLayoutProps {
  children: ReactNode;
}

/**
 * FeaturePageLayout Component
 *
 * Shared layout wrapper for all feature promo pages.
 * Includes UniversalHeader and Footer with consistent styling.
 */
export function FeaturePageLayout({ children }: FeaturePageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default FeaturePageLayout;
