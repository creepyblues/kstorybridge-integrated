import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import AnalyticsProvider from '@/components/AnalyticsProvider'
import { Toaster } from '@/components/ui/toaster'
import { SessionInactivityMonitor } from '@/components/SessionInactivityMonitor'

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

// Auth pages
import SignUp from '@/pages/auth/SignUp'
import SignIn from '@/pages/auth/SignIn'
import AuthCallback from '@/pages/auth/AuthCallback'
import CompleteProfile from '@/pages/auth/CompleteProfile'

// Protected pages
import Home from '@/pages/Home'
import Titles from '@/pages/Titles'
import TitleDetail from '@/pages/TitleDetail'
import AddTitle from '@/pages/AddTitle'
import EditTitle from '@/pages/EditTitle'
import QuickAddTitle from '@/pages/QuickAddTitle'
import Profile from '@/pages/Profile'
import Requests from '@/pages/Requests'
import News from '@/pages/News'
import LearningCenter from '@/pages/LearningCenter'
import PostDetail from '@/pages/PostDetail'
import Plan from '@/pages/Plan'
import Billing from '@/pages/Billing'
import PaymentSuccess from '@/pages/PaymentSuccess'

// Admin tools
import { ToolsRouter } from '@/pages/tools/ToolsRouter'

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AnalyticsProvider />
            <SessionInactivityMonitor />
            <Toaster />
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/signin" replace />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/complete-profile" element={<CompleteProfile />} />

            {/* Protected routes */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/titles"
              element={
                <ProtectedRoute>
                  <Titles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/titles/quick-add"
              element={
                <ProtectedRoute>
                  <QuickAddTitle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/titles/add-title"
              element={
                <ProtectedRoute>
                  <AddTitle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/titles/:titleId/edit"
              element={
                <ProtectedRoute>
                  <EditTitle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/titles/:titleId"
              element={
                <ProtectedRoute>
                  <TitleDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plan"
              element={
                <ProtectedRoute>
                  <Plan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <Requests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news"
              element={
                <ProtectedRoute>
                  <News />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning-center"
              element={
                <ProtectedRoute>
                  <LearningCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning-center/:slug"
              element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/updates/:slug"
              element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              }
            />

            {/* Admin tools */}
            <Route
              path="/tools/*"
              element={
                <AdminProtectedRoute>
                  <ToolsRouter />
                </AdminProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-black mb-4">404</h1>
        <p className="text-gray-600">Page not found</p>
      </div>
    </div>
  )
}

export default App
