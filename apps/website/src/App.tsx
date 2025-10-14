import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster, TooltipProvider } from "@kstorybridge/ui";
import { lazy, Suspense } from "react";

import { LanguageProvider } from "./contexts/LanguageContext";
import AnalyticsProvider from "./components/AnalyticsProvider";
import SessionTracker from "./components/SessionTracker";

// Lazy load page components for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const HomePageNew = lazy(() => import("./pages/HomePageNew"));
const CreatorsPage = lazy(() => import("./pages/CreatorsPage"));
const BuyersPage = lazy(() => import("./pages/BuyersPage"));
const BuyersPagePreview = lazy(() => import("./pages/BuyersPagePreview"));
const CreatorsPagePreview = lazy(() => import("./pages/CreatorsPagePreview"));
const BuyersOnboardingPage = lazy(() => import("./pages/BuyersOnboardingPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const TitleDetailPage = lazy(() => import("./pages/TitleDetailPage"));
const SampleTitleDetailPage = lazy(() => import("./pages/SampleTitleDetailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NewsPage = lazy(() => import("./pages/NewsPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
  </div>
);

const App = () => (
  <LanguageProvider>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AnalyticsProvider />
        <SessionTracker />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/new-design" element={<HomePageNew />} />
          <Route path="/creators" element={<CreatorsPage />} />
          <Route path="/buyers" element={<BuyersPage />} />
          {/* PREVIEW ROUTES - Only available in development */}
          {import.meta.env.DEV && <Route path="/buyers-preview" element={<BuyersPagePreview />} />}
          {import.meta.env.DEV && <Route path="/creators-preview" element={<CreatorsPagePreview />} />}
          <Route path="/buyers/onboarding" element={<BuyersOnboardingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
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
  </LanguageProvider>
);

export default App;
