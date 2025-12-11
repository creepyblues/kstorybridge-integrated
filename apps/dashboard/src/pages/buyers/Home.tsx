import { useEffect } from 'react';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { trackPageView, trackFeatureUsage } from '@/utils/analytics';

export type HomeMode = 'default' | 'show-comp' | 'brief' | 'hot-now';

export default function Home() {
  // Track page view on mount
  useEffect(() => {
    trackPageView('/buyers/home', 'Home');
    trackFeatureUsage('home_page');
  }, []);

  return (
    <BuyerLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              Find Korean IP that fits your next show
              <br className="hidden md:block" />
              <span className="text-hanok-teal"> in under 60 seconds.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Tell us one show or brief, we'll pull matching Korean IP – with rights and adaptation notes.
            </p>
          </div>

          {/* Three Entry Points */}
          <HeroSection />
        </div>
      </div>
    </BuyerLayout>
  );
}
