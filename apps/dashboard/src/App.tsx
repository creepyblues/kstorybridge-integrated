
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
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
import TitleDetail from "./pages/TitleDetail";
import Favorites from "./pages/Favorites";
import Deals from "./pages/Deals";
import Media from "./pages/Media";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
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
                <Route path="/content" element={
                  <ProtectedLayout><Content /></ProtectedLayout>
                } />
                <Route path="/browse" element={
                  <ProtectedLayout><Browse /></ProtectedLayout>
                } />
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
