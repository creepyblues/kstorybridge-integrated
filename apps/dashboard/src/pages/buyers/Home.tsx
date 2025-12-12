import { useEffect } from 'react';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { TypewriterText } from '@/components/home/TypewriterText';
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
          {/* Hero Section with Typewriter Effect */}
          <div className="text-center mb-12">
            <div className="mb-4">
              <TypewriterText
                storageKey="home-hero-played"
                lines={[
                  {
                    text: 'Find Korean IP that fits your next show',
                    className: 'text-3xl md:text-4xl lg:text-5xl font-bold text-black',
                  },
                  {
                    text: ' in under 60 seconds.',
                    className: 'text-3xl md:text-4xl lg:text-5xl font-bold text-hanok-teal',
                    delay: 0,
                  },
                  {
                    text: 'Tell us one show or brief, we\'ll pull matching Korean IP – with rights and adaptation notes.',
                    className: 'text-lg md:text-xl text-gray-600 max-w-2xl mx-auto block mt-4',
                    delay: 400,
                  },
                ]}
                cursorClassName="text-hanok-teal"
              />
            </div>
          </div>

          {/* Three Entry Points */}
          <HeroSection />
        </div>
      </div>
    </BuyerLayout>
  );
}
