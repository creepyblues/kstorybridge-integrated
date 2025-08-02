import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from '@/hooks/useAdminAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLogin from '@/pages/AdminLogin';
import AdminTitles from '@/pages/AdminTitles';
import AdminTitleDetail from '@/pages/AdminTitleDetail';
import AdminTitleEdit from '@/pages/AdminTitleEdit';
import { Toaster } from '@/components/ui/sonner';
import '@/index.css';

function App() {
  return (
    <AdminAuthProvider>
      <Router>
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
          <Route path="/" element={<Navigate to="/titles" replace />} />
          <Route path="*" element={<Navigate to="/titles" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </AdminAuthProvider>
  );
}

export default App;