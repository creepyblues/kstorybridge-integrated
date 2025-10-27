import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { TierProvider } from '@/contexts/TierContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Auth pages
import SignIn from '@/pages/auth/SignIn';
import SignUp from '@/pages/auth/SignUp';
import AuthCallback from '@/pages/auth/AuthCallback';
import CompleteProfile from '@/pages/auth/CompleteProfile';

// Buyer pages
import Chat from '@/pages/buyers/Chat';
import Titles from '@/pages/buyers/Titles';
import TitleDetail from '@/pages/buyers/TitleDetail';
import Saved from '@/pages/buyers/Saved';
import Profile from '@/pages/buyers/Profile';
import Plan from '@/pages/buyers/Plan';
import Checkout from '@/pages/buyers/Checkout';
import CheckoutSuccess from '@/pages/buyers/CheckoutSuccess';
import CheckoutCancel from '@/pages/buyers/CheckoutCancel';

// Admin pages
import AdminTitles from '@/pages/admin/AdminTitles';

function App() {
  return (
    <AuthProvider>
      <TierProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/signin" replace />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/signup/complete" element={<CompleteProfile />} />

            {/* Protected buyer routes */}
            <Route
              path="/buyers/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyers/titles"
              element={
                <ProtectedRoute>
                  <Titles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyers/titles/:titleId"
              element={
                <ProtectedRoute>
                  <TitleDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyers/saved"
              element={
                <ProtectedRoute>
                  <Saved />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyers/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyers/plan"
              element={
                <ProtectedRoute>
                  <Plan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyers/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyers/checkout/success"
              element={
                <ProtectedRoute>
                  <CheckoutSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyers/checkout/cancel"
              element={
                <ProtectedRoute>
                  <CheckoutCancel />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/titles"
              element={
                <ProtectedRoute>
                  <AdminTitles />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/signin" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </TierProvider>
    </AuthProvider>
  );
}

export default App;
