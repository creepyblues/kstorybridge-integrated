
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
import { BuyerProtectedLayout } from "@/components/BuyerProtectedLayout";
import { CreatorProtectedLayout } from "@/components/CreatorProtectedLayout";
import { RootRedirect } from "./components/RootRedirect";
import { DashboardEntrypoint } from "./components/DashboardEntrypoint";

// Lazy load page components for code splitting
const Content = lazy(() => import("./pages/Content"));
const Browse = lazy(() => import("./pages/Browse"));
const Home = lazy(() => import("./pages/Home"));
const BuyerHome = lazy(() => import("./pages/BuyerHome"));
const CreatorHome = lazy(() => import("./pages/CreatorHome"));
const TitleList = lazy(() => import("./pages/TitleList"));
const TitleDetail = lazy(() => import("./pages/TitleDetail"));
const TitleDetailNew = lazy(() => import("./pages/TitleDetailNew"));
const CreatorAddTitlePage = lazy(() => import("./pages/CreatorAddTitlePage"));
const CreatorEditTitlePage = lazy(() => import("./pages/CreatorEditTitlePage"));
const CreatorTitleDetailNew = lazy(() => import("./pages/CreatorTitleDetailNew"));
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
const Chat = lazy(() => import("./pages/Chat"));
const ChatHistory = lazy(() => import("./pages/ChatHistory"));
const VectorSearchManager = lazy(() => import("./pages/VectorSearchManager"));
const OpenAITest = lazy(() => import("./pages/OpenAITest"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const ChatbotFeedbackAnalysis = lazy(() => import("./pages/ChatbotFeedbackAnalysis"));
const SearchAnalytics = lazy(() => import("./pages/SearchAnalytics"));
const Experiment = lazy(() => import("./pages/Experiment"));
const ChatbotTesting = lazy(() => import("./pages/ChatbotTesting"));
const SignupDebugPage = lazy(() => import("./pages/SignupDebugPage"));

// Authentication pages
const SigninPage = lazy(() => import("./pages/SigninPageSimple"));
const BuyerSigninPage = lazy(() => import("./pages/BuyerSigninPage"));
const CreatorSigninPage = lazy(() => import("./pages/CreatorSigninPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const BuyerSignupPage = lazy(() => import("./pages/BuyerSignupPage"));
const CreatorSignupPage = lazy(() => import("./pages/CreatorSignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackMinimal"));

// Payment pages
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));

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
  return <Navigate to={`/buyers/titles/${titleId}`} replace />;
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
                <Route path="/signin/buyer" element={<BuyerSigninPage />} />
                <Route path="/signin/creator" element={<CreatorSigninPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/signup/buyer" element={<BuyerSignupPage />} />
                <Route path="/signup/creator" element={<CreatorSignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* DEBUG: Test route to verify routing works */}
                <Route path="/test-signup" element={<div style={{padding: '20px', background: 'white', color: 'black'}}>🎯 TEST ROUTE WORKS! If you can see this, routing is fine. <a href="/signup/buyer" style={{color: 'blue'}}>Try signup/buyer</a></div>} />

                {/* DEBUG: Signup debugger page */}
                <Route path="/debug-signup" element={<SignupDebugPage />} />

                {/* Legacy auth route - redirect to signin */}
                <Route path="/auth" element={<SigninPage />} />
                
                {/* Test route - no authentication required */}
                <Route path="/test-send-message" element={<SendMessageTest />} />
                <Route path="/" element={<DashboardEntrypoint />} />
                
                {/* Buyer routes */}
                <Route path="/buyers" element={
                  <BuyerProtectedLayout><RootRedirect /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/home" element={
                  <BuyerProtectedLayout><BuyerHome /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/dashboard-new" element={
                  <BuyerProtectedLayout><BuyerDashboardNew /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/titles" element={
                  <BuyerProtectedLayout><TitleList /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/titles/:titleId" element={
                  <BuyerProtectedLayout><TitleDetailNew /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/favorites" element={
                  <BuyerProtectedLayout><Favorites /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/requests" element={
                  <BuyerProtectedLayout><MyRequests /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/deals" element={
                  <BuyerProtectedLayout><Deals /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/browse" element={
                  <BuyerProtectedLayout><Browse /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/media" element={
                  <BuyerProtectedLayout><Media /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/users" element={
                  <BuyerProtectedLayout><Users /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/settings" element={
                  <BuyerProtectedLayout><Settings /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/profile" element={
                  <BuyerProtectedLayout><Profile /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/plan" element={
                  <BuyerProtectedLayout><BuyersPricing /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/news" element={
                  <BuyerProtectedLayout><News /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/send-message" element={
                  <BuyerProtectedLayout><SendMessage /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/chat" element={
                  <BuyerProtectedLayout><Chat /></BuyerProtectedLayout>
                } />
                <Route path="/buyers/ai-chatbot" element={
                  <BuyerProtectedLayout><AIChatbot /></BuyerProtectedLayout>
                } />

                {/* Legacy route redirects */}
                <Route path="/buyers/pricing" element={<Navigate to="/buyers/plan" replace />} />
                <Route path="/buyers/subscription" element={<Navigate to="/buyers/plan" replace />} />
                
                {/* Creator routes */}
                <Route path="/creators" element={
                  <CreatorProtectedLayout><RootRedirect /></CreatorProtectedLayout>
                } />
                <Route path="/creators/home" element={
                  <CreatorProtectedLayout><CreatorHome /></CreatorProtectedLayout>
                } />
                <Route path="/creators/titles" element={
                  <CreatorProtectedLayout><TitleList /></CreatorProtectedLayout>
                } />
                <Route path="/creators/titles/add" element={
                  <CreatorProtectedLayout><CreatorAddTitlePage /></CreatorProtectedLayout>
                } />
                <Route path="/creators/titles/:titleId/edit" element={
                  <CreatorProtectedLayout><CreatorEditTitlePage /></CreatorProtectedLayout>
                } />
                <Route path="/creators/titles/:titleId" element={
                  <CreatorProtectedLayout><CreatorTitleDetailNew /></CreatorProtectedLayout>
                } />
                <Route path="/creators/requests" element={
                  <CreatorProtectedLayout><MyRequests /></CreatorProtectedLayout>
                } />
                <Route path="/creators/profile" element={
                  <CreatorProtectedLayout><Profile /></CreatorProtectedLayout>
                } />
                <Route path="/creators/news" element={
                  <CreatorProtectedLayout><News /></CreatorProtectedLayout>
                } />
                <Route path="/creators/send-message" element={
                  <CreatorProtectedLayout><SendMessage /></CreatorProtectedLayout>
                } />
                <Route path="/creators/chat" element={
                  <CreatorProtectedLayout><Chat /></CreatorProtectedLayout>
                } />
                <Route path="/creators/ai-chatbot" element={
                  <CreatorProtectedLayout><AIChatbot /></CreatorProtectedLayout>
                } />
                {/* Creator-specific routes only - removed inappropriate routes:
                     favorites, deals, browse, media, users, settings, pricing */}
                
                {/* Legacy IP Owner/Creator routes */}
                <Route path="/content" element={
                  <ProtectedLayout><Content /></ProtectedLayout>
                } />
                
                {/* Legacy routes - redirect to buyer routes */}
                <Route path="/titles" element={
                  <ProtectedLayout><TitleList /></ProtectedLayout>
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
                
                {/* OpenAI Chatbot Testing - environment comparison tool */}
                <Route path="/openai-chatbot-testing" element={
                  <ProtectedLayout><ChatbotTesting /></ProtectedLayout>
                } />

                {/* Payment and subscription routes */}
                <Route path="/payment/success" element={
                  <ProtectedRoute><PaymentSuccess /></ProtectedRoute>
                } />
                <Route path="/payment/cancel" element={
                  <ProtectedRoute><PaymentCancel /></ProtectedRoute>
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
