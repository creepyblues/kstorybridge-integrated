/**
 * Trial Page
 *
 * Main trial experience page for anonymous users.
 * Features 3 tabs: Comps Navigator, Mandate Matcher, Trending Titles
 * Limits AI searches to 3 total via TrialContext.
 */

import { TrialLayout } from '@/components/layout/TrialLayout';
import { TrialLimitModal } from '@/components/trial/TrialLimitModal';
import { TrialCompsSection } from '@/components/trial/TrialCompsSection';
import { TrialMandatesSection } from '@/components/trial/TrialMandatesSection';
import { TrialTrendingSection } from '@/components/trial/TrialTrendingSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@iconify/react';

export default function Trial() {
  return (
    <TrialLayout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Discover Korean Content
            </h1>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-hanok-teal text-white uppercase tracking-wide">
              Trial
            </span>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Try our AI-powered discovery tools. Search up to 3 times for free, then sign up to unlock unlimited access.
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="comps" className="w-full">
          <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
            <TabsList className="w-full grid grid-cols-3 gap-2 h-auto bg-transparent">
              <TabsTrigger
                value="comps"
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-gray-100 data-[state=active]:bg-hanok-teal/10 data-[state=active]:border-hanok-teal data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="p-2 rounded-xl bg-hanok-teal/10 data-[state=active]:bg-hanok-teal group-data-[state=active]:bg-hanok-teal">
                  <Icon icon="solar:compass-bold-duotone" className="h-5 w-5 text-hanok-teal" />
                </div>
                <span className="font-semibold text-base text-gray-700 data-[state=active]:text-hanok-teal hidden sm:block">Comps Navigator</span>
                <span className="font-semibold text-base text-gray-700 sm:hidden">Comps</span>
              </TabsTrigger>
              <TabsTrigger
                value="mandates"
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-gray-100 data-[state=active]:bg-purple-50 data-[state=active]:border-purple-500 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="p-2 rounded-xl bg-purple-100">
                  <Icon icon="solar:stars-bold-duotone" className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-semibold text-base text-gray-700 data-[state=active]:text-purple-600 hidden sm:block">Mandate Matcher</span>
                <span className="font-semibold text-base text-gray-700 sm:hidden">Mandates</span>
              </TabsTrigger>
              <TabsTrigger
                value="trending"
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-gray-100 data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="p-2 rounded-xl bg-orange-100">
                  <Icon icon="solar:graph-up-bold-duotone" className="h-5 w-5 text-orange-500" />
                </div>
                <span className="font-semibold text-base text-gray-700 data-[state=active]:text-orange-600 hidden sm:block">Trending Titles</span>
                <span className="font-semibold text-base text-gray-700 sm:hidden">Trending</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-8">
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
