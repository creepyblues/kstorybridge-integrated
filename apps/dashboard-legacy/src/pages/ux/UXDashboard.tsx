import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kstorybridge/ui';
import { GitBranch, MessageSquare, BarChart3 } from 'lucide-react';
import { UserJourneyTab } from './UserJourneyTab';
import { MessagingTab } from './MessagingTab';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function UXDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('journey');

  const isAdmin = user?.email === 'sungho@dadble.com' || user?.email === 'kevin@sandstoneartists.com';

  if (!isAdmin) {
    return <Navigate to="/docs" replace />;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">UX Management Dashboard</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Manage user journeys, onboarding flows, and messaging across the entire application.
            Visualize user paths and update copy from a centralized interface.
          </p>
        </div>

        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="journey" className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  User Journey
                </TabsTrigger>
                <TabsTrigger value="messaging" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messaging
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2" disabled>
                  <BarChart3 className="h-4 w-4" />
                  Analytics (Coming Soon)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="journey">
                <UserJourneyTab />
              </TabsContent>

              <TabsContent value="messaging">
                <MessagingTab />
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="bg-transparent border-gray-300 shadow-none">
                  <CardHeader>
                    <CardTitle>Analytics Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                      <p className="text-gray-600">
                        User journey analytics, conversion tracking, and messaging A/B testing will be available here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}