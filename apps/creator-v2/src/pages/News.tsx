import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function News() {
  return (
    <MainLayout>
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold text-black mb-8">K-content News</h1>

        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardHeader>
            <CardTitle>Latest News</CardTitle>
            <CardDescription>
              Stay updated with Korean content industry news
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center py-8">
              News feed coming soon. Industry updates will appear here.
            </p>
            <p className="text-sm text-gray-500 text-center mt-4">
              Phase 4: News functionality will be added from creator v1
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
