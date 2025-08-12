
import { Toaster, TooltipProvider } from "@kstorybridge/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { DataCacheProvider } from "@/contexts/DataCacheContext";
import { lazy, Suspense } from "react";

// Load debug utilities in development
if (import.meta.env.DEV) {
  import("@/utils/debugGA").catch(console.error);
  import("@/utils/testSearchTracking").catch(console.error);
}

// Keep small, essential components as regular imports
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { RootRedirect } from "./components/RootRedirect";

// Lazy load page components for code splitting
const Content = lazy(() => import("./pages/Content"));
const Browse = lazy(() => import("./pages/Browse"));
const Titles = lazy(() => import("./pages/Titles"));
const AddTitle = lazy(() => import("./pages/AddTitle"));
const TitleDetail = lazy(() => import("./pages/TitleDetail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const MyRequests = lazy(() => import("./pages/MyRequests"));
const Deals = lazy(() => import("./pages/Deals"));
const Media = lazy(() => import("./pages/Media"));
const Users = lazy(() => import("./pages/Users"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BuyerDashboardNew = lazy(() => import("./pages/BuyerDashboardNew"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataCacheProvider>
          <Toaster />
          <BrowserRouter>
            <AnalyticsProvider>
              <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedLayout><RootRedirect /></ProtectedLayout>
                } />
                
                {/* Buyer routes */}
                <Route path="/buyers" element={
                  <ProtectedLayout><RootRedirect /></ProtectedLayout>
                } />
                <Route path="/buyers/dashboard-new" element={
                  <ProtectedLayout><BuyerDashboardNew /></ProtectedLayout>
                } />
                <Route path="/buyers/titles" element={
                  <ProtectedLayout><Titles /></ProtectedLayout>
                } />
                <Route path="/buyers/titles/:titleId" element={
                  <ProtectedLayout><TitleDetail /></ProtectedLayout>
                } />
                <Route path="/buyers/favorites" element={
                  <ProtectedLayout><Favorites /></ProtectedLayout>
                } />
                <Route path="/buyers/requests" element={
                  <ProtectedLayout><MyRequests /></ProtectedLayout>
                } />
                <Route path="/buyers/deals" element={
                  <ProtectedLayout><Deals /></ProtectedLayout>
                } />
                <Route path="/buyers/browse" element={
                  <ProtectedLayout><Browse /></ProtectedLayout>
                } />
                <Route path="/buyers/media" element={
                  <ProtectedLayout><Media /></ProtectedLayout>
                } />
                <Route path="/buyers/users" element={
                  <ProtectedLayout><Users /></ProtectedLayout>
                } />
                <Route path="/buyers/settings" element={
                  <ProtectedLayout><Settings /></ProtectedLayout>
                } />
                <Route path="/buyers/profile" element={
                  <ProtectedLayout><Profile /></ProtectedLayout>
                } />
                
                {/* Creator routes */}
                <Route path="/creators" element={
                  <ProtectedLayout><RootRedirect /></ProtectedLayout>
                } />
                <Route path="/creators/titles" element={
                  <ProtectedLayout><Titles /></ProtectedLayout>
                } />
                <Route path="/creators/titles/add" element={
                  <ProtectedLayout><AddTitle /></ProtectedLayout>
                } />
                <Route path="/creators/titles/:titleId" element={
                  <ProtectedLayout><TitleDetail /></ProtectedLayout>
                } />
                <Route path="/creators/requests" element={
                  <ProtectedLayout><MyRequests /></ProtectedLayout>
                } />
                <Route path="/creators/profile" element={
                  <ProtectedLayout><Profile /></ProtectedLayout>
                } />
                
                {/* Legacy IP Owner/Creator routes */}
                <Route path="/content" element={
                  <ProtectedLayout><Content /></ProtectedLayout>
                } />
                
                {/* Legacy routes - redirect to buyer routes */}
                <Route path="/titles" element={
                  <ProtectedLayout><Titles /></ProtectedLayout>
                } />
                <Route path="/titles/:titleId" element={
                  <ProtectedLayout><TitleDetail /></ProtectedLayout>
                } />
                <Route path="/favorites" element={
                  <ProtectedLayout><Favorites /></ProtectedLayout>
                } />
                <Route path="/deals" element={
                  <ProtectedLayout><Deals /></ProtectedLayout>
                } />
                <Route path="/media" element={
                  <ProtectedLayout><Media /></ProtectedLayout>
                } />
                <Route path="/users" element={
                  <ProtectedLayout><Users /></ProtectedLayout>
                } />
                <Route path="/settings" element={
                  <ProtectedLayout><Settings /></ProtectedLayout>
                } />
                <Route path="/profile" element={
                  <ProtectedLayout><Profile /></ProtectedLayout>
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
