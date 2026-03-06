import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, TooltipProvider } from "@kstorybridge/ui";
import { lazy, Suspense } from "react";

import AnalyticsProvider from "./components/AnalyticsProvider";
import SessionTracker from "./components/SessionTracker";
import CookieBanner from "./components/CookieBanner";

const queryClient = new QueryClient();

// Lazy load page components for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const HomePageOld = lazy(() => import("./pages/HomePageOld"));
const HomePageNew = lazy(() => import("./pages/HomePageNew"));
const CreatorsPage = lazy(() => import("./pages/CreatorsPage"));
const ProducersPage = lazy(() => import("./pages/ProducersPage"));
const ProducersPagePreview = lazy(() => import("./pages/ProducersPagePreview"));
const CreatorsPagePreview = lazy(() => import("./pages/CreatorsPagePreview"));
const HomePagePreview1 = lazy(() => import("./pages/HomePagePreview1"));
const HomePagePreview2 = lazy(() => import("./pages/HomePagePreview2"));
const HomePagePreview3 = lazy(() => import("./pages/HomePagePreview3"));
const HomePagePreview4 = lazy(() => import("./pages/HomePagePreview4"));
const ProducersOnboardingPage = lazy(() => import("./pages/ProducersOnboardingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const SigninPage = lazy(() => import("./pages/SigninPage"));
const TitleDetailPage = lazy(() => import("./pages/TitleDetailPage"));
const SampleTitleDetailPage = lazy(() => import("./pages/SampleTitleDetailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

// Feature promo pages
const ChatbotFeaturePage = lazy(() => import("./pages/features/ChatbotFeaturePage"));
const CompsNavigatorFeaturePage = lazy(() => import("./pages/features/CompsNavigatorFeaturePage"));
const MandateMatcherFeaturePage = lazy(() => import("./pages/features/MandateMatcherFeaturePage"));
const HowToProducersPage = lazy(() => import("./pages/HowToProducersPage"));
const DiaryPage = lazy(() => import("./pages/DiaryPage"));
const DiaryEntryPage = lazy(() => import("./pages/DiaryEntryPage"));
const FormatSpotlightPage = lazy(() => import("./pages/FormatSpotlightPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AnalyticsProvider />
        <SessionTracker />
        <CookieBanner />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home-old" element={<HomePageOld />} />
          <Route path="/new-design" element={<HomePageNew />} />
          <Route path="/creators" element={<CreatorsPage />} />
          <Route path="/producers" element={<ProducersPage />} />

          {/* Feature promo pages */}
          <Route path="/features/chatbot" element={<ChatbotFeaturePage />} />
          <Route path="/features/comps-navigator" element={<CompsNavigatorFeaturePage />} />
          <Route path="/features/mandate-matcher" element={<MandateMatcherFeaturePage />} />
          <Route path="/how-to/producers" element={<HowToProducersPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/diary/:date" element={<DiaryEntryPage />} />
          <Route path="/format-spotlight/:formatType" element={<FormatSpotlightPage />} />

          {/* PREVIEW ROUTES - Only available in development */}
          {import.meta.env.DEV && <Route path="/producers-preview" element={<ProducersPagePreview />} />}
          {import.meta.env.DEV && <Route path="/creators-preview" element={<CreatorsPagePreview />} />}
          {import.meta.env.DEV && <Route path="/home-preview1" element={<HomePagePreview1 />} />}
          {import.meta.env.DEV && <Route path="/home-preview2" element={<HomePagePreview2 />} />}
          {import.meta.env.DEV && <Route path="/home-preview3" element={<HomePagePreview3 />} />}
          {import.meta.env.DEV && <Route path="/home-preview4" element={<HomePagePreview4 />} />}
          <Route path="/producers/onboarding" element={<ProducersOnboardingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/signup" element={<SigninPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/title/:titleId" element={<TitleDetailPage />} />
          <Route path="/sample/werewolves-going-crazy-over-me" element={<SampleTitleDetailPage />} />
          
          {/* Redirect handler for email verification links that default to invitation/accept */}
          <Route path="/invitation/accept" element={<Navigate to={`${import.meta.env.VITE_DASHBOARD_URL || 'https://dashboard.kstorybridge.com'}/signin?verified=true`} replace />} />
          
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </BrowserRouter>
      </TooltipProvider>
  </QueryClientProvider>
);

export default App;
