import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@kstorybridge/ui";
import { lazy, Suspense } from 'react';

import { AdminAuthProvider } from '@/hooks/useAdminAuth';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy load admin page components for code splitting
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const AdminTitles = lazy(() => import('@/pages/AdminTitles'));
const AdminTitleDetail = lazy(() => import('@/pages/AdminTitleDetail'));
const AdminTitleEdit = lazy(() => import('@/pages/AdminTitleEdit'));
const AdminFeaturedTitles = lazy(() => import('@/pages/AdminFeaturedTitles'));
const AdminAddTitle = lazy(() => import('@/pages/AdminAddTitle'));
const AdminScraperTest = lazy(() => import('@/pages/AdminScraperTest'));
const AdminUserApproval = lazy(() => import('@/pages/AdminUserApproval'));

import '@/index.css';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
  </div>
);

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/titles" element={
            <ProtectedRoute>
              <AdminTitles />
            </ProtectedRoute>
          } />
          <Route path="/titles/:titleId" element={
            <ProtectedRoute>
              <AdminTitleDetail />
            </ProtectedRoute>
          } />
          <Route path="/titles/:titleId/edit" element={
            <ProtectedRoute>
              <AdminTitleEdit />
            </ProtectedRoute>
          } />
          <Route path="/featured-titles" element={
            <ProtectedRoute>
              <AdminFeaturedTitles />
            </ProtectedRoute>
          } />
          <Route path="/titles/new" element={
            <ProtectedRoute>
              <AdminAddTitle />
            </ProtectedRoute>
          } />
          <Route path="/scraper-test" element={
            <ProtectedRoute>
              <AdminScraperTest />
            </ProtectedRoute>
          } />
          <Route path="/user-approval" element={
            <ProtectedRoute>
              <AdminUserApproval />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/titles" replace />} />
          <Route path="*" element={<Navigate to="/titles" replace />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster />
    </AdminAuthProvider>
  );
}

export default App;