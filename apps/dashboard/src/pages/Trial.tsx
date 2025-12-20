/**
 * Trial Page
 *
 * Main trial experience page for anonymous users.
 * Features 3 discovery tools: Comps Navigator, Mandate Matcher, AI Chatbot
 * Limits AI searches to 3 total via TrialContext.
 *
 * Design: Following website app patterns
 * - Hero: Multi-line typewriter (from CreatorsPage)
 * - Selection: Glassmorphism card with clickable feature cards (from HomePage trialPromo)
 */

import { useState, useEffect } from 'react';
import { TrialLayout } from '@/components/layout/TrialLayout';
import { TrialLimitModal } from '@/components/trial/TrialLimitModal';
import { TrialCompsSection } from '@/components/trial/TrialCompsSection';
import { TrialMandatesSection } from '@/components/trial/TrialMandatesSection';
import { TrialChatSection } from '@/components/trial/TrialChatSection';
import { TypewriterText } from '@/components/home/TypewriterText';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useTrial } from '@/contexts/TrialContext';
import { trackTrialPageView, trackTrialToolSelected } from '@/utils/analytics';

type ActiveTab = 'comps' | 'mandates' | 'chat';

export default function Trial() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('comps');
  const { remainingTrials } = useTrial();

  // Track page view on mount
  useEffect(() => {
    trackTrialPageView(remainingTrials);
  }, []); // Only track once on mount

  // Handle tool selection with tracking
  const handleToolSelect = (tool: ActiveTab) => {
    if (tool !== activeTab) {
      trackTrialToolSelected(tool, remainingTrials);
      setActiveTab(tool);
    }
  };

  return (
    <TrialLayout>
      <div className="space-y-6 sm:space-y-8">

        {/* Hero Section - following CreatorsPage design */}
        <section className="relative py-6 sm:py-10 lg:py-12 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center px-4">
            <div className="mb-4 sm:mb-6">
              <TypewriterText
                storageKey="trial-hero-played"
                lines={[
                  {
                    text: "Discover Korean Stories",
                    className: "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight",
                  },
                  {
                    text: "Search up to 5 times for free, then sign up to unlock unlimited access.",
                    className: "text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto block mt-3 sm:mt-4",
                    delay: 400,
                  },
                ]}
                cursorClassName="text-hanok-teal"
              />
            </div>
          </div>
        </section>

        {/* Feature Selection - following HomePage glassmorphism design */}
        <section className="py-4 sm:py-6">
          <div className="max-w-4xl mx-auto px-2 sm:px-4">
            {/* Glassmorphism Card Container */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8">

              <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
                Click a card to start exploring Korean IP
              </p>

              {/* 3 Feature Cards Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">

                {/* Card 1: Comps Navigator */}
                <div
                  onClick={() => handleToolSelect('comps')}
                  className={cn(
                    "group p-2 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200",
                    activeTab === 'comps'
                      ? "bg-hanok-teal/10 border-2 border-hanok-teal shadow-sm"
                      : "hover:bg-white/50 border-2 border-transparent"
                  )}
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-hanok-teal/10 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-3">
                    <Icon icon="solar:compass-bold-duotone" className="h-5 w-5 sm:h-7 sm:w-7 text-hanok-teal" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center text-xs sm:text-base">Comps<br className="sm:hidden" /> Navigator</h3>
                </div>

                {/* Card 2: Mandate Matcher */}
                <div
                  onClick={() => handleToolSelect('mandates')}
                  className={cn(
                    "group p-2 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200",
                    activeTab === 'mandates'
                      ? "bg-purple-50 border-2 border-purple-500 shadow-sm"
                      : "hover:bg-white/50 border-2 border-transparent"
                  )}
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-purple-500/10 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-3">
                    <Icon icon="solar:stars-bold-duotone" className="h-5 w-5 sm:h-7 sm:w-7 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center text-xs sm:text-base">Mandate<br className="sm:hidden" /> Matcher</h3>
                </div>

                {/* Card 3: AI Chatbot */}
                <div
                  onClick={() => handleToolSelect('chat')}
                  className={cn(
                    "group p-2 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200",
                    activeTab === 'chat'
                      ? "bg-blue-50 border-2 border-blue-500 shadow-sm"
                      : "hover:bg-white/50 border-2 border-transparent"
                  )}
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-500/10 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-3">
                    <Icon icon="solar:chat-round-dots-bold-duotone" className="h-5 w-5 sm:h-7 sm:w-7 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center text-xs sm:text-base">AI<br className="sm:hidden" /> Chatbot</h3>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Content Section - Show based on activeTab */}
        <section className="py-2 sm:py-4">
          <div className="max-w-4xl mx-auto px-2 sm:px-4">
            {activeTab === 'comps' && <TrialCompsSection />}
            {activeTab === 'mandates' && <TrialMandatesSection />}
            {activeTab === 'chat' && <TrialChatSection />}
          </div>
        </section>

      </div>

      {/* Limit Modal */}
      <TrialLimitModal />
    </TrialLayout>
  );
}
