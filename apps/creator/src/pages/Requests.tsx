import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Requests() {
  return (
    <MainLayout>
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold text-black mb-8">My Requests</h1>

        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardHeader>
            <CardTitle>Buyer Requests</CardTitle>
            <CardDescription>
              View and manage inquiries from media buyers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center py-8">
              No requests yet. Requests from buyers will appear here.
            </p>
            <p className="text-sm text-gray-500 text-center mt-4">
              Phase 4: Requests functionality will be added from creator v1
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
