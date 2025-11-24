import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  getIntelligenceRecord,
  completeVerification,
  type IntelligenceRecord
} from '@/services/intelligenceService';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

/**
 * Investigation Detail - View and verify intelligence data
 *
 * Features:
 * - View collection metadata
 * - Display raw data from each source
 * - Show collection status and errors
 * - Link to field verification (future enhancement)
 */
export function InvestigationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [record, setRecord] = useState<IntelligenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadRecord();
    }
  }, [id]);

  const loadRecord = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getIntelligenceRecord(id);
      setRecord(data);
    } catch (err) {
      console.error('Failed to load intelligence record:', err);
      setError(err instanceof Error ? err.message : 'Failed to load record');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteVerification = async () => {
    if (!record || !user?.email) return;

    try {
      await completeVerification(record.id, user.email);
      toast({
        title: 'Verification completed',
        description: 'This intelligence record has been marked as verified',
      });
      loadRecord(); // Reload to show updated status
    } catch (err) {
      console.error('Failed to complete verification:', err);
      toast({
        title: 'Failed to complete verification',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'partial_failure':
        return (
          <Badge className="bg-amber-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading intelligence record...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !record) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500">{error || 'Intelligence record not found'}</p>
            <Button
              onClick={() => navigate('/tools')}
              variant="outline"
              className="mt-4 border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            onClick={() => navigate('/tools')}
            variant="outline"
            className="mb-4 border-gray-300 hover:bg-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                {record.title_name_input}
              </h1>
              <p className="text-gray-600 mt-2">
                Intelligence collected on {new Date(record.created_at).toLocaleDateString()}
              </p>
            </div>
            {getStatusBadge(record.collection_status)}
          </div>
        </div>

        {/* Metadata Card */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-black mb-4">Collection Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Collected by:</span>
                <span className="ml-2 text-black font-medium">{record.collected_by}</span>
              </div>
              <div>
                <span className="text-gray-600">Collection Status:</span>
                <span className="ml-2 text-black font-medium">{record.collection_status}</span>
              </div>
              <div>
                <span className="text-gray-600">Verification Status:</span>
                <span className="ml-2 text-black font-medium">{record.verification_status}</span>
              </div>
              <div>
                <span className="text-gray-600">Ingested:</span>
                <span className="ml-2 text-black font-medium">{record.ingested ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-gray-600">Sources Requested:</span>
                <span className="ml-2 text-black font-medium">
                  {record.sources_requested.join(', ')}
                </span>
              </div>
              {record.verified_by && (
                <div>
                  <span className="text-gray-600">Verified by:</span>
                  <span className="ml-2 text-black font-medium">{record.verified_by}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Raw Data Cards */}
        {Object.entries(record.raw_data).map(([source, data]) => (
          <Card key={source} className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-black mb-4 capitalize">
                {source} Data
              </h3>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}

        {/* Collection Errors */}
        {Object.keys(record.collection_errors).length > 0 && (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-black mb-4">Collection Errors</h3>
              <div className="space-y-2">
                {Object.entries(record.collection_errors).map(([source, error]) => (
                  <div key={source} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <span className="font-medium text-black capitalize">{source}:</span>
                      <span className="ml-2 text-red-600">{error}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {record.verification_status === 'pending' && (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-black mb-1">Ready to verify?</h3>
                  <p className="text-sm text-gray-600">
                    Mark this record as verified to proceed with ingestion
                  </p>
                </div>
                <Button
                  onClick={handleCompleteVerification}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Mark as Verified
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Future Enhancement Note */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-black mb-2">Coming Soon</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 bg-black rounded-full mt-1.5" />
                <span>Field-level verification (approve/reject individual fields)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 bg-black rounded-full mt-1.5" />
                <span>Automatic ingestion of verified fields into titles table</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 bg-black rounded-full mt-1.5" />
                <span>Field mapping configuration (e.g., naver.views → titles.views)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
