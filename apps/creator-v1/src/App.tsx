
import { Toaster, TooltipProvider } from "@kstorybridge/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { DataCacheProvider } from "@/contexts/DataCacheContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { lazy, Suspense } from "react";

// Load debug utilities in development
if (import.meta.env.DEV) {
  import("@/utils/debugGA").catch(console.error);
  import("@/utils/testSearchTracking").catch(console.error);
}

// Keep small, essential components as regular imports
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CreatorProtectedLayout } from "@/components/CreatorProtectedLayout";
import { DocsProtectedLayout } from "@/components/DocsProtectedLayout";

// Lazy load page components for code splitting
const CreatorHome = lazy(() => import("./pages/CreatorHome"));
const TitleList = lazy(() => import("./pages/TitleList"));
const CreatorAddTitlePage = lazy(() => import("./pages/CreatorAddTitlePage"));
const CreatorEditTitlePage = lazy(() => import("./pages/CreatorEditTitlePage"));
const CreatorTitleDetailNew = lazy(() => import("./pages/CreatorTitleDetailNew"));
const MyRequests = lazy(() => import("./pages/MyRequests"));
const Profile = lazy(() => import("./pages/Profile"));
const News = lazy(() => import("./pages/News"));
const SendMessage = lazy(() => import("./pages/SendMessage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Documentation pages
const Docs = lazy(() => import("./pages/Docs"));
const DocumentViewer = lazy(() => import("./pages/DocumentViewer"));
const DatabaseSchema = lazy(() => import("./pages/DatabaseSchema"));
const UXDashboard = lazy(() => import("./pages/ux/UXDashboard"));
const UserJourneyPage = lazy(() => import("./pages/ux/UserJourneyPage"));
const MessagingPage = lazy(() => import("./pages/ux/MessagingPage"));

// Authentication pages (Creator-only)
const CreatorSigninPage = lazy(() => import("./pages/CreatorSigninPage"));
const CreatorSignupPage = lazy(() => import("./pages/CreatorSignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackSimple"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <OnboardingProvider>
            <DataCacheProvider>
              <Toaster />
              <BrowserRouter>
                <AnalyticsProvider>
                <div className="min-h-screen w-full bg-gray-50">
                <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* Authentication routes (Creator-only) */}
                <Route path="/signin" element={<CreatorSigninPage />} />
                <Route path="/signup" element={<CreatorSignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* Legacy routes for backwards compatibility */}
                <Route path="/signin/creator" element={<Navigate to="/signin" replace />} />
                <Route path="/signup/creator" element={<Navigate to="/signup" replace />} />

                {/* Root redirect to home */}
                <Route path="/" element={<Navigate to="/home" replace />} />

                {/* Creator routes (no /creators prefix) */}
                <Route path="/home" element={
                  <CreatorProtectedLayout><CreatorHome /></CreatorProtectedLayout>
                } />
                <Route path="/titles" element={
                  <CreatorProtectedLayout><TitleList /></CreatorProtectedLayout>
                } />
                <Route path="/titles/add" element={
                  <CreatorProtectedLayout><CreatorAddTitlePage /></CreatorProtectedLayout>
                } />
                <Route path="/titles/:titleId/edit" element={
                  <CreatorProtectedLayout><CreatorEditTitlePage /></CreatorProtectedLayout>
                } />
                <Route path="/titles/:titleId" element={
                  <CreatorProtectedLayout><CreatorTitleDetailNew /></CreatorProtectedLayout>
                } />
                <Route path="/requests" element={
                  <CreatorProtectedLayout><MyRequests /></CreatorProtectedLayout>
                } />
                <Route path="/profile" element={
                  <CreatorProtectedLayout><Profile /></CreatorProtectedLayout>
                } />
                <Route path="/news" element={
                  <CreatorProtectedLayout><News /></CreatorProtectedLayout>
                } />
                <Route path="/send-message" element={
                  <CreatorProtectedLayout><SendMessage /></CreatorProtectedLayout>
                } />

                {/* Documentation routes - accessible to all authenticated users */}
                <Route path="/docs" element={
                  <DocsProtectedLayout><Docs /></DocsProtectedLayout>
                } />
                <Route path="/docs/schema" element={
                  <DocsProtectedLayout><DatabaseSchema /></DocsProtectedLayout>
                } />
                <Route path="/docs/view/:filename" element={
                  <DocsProtectedLayout><DocumentViewer /></DocsProtectedLayout>
                } />
                <Route path="/docs/ux" element={
                  <DocsProtectedLayout><UXDashboard /></DocsProtectedLayout>
                } />
                <Route path="/docs/user_journey" element={
                  <DocsProtectedLayout><UserJourneyPage /></DocsProtectedLayout>
                } />
                <Route path="/docs/messaging" element={
                  <DocsProtectedLayout><MessagingPage /></DocsProtectedLayout>
                } />

                <Route path="*" element={
                  <ProtectedRoute>
                    <NotFound />
                  </ProtectedRoute>
                } />
              </Routes>
              </Suspense>
              </div>
            </AnalyticsProvider>
            </BrowserRouter>
          </DataCacheProvider>
        </OnboardingProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
