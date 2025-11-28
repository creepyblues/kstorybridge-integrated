import AdminLayout from '@/components/layout/AdminLayout';
import { TestTube } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
export default function ScraperTest() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TestTube className="h-8 w-8 text-hanok-teal" />
            <h1 className="text-3xl font-bold text-black">Scraper Testing</h1>
          </div>
          <p className="text-gray-600">Test web scraping functionality for titles</p>
        </div>

        {/* Coming Soon Card */}
        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardHeader>
            <CardTitle className="text-black">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              The scraper testing functionality will be available soon. This tool will allow you to test
              web scraping for title metadata from various platforms.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
