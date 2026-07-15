import { ReactNode } from 'react';
import { Button } from '@kstorybridge/ui';
import { TypewriterText } from '../../TypewriterText';
import { getDashboardUrl } from '../../../config/urls';
import {
  trackSignupCtaClicked,
  trackTrialCtaClicked,
  type WebsiteFeature,
} from '../../../utils/analytics';

interface FeatureHeroProps {
  headline: string;
  subhead: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  storageKey: string;
  accentColor?: 'teal' | 'purple';
  featureName: WebsiteFeature;
  children: ReactNode; // Mini-demo slot
}

/**
 * FeatureHero Component
 *
 * Hero section for feature pages with:
 * - Typewriter headline animation
 * - Subhead text
 * - Primary and secondary CTAs
 * - Slot for mini-demo component
 */
export function FeatureHero({
  headline,
  subhead,
  primaryCtaText,
  secondaryCtaText,
  storageKey,
  featureName,
  accentColor = 'teal',
  children
}: FeatureHeroProps) {
  const colorClasses = {
    teal: {
      cursor: 'text-hanok-teal',
      primaryBtn: 'bg-hanok-teal hover:bg-hanok-teal-600 text-white hover:text-white',
      secondaryBtn: 'bg-sunrise-coral hover:bg-sunrise-coral-600 text-white hover:text-white border-sunrise-coral'
    },
    purple: {
      cursor: 'text-[#AF52DE]',
      primaryBtn: 'bg-[#AF52DE] hover:bg-[#9B47C4] text-white hover:text-white',
      secondaryBtn: 'bg-sunrise-coral hover:bg-sunrise-coral-600 text-white hover:text-white border-sunrise-coral'
    }
  };

  const colors = colorClasses[accentColor];

  return (
    <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Copy */}
          <div className="text-center lg:text-left">
            <div className="mb-6 sm:mb-8">
              <TypewriterText
                storageKey={storageKey}
                lines={[
                  {
                    text: headline,
                    className: 'text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight-ink leading-tight',
                  },
                  {
                    text: subhead,
                    className: 'text-lg sm:text-xl text-midnight-ink-600 leading-relaxed mt-4 sm:mt-6 block',
                    delay: 300,
                  },
                ]}
                cursorClassName={colors.cursor}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className={`${colors.primaryBtn} text-white px-8 py-4 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300`}
                onClick={() => {
                  trackTrialCtaClicked('hero', featureName);
                  window.location.href = `${getDashboardUrl()}/trial`;
                }}
              >
                {primaryCtaText}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`${colors.secondaryBtn} px-8 py-4 text-base sm:text-lg rounded-full font-medium transition-all duration-300`}
                onClick={() => {
                  trackSignupCtaClicked('hero', featureName);
                  window.location.href = `${getDashboardUrl()}/signup`;
                }}
              >
                {secondaryCtaText}
              </Button>
            </div>
          </div>

          {/* Right: Mini-Demo Slot */}
          <div className="bg-gradient-to-br from-hanok-teal/10 to-porcelain-blue-100 rounded-2xl p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureHero;
