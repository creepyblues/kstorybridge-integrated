
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { DataCacheProvider } from "@/contexts/DataCacheContext";
// Load debug utilities in development
if (import.meta.env.DEV) {
  import("@/utils/debugGA").catch(console.error);
}
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { RootRedirect } from "./components/RootRedirect";
import Content from "./pages/Content";
import Browse from "./pages/Browse";
import Titles from "./pages/Titles";
import AddTitle from "./pages/AddTitle";
import TitleDetail from "./pages/TitleDetail";
import Favorites from "./pages/Favorites";
import Deals from "./pages/Deals";
import Media from "./pages/Media";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataCacheProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnalyticsProvider>
              <SidebarProvider>
              <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedLayout><RootRedirect /></ProtectedLayout>
                } />
                
                {/* Buyer routes */}
                <Route path="/buyers" element={
                  <ProtectedLayout><RootRedirect /></ProtectedLayout>
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
              </div>
            </SidebarProvider>
          </AnalyticsProvider>
        </BrowserRouter>
        </DataCacheProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
