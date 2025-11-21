import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { TierProvider } from '@/contexts/TierContext';
import { DataCacheProvider } from '@/contexts/DataCacheContext';
import { SessionCacheInitializer } from '@/components/SessionCacheInitializer';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Auth pages
import SignIn from '@/pages/auth/SignIn';
import SignUp from '@/pages/auth/SignUp';
import AuthCallback from '@/pages/auth/AuthCallback';
import CompleteProfile from '@/pages/auth/CompleteProfile';

// Buyer pages
import Chat from '@/pages/buyers/Chat';
import CompsNavigator from '@/pages/buyers/CompsNavigator';
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
import AdminFeatured from '@/pages/admin/Featured';

// 🚨 AUTH ISOLATION ARCHITECTURE
// AuthProvider wraps entire app (auth state only)
// TierProvider wraps ONLY protected routes (business logic, non-blocking)
// Public routes (signin, signup, callback) do NOT load tier checking

function App() {
  return (
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

          {/* Protected buyer routes - TierProvider loaded on-demand */}
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
            path="/buyers/featured"
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
          <Route path="/admin" element={<Navigate to="/admin/featured" replace />} />
          <Route
            path="/admin/featured"
            element={
              <TierProvider>
                <ProtectedRoute>
                  <AdminFeatured />
                </ProtectedRoute>
              </TierProvider>
            }
          />
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

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
        </SessionCacheInitializer>
      </DataCacheProvider>
    </AuthProvider>
  );
}

export default App;
