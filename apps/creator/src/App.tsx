import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/toaster'

// Auth pages
import SignUp from '@/pages/auth/SignUp'
import SignIn from '@/pages/auth/SignIn'
import AuthCallback from '@/pages/auth/AuthCallback'
import CompleteProfile from '@/pages/auth/CompleteProfile'

// Protected pages
import Home from '@/pages/Home'
import Titles from '@/pages/Titles'
import TitleDetail from '@/pages/TitleDetail'
import AddTitleSurvey from '@/pages/AddTitleSurvey'
import EditTitle from '@/pages/EditTitle'
import Profile from '@/pages/Profile'
import Requests from '@/pages/Requests'
import News from '@/pages/News'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
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
              path="/titles/add-survey"
              element={
                <ProtectedRoute>
                  <AddTitleSurvey />
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

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
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
