/**
 * Trial Page
 *
 * Main trial experience page for anonymous users.
 * Features 3 tabs: Comps Navigator, Mandate Matcher, Trending Titles
 * Limits AI searches to 3 total via TrialContext.
 */

import { useState } from 'react';
import { TrialLayout } from '@/components/layout/TrialLayout';
import { TrialLimitModal } from '@/components/trial/TrialLimitModal';
import { TrialCompsSection } from '@/components/trial/TrialCompsSection';
import { TrialMandatesSection } from '@/components/trial/TrialMandatesSection';
import { TrialTrendingSection } from '@/components/trial/TrialTrendingSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { Icon } from '@iconify/react';

export default function Trial() {
  const [titleComplete, setTitleComplete] = useState(false);

  return (
    <TrialLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3 sm:space-y-4 px-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              <TypewriterText
                text="Discover Korean Content"
                speed={40}
                onComplete={() => setTitleComplete(true)}
              />
            </h1>
            <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-full bg-hanok-teal text-white uppercase tracking-wide transition-opacity duration-300 ${titleComplete ? 'opacity-100' : 'opacity-0'}`}>
              Trial
            </span>
          </div>
          <p className={`text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto transition-opacity duration-500 ${titleComplete ? 'opacity-100' : 'opacity-0'}`}>
            {titleComplete && (
              <TypewriterText
                text="Try our AI-powered discovery tools. Search up to 3 times for free, then sign up to unlock unlimited access."
                speed={15}
              />
            )}
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="comps" className="w-full">
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-sm">
            <TabsList className="w-full grid grid-cols-3 gap-1 sm:gap-2 h-auto bg-transparent">
              <TabsTrigger
                value="comps"
                className="flex flex-col items-center gap-1 sm:gap-2 py-2.5 sm:py-4 px-2 sm:px-3 rounded-lg sm:rounded-xl border-2 border-transparent bg-gray-50 hover:bg-gray-100 data-[state=active]:bg-hanok-teal/10 data-[state=active]:border-hanok-teal data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-hanok-teal/10 data-[state=active]:bg-hanok-teal group-data-[state=active]:bg-hanok-teal">
                  <Icon icon="solar:compass-bold-duotone" className="h-4 w-4 sm:h-5 sm:w-5 text-hanok-teal" />
                </div>
                <span className="font-semibold text-xs sm:text-base text-gray-700 data-[state=active]:text-hanok-teal">Comps</span>
              </TabsTrigger>
              <TabsTrigger
                value="mandates"
                className="flex flex-col items-center gap-1 sm:gap-2 py-2.5 sm:py-4 px-2 sm:px-3 rounded-lg sm:rounded-xl border-2 border-transparent bg-gray-50 hover:bg-gray-100 data-[state=active]:bg-purple-50 data-[state=active]:border-purple-500 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-purple-100">
                  <Icon icon="solar:stars-bold-duotone" className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <span className="font-semibold text-xs sm:text-base text-gray-700 data-[state=active]:text-purple-600">Mandates</span>
              </TabsTrigger>
              <TabsTrigger
                value="trending"
                className="flex flex-col items-center gap-1 sm:gap-2 py-2.5 sm:py-4 px-2 sm:px-3 rounded-lg sm:rounded-xl border-2 border-transparent bg-gray-50 hover:bg-gray-100 data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-orange-100">
                  <Icon icon="solar:graph-up-bold-duotone" className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                </div>
                <span className="font-semibold text-xs sm:text-base text-gray-700 data-[state=active]:text-orange-600">Trending</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6 sm:mt-8">
            <TabsContent value="comps" className="mt-0">
              <TrialCompsSection />
            </TabsContent>

            <TabsContent value="mandates" className="mt-0">
              <TrialMandatesSection />
            </TabsContent>

            <TabsContent value="trending" className="mt-0">
              <TrialTrendingSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Limit Modal */}
      <TrialLimitModal />
    </TrialLayout>
  );
}
