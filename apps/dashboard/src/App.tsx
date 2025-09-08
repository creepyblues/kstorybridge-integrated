
import { Toaster, TooltipProvider } from "@kstorybridge/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
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
const Home = lazy(() => import("./pages/Home"));
const Titles = lazy(() => import("./pages/Titles"));
const TitleList = lazy(() => import("./pages/TitleList"));
const AddTitle = lazy(() => import("./pages/AddTitle"));
const TitleDetail = lazy(() => import("./pages/TitleDetail"));
const TitleDetailNew = lazy(() => import("./pages/TitleDetailNew"));
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
const BuyersPricing = lazy(() => import("./pages/BuyersPricing"));
const Contact = lazy(() => import("./pages/Contact"));
const News = lazy(() => import("./pages/News"));
const SendMessage = lazy(() => import("./pages/SendMessage"));
const SendMessageTest = lazy(() => import("./pages/SendMessageTest"));
const AIChatbot = lazy(() => import("./pages/AIChatbot"));
const OpenAIChatbot = lazy(() => import("./pages/OpenAIChatbot"));
const ChatHistory = lazy(() => import("./pages/ChatHistory"));
const VectorSearchManager = lazy(() => import("./pages/VectorSearchManager"));
const OpenAITest = lazy(() => import("./pages/OpenAITest"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const ChatbotFeedbackAnalysis = lazy(() => import("./pages/ChatbotFeedbackAnalysis"));
const SearchAnalytics = lazy(() => import("./pages/SearchAnalytics"));
const Experiment = lazy(() => import("./pages/Experiment"));

// Authentication pages
const SigninPage = lazy(() => import("./pages/SigninPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const BuyerSignupPage = lazy(() => import("./pages/BuyerSignupPage"));
const CreatorSignupPage = lazy(() => import("./pages/CreatorSignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const InvitedPage = lazy(() => import("./pages/InvitedPage"));
const CreatorInvitedPage = lazy(() => import("./pages/CreatorInvitedPage"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
  </div>
);

// Redirect components for legacy routes
const TitleRedirect = () => {
  const { titleId } = useParams();
  return <Navigate to={`/buyers/titles/${titleId}`} replace />;
};

const TitleNewRedirect = () => {
  const { titleId } = useParams();
  return <Navigate to={`/buyers/titles-new/${titleId}`} replace />;
};

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
                {/* Authentication routes - no authentication required */}
                <Route path="/signin" element={<SigninPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/signup/buyer" element={<BuyerSignupPage />} />
                <Route path="/signup/creator" element={<CreatorSignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/invited" element={<InvitedPage />} />
                <Route path="/creator/invited" element={<CreatorInvitedPage />} />
                
                {/* Legacy auth route - redirect to signin */}
                <Route path="/auth" element={<SigninPage />} />
                
                {/* Test route - no authentication required */}
                <Route path="/test-send-message" element={<SendMessageTest />} />
                <Route path="/" element={
                  <ProtectedLayout><RootRedirect /></ProtectedLayout>
                } />
                
                {/* Buyer routes */}
                <Route path="/buyers" element={
                  <ProtectedLayout><RootRedirect /></ProtectedLayout>
                } />
                <Route path="/buyers/home" element={
                  <ProtectedLayout><Home /></ProtectedLayout>
                } />
                <Route path="/buyers/dashboard-new" element={
                  <ProtectedLayout><BuyerDashboardNew /></ProtectedLayout>
                } />
                <Route path="/buyers/titles" element={
                  <ProtectedLayout><TitleList /></ProtectedLayout>
                } />
                <Route path="/buyers/title-list" element={
                  <ProtectedLayout><Titles /></ProtectedLayout>
                } />
                <Route path="/buyers/titles/:titleId" element={
                  <ProtectedLayout><TitleDetailNew /></ProtectedLayout>
                } />
                <Route path="/buyers/titles-new/:titleId" element={
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
                <Route path="/buyers/pricing" element={
                  <ProtectedLayout><BuyersPricing /></ProtectedLayout>
                } />
                <Route path="/buyers/news" element={
                  <ProtectedLayout><News /></ProtectedLayout>
                } />
                <Route path="/buyers/send-message" element={
                  <ProtectedLayout><SendMessage /></ProtectedLayout>
                } />
                <Route path="/buyers/openai-chatbot" element={
                  <ProtectedLayout><OpenAIChatbot /></ProtectedLayout>
                } />
                <Route path="/buyers/ai-chatbot" element={
                  <ProtectedLayout><AIChatbot /></ProtectedLayout>
                } />
                
                {/* Creator routes */}
                <Route path="/creators" element={
                  <ProtectedLayout><RootRedirect /></ProtectedLayout>
                } />
                <Route path="/creators/home" element={
                  <ProtectedLayout><Home /></ProtectedLayout>
                } />
                <Route path="/creators/titles" element={
                  <ProtectedLayout><Titles /></ProtectedLayout>
                } />
                <Route path="/creators/titles/add" element={
                  <ProtectedLayout><AddTitle /></ProtectedLayout>
                } />
                <Route path="/creators/titles/:titleId" element={
                  <ProtectedLayout><TitleDetailNew /></ProtectedLayout>
                } />
                <Route path="/creators/titles-new/:titleId" element={
                  <ProtectedLayout><TitleDetail /></ProtectedLayout>
                } />
                <Route path="/creators/requests" element={
                  <ProtectedLayout><MyRequests /></ProtectedLayout>
                } />
                <Route path="/creators/profile" element={
                  <ProtectedLayout><Profile /></ProtectedLayout>
                } />
                <Route path="/creators/news" element={
                  <ProtectedLayout><News /></ProtectedLayout>
                } />
                <Route path="/creators/send-message" element={
                  <ProtectedLayout><SendMessage /></ProtectedLayout>
                } />
                <Route path="/creators/openai-chatbot" element={
                  <ProtectedLayout><OpenAIChatbot /></ProtectedLayout>
                } />
                <Route path="/creators/ai-chatbot" element={
                  <ProtectedLayout><AIChatbot /></ProtectedLayout>
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
                  <TitleRedirect />
                } />
                <Route path="/titles-new/:titleId" element={
                  <TitleNewRedirect />
                } />
                <Route path="/search-results" element={
                  <ProtectedLayout><SearchResults /></ProtectedLayout>
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
                
                {/* Contact page - accessible to all authenticated users */}
                <Route path="/contact" element={
                  <ProtectedLayout><Contact /></ProtectedLayout>
                } />
                
                {/* AI Chatbot - restricted access */}
                <Route path="/ai-chatbot" element={
                  <ProtectedLayout><AIChatbot /></ProtectedLayout>
                } />
                
                {/* OpenAI Chatbot - restricted access */}
                <Route path="/openai-chatbot" element={
                  <ProtectedLayout><OpenAIChatbot /></ProtectedLayout>
                } />
                
                {/* Chat History - restricted access */}
                <Route path="/chat-history" element={
                  <ProtectedLayout><ChatHistory /></ProtectedLayout>
                } />
                
                {/* Vector Search Manager - restricted access */}
                <Route path="/vector-search-manager" element={
                  <ProtectedLayout><VectorSearchManager /></ProtectedLayout>
                } />
                
                {/* OpenAI Test page - temporary for debugging */}
                <Route path="/openai-test" element={
                  <ProtectedLayout><OpenAITest /></ProtectedLayout>
                } />
                
                {/* Chatbot Feedback Analysis - admin only */}
                <Route path="/chatbot-feedback" element={
                  <ProtectedLayout><ChatbotFeedbackAnalysis /></ProtectedLayout>
                } />
                
                {/* Search Analytics Dashboard */}
                <Route path="/search-analytics" element={
                  <ProtectedLayout><SearchAnalytics /></ProtectedLayout>
                } />
                
                {/* Experiment page - admin only */}
                <Route path="/experiment" element={
                  <ProtectedLayout><Experiment /></ProtectedLayout>
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
