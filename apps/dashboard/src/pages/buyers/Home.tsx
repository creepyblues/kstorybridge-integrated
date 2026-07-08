import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { TypewriterText } from '@/components/home/TypewriterText';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { trackPageView, trackFeatureUsage, trackOnboardingStep } from '@/utils/analytics';
import { getTrialLastSearch } from '@/contexts/TrialContext';

export type HomeMode = 'default' | 'show-comp' | 'brief' | 'hot-now';

const WELCOME_DISMISSED_KEY = 'home_welcome_dismissed';

const TOOL_LABELS: Record<string, string> = {
  comps: 'Comps Navigator',
  mandates: 'Mandate Matcher',
  chat: 'AI Chat',
};

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFirstRun = searchParams.get('first_run') === '1';

  const trialSearch = useMemo(() => getTrialLastSearch(), []);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return !!localStorage.getItem(WELCOME_DISMISSED_KEY);
    } catch {
      return false;
    }
  });

  const showWelcomeBanner = !dismissed && (isFirstRun || !!trialSearch);

  // Track page view on mount
  useEffect(() => {
    trackPageView('/buyers/home', 'Home');
    trackFeatureUsage('home_page');
  }, []);

  useEffect(() => {
    if (showWelcomeBanner) {
      trackOnboardingStep(2, 'start');
    }
    // Fire once per mount when the banner is visible
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissBanner = () => {
    try {
      localStorage.setItem(WELCOME_DISMISSED_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const handleContinueTrialSearch = () => {
    if (!trialSearch) return;
    dismissBanner();
    navigate(trialSearch.path);
  };

  return (
    <BuyerLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Welcome / continue-where-you-left-off banner for new signups */}
          {showWelcomeBanner && (
            <div className="mb-8 rounded-2xl border border-hanok-teal/40 bg-hanok-teal/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-hanok-teal/10 flex items-center justify-center flex-shrink-0">
                <Icon icon="solar:confetti-bold-duotone" className="h-5 w-5 text-hanok-teal" />
              </div>
              <div className="flex-1 min-w-0">
                {trialSearch ? (
                  <>
                    <p className="font-semibold text-black">Pick up where you left off</p>
                    <p className="text-sm text-gray-600 truncate">
                      Your trial search in {TOOL_LABELS[trialSearch.tool]}: &ldquo;{trialSearch.label}&rdquo;
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-black">Welcome to KStoryBridge!</p>
                    <p className="text-sm text-gray-600">
                      Run your first search below — tell us a show you love, paste a brief, or ask the AI anything.
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {trialSearch && (
                  <Button
                    onClick={handleContinueTrialSearch}
                    className="bg-hanok-teal hover:bg-hanok-teal/90 text-white font-medium"
                  >
                    Continue search
                    <Icon icon="solar:arrow-right-bold-duotone" className="h-4 w-4 ml-2" aria-hidden="true" />
                  </Button>
                )}
                <button
                  onClick={dismissBanner}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Dismiss welcome banner"
                >
                  <Icon icon="solar:close-circle-bold-duotone" className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

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
