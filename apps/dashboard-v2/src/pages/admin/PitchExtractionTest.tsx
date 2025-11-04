import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function PitchExtractionTest() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-hanok-teal" />
            <h1 className="text-3xl font-bold text-black">Pitch Extraction Testing</h1>
          </div>
          <p className="text-gray-600">Test AI-powered pitch deck analysis</p>
        </div>

        {/* Coming Soon Card */}
        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardHeader>
            <CardTitle className="text-black">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              The pitch extraction testing functionality will be available soon. This tool will allow you to test
              AI-powered analysis of pitch decks and extract key information.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
