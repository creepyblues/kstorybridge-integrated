import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster, TooltipProvider } from "@kstorybridge/ui";
import { lazy, Suspense } from "react";

import { LanguageProvider } from "./contexts/LanguageContext";
import AnalyticsProvider from "./components/AnalyticsProvider";

// Lazy load page components for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const HomePageNew = lazy(() => import("./pages/HomePageNew"));
const CreatorsPage = lazy(() => import("./pages/CreatorsPage"));
const BuyersPage = lazy(() => import("./pages/BuyersPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const BuyerSignupPage = lazy(() => import("./pages/BuyerSignupPage"));
const CreatorSignupPage = lazy(() => import("./pages/CreatorSignupPage"));
const SigninPage = lazy(() => import("./pages/SigninPage"));
const TitleDetailPage = lazy(() => import("./pages/TitleDetailPage"));
const SampleTitleDetailPage = lazy(() => import("./pages/SampleTitleDetailPage"));
const DashboardInvited = lazy(() => import("./pages/DashboardInvited"));
const CreatorInvited = lazy(() => import("./pages/CreatorInvited"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/new-design" element={<HomePageNew />} />
          <Route path="/creators" element={<CreatorsPage />} />
          <Route path="/buyers" element={<BuyersPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/buyer" element={<BuyerSignupPage />} />
          <Route path="/signup/creator" element={<CreatorSignupPage />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/title/:titleId" element={<TitleDetailPage />} />
          <Route path="/sample/werewolves-going-crazy-over-me" element={<SampleTitleDetailPage />} />
          <Route path="/invited" element={<DashboardInvited />} />
          <Route path="/creator/invited" element={<CreatorInvited />} />
          {/* Legacy redirect for old dashboard routes */}
          <Route path="/dashboard/invited" element={<Navigate to="/invited" replace />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </LanguageProvider>
);

export default App;
