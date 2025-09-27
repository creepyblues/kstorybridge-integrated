import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { MessagingTab } from './MessagingTab';

export default function MessagingPage() {
  const { user } = useAuth();

  const isAdmin = user?.email === 'sungho@dadble.com' || user?.email === 'kevin@sandstoneartists.com';

  if (!isAdmin) {
    return <Navigate to="/docs" replace />;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Messaging Management</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Centralized interface to update page titles, descriptions, CTAs, and empty states across the entire application.
            Manage all user-facing messaging from one location.
          </p>
        </div>

        <MessagingTab />
      </div>
    </PageContainer>
  );
}