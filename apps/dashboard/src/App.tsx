import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { TierProvider } from '@/contexts/TierContext';
import { DataCacheProvider } from '@/contexts/DataCacheContext';
import { SessionCacheInitializer } from '@/components/SessionCacheInitializer';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Auth pages
import SignIn from '@/pages/auth/SignIn';
import SignUp from '@/pages/auth/SignUp';
import AuthCallback from '@/pages/auth/AuthCallback';
import CompleteProfile from '@/pages/auth/CompleteProfile';

// Buyer pages
import Home from '@/pages/buyers/Home';
import Chat from '@/pages/buyers/Chat';
import CompsNavigator from '@/pages/buyers/CompsNavigator';
import Mandates from '@/pages/buyers/Mandates';
import Titles from '@/pages/buyers/Titles';
import TitleDetail from '@/pages/buyers/TitleDetail';
import Saved from '@/pages/buyers/Saved';
import Profile from '@/pages/buyers/Profile';
import Plan from '@/pages/buyers/Plan';
import Checkout from '@/pages/buyers/Checkout';
import CheckoutSuccess from '@/pages/buyers/CheckoutSuccess';
import CheckoutCancel from '@/pages/buyers/CheckoutCancel';
import Featured from '@/pages/buyers/Featured';

// Admin pages
import AdminTitles from '@/pages/admin/AdminTitles';
import AdminTitleEdit from '@/pages/admin/AdminTitleEdit';
import TitleApproval from '@/pages/admin/TitleApproval';
import TitleApprovalDetail from '@/pages/admin/TitleApprovalDetail';
import { ContentList } from '@/pages/admin/ContentList';
import { ContentEditor } from '@/pages/admin/ContentEditor';
import AssetGeneration from '@/pages/admin/AssetGeneration';
import PitchExtractor from '@/pages/admin/PitchExtractor';
import AdminDocs from '@/pages/admin/Docs';
import EmailTemplates from '@/pages/admin/EmailTemplates';
import AdminTrending from '@/pages/admin/Trending';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';

// Preview pages (development only)
import Design1Dashboard from '@/pages/preview/Design1Dashboard';
import Design1CompsNavigator from '@/pages/preview/Design1CompsNavigator';
import Design2Dashboard from '@/pages/preview/Design2Dashboard';
import Design2CompsNavigator from '@/pages/preview/Design2CompsNavigator';
import Design3Dashboard from '@/pages/preview/Design3Dashboard';
import Design3CompsNavigator from '@/pages/preview/Design3CompsNavigator';

// Trial pages (public, no auth required)
import Trial from '@/pages/Trial';
import TrialTitleDetail from '@/pages/TrialTitleDetail';
import { TrialProvider } from '@/contexts/TrialContext';

// 🚨 AUTH ISOLATION ARCHITECTURE
// AuthProvider wraps entire app (auth state only)
// TierProvider wraps ONLY protected routes (business logic, non-blocking)
// Public routes (signin, signup, callback) do NOT load tier checking

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataCacheProvider>
            <SessionCacheInitializer>
              <BrowserRouter>
            <Routes>
          {/* Public routes - No TierProvider (auth isolated) */}
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/signup/complete" element={<CompleteProfile />} />

          {/* Public trial routes - No auth required */}
          <Route
            path="/trial"
            element={
              <TrialProvider>
                <Trial />
              </TrialProvider>
            }
          />
          <Route
            path="/trial/titles/:titleId"
            element={
              <TrialProvider>
                <TrialTitleDetail />
              </TrialProvider>
            }
          />

          {/* Protected buyer routes - TierProvider loaded on-demand */}
          <Route
            path="/buyers/home"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/chat"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/comps-navigator"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <CompsNavigator />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/mandates"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <Mandates />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/titles"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <Titles />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/titles/:titleId"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <TitleDetail />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/saved"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <Saved />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/trending"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <Featured />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/profile"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/plan"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <Plan />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/checkout"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/checkout/success"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <CheckoutSuccess />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/buyers/checkout/cancel"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <CheckoutCancel />
                </ProtectedRoute>
              </TierProvider>
            }
          />

          {/* Admin routes */}
          <Route path="/admin" element={<Navigate to="/admin/trending" replace />} />

          {/* Trending (Featured titles management) */}
          <Route
            path="/admin/trending"
            element={
              <AdminProtectedRoute>
                <AdminTrending />
              </AdminProtectedRoute>
            }
          />

          {/* Title Approval */}
          <Route
            path="/admin/title-approval"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <TitleApproval />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/title-approval/:draftId"
            element={
              <AdminProtectedRoute>
                <TitleApprovalDetail />
              </AdminProtectedRoute>
            }
          />

          {/* Content CMS */}
          <Route
            path="/admin/content"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <ContentList />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/content/new"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <ContentEditor />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/content/:id/edit"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <ContentEditor />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          {/* Asset Generation */}
          <Route
            path="/admin/asset-generation"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AssetGeneration />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          {/* Pitch Extractor */}
          <Route
            path="/admin/pitch-extractor"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <PitchExtractor />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          {/* Docs - Standalone page (no AdminLayout) */}
          <Route
            path="/admin/docs"
            element={
              <AdminProtectedRoute>
                <AdminDocs />
              </AdminProtectedRoute>
            }
          />

          {/* Email Templates - Standalone page (no AdminLayout) */}
          <Route
            path="/admin/email-templates"
            element={
              <AdminProtectedRoute>
                <EmailTemplates />
              </AdminProtectedRoute>
            }
          />

          {/* Titles */}
          <Route
            path="/admin/titles"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <AdminTitles />
                </ProtectedRoute>
              </TierProvider>
            }
          />
          <Route
            path="/admin/titles/:titleId/edit"
            element={
              <AdminProtectedRoute>
                <AdminTitleEdit />
              </AdminProtectedRoute>
            }
          />

          {/* PREVIEW ROUTES - Development only */}
          {import.meta.env.DEV && (
            <>
              {/* Design 1: Purple & Lavender */}
              <Route
                path="/preview/design1"
                element={
                  <TierProvider>
                    <ProtectedRoute>
                      <Design1Dashboard />
                    </ProtectedRoute>
                  </TierProvider>
                }
              />
              <Route
                path="/preview/design1/comps"
                element={
                  <TierProvider>
                    <ProtectedRoute>
                      <Design1CompsNavigator />
                    </ProtectedRoute>
                  </TierProvider>
                }
              />

              {/* Design 2: Warm Coral & Peach */}
              <Route
                path="/preview/design2"
                element={
                  <TierProvider>
                    <ProtectedRoute>
                      <Design2Dashboard />
                    </ProtectedRoute>
                  </TierProvider>
                }
              />
              <Route
                path="/preview/design2/comps"
                element={
                  <TierProvider>
                    <ProtectedRoute>
                      <Design2CompsNavigator />
                    </ProtectedRoute>
                  </TierProvider>
                }
              />

              {/* Design 3: Cool Slate & Cyan */}
              <Route
                path="/preview/design3"
                element={
                  <TierProvider>
                    <ProtectedRoute>
                      <Design3Dashboard />
                    </ProtectedRoute>
                  </TierProvider>
                }
              />
              <Route
                path="/preview/design3/comps"
                element={
                  <TierProvider>
                    <ProtectedRoute>
                      <Design3CompsNavigator />
                    </ProtectedRoute>
                  </TierProvider>
                }
              />
            </>
          )}

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </SessionCacheInitializer>
      </DataCacheProvider>
    </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
