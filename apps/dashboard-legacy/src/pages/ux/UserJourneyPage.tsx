import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { UserJourneyTab } from './UserJourneyTab';

export default function UserJourneyPage() {
  const { user } = useAuth();

  const isAdmin = user?.email === 'sungho@dadble.com' || user?.email === 'kevin@sandstoneartists.com';

  if (!isAdmin) {
    return <Navigate to="/docs" replace />;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">User Journey Maps</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Interactive flowcharts visualizing complete user experiences from signup to dashboard navigation.
            Download diagrams as SVG or PNG for presentations and documentation.
          </p>
        </div>

        <UserJourneyTab />
      </div>
    </PageContainer>
  );
}