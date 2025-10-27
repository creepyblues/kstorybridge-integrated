import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { 
  ArrowLeft, 
  Database, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  Square, 
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { contentProcessingService } from '@/services/contentProcessingService';
import { vectorSearchService } from '@/services/vectorSearchService';
import { getProfilePath } from '@/utils/navigation';

export default function VectorSearchManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [vectorStatus, setVectorStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user is authorized (same users as OpenAI chatbot)
  const isAuthorized = user?.email === 'sungho@dadble.com' || user?.email === 'kevin@sandstoneartists.com';

  useEffect(() => {
    if (!isAuthorized) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the Vector Search Manager.",
        variant: "destructive",
      });
      const accountType = user?.user_metadata?.account_type || 'buyer';
      navigate(getProfilePath(accountType));
      return;
    }

    loadStatus();
  }, [isAuthorized, navigate, toast]);

  const loadStatus = async () => {
    try {
      const [processing, service, vector] = await Promise.all([
        contentProcessingService.getProcessingStatus(),
        contentProcessingService.checkEmbeddingServiceStatus(),
        vectorSearchService.getSearchStatus()
      ]);
      
      setProcessingStatus(processing);
      setServiceStatus(service);
      setVectorStatus(vector);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const handleProcessAll = async () => {
    if (!serviceStatus?.configured) {
      toast({
        title: "Not Configured",
        description: "OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your environment.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      toast({
        title: "Processing Started",
        description: "Content processing pipeline has begun. This may take several minutes...",
      });

      const result = await contentProcessingService.processAllTitles();
      
      toast({
        title: "Processing Complete",
        description: `Processed ${result.processed} titles successfully, ${result.failed} failed.`,
        variant: result.failed === 0 ? "default" : "destructive",
      });

      await loadStatus();
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDryRun = async () => {
    setIsLoading(true);
    try {
      const result = await contentProcessingService.processAllTitles({ dryRun: true });
      
      toast({
        title: "Dry Run Complete",
        description: `Would process ${result.total} titles.`,
      });

      await loadStatus();
    } catch (error: any) {
      toast({
        title: "Dry Run Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbortProcessing = () => {
    contentProcessingService.abortProcessing();
    toast({
      title: "Abort Requested",
      description: "Processing will stop after current batch completes.",
    });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />;
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <Button
            onClick={() => {
              const accountType = user?.user_metadata?.account_type || 'buyer';
              navigate(getProfilePath(accountType));
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-midnight-ink leading-tight mb-2">
              🔍 Vector Search Manager
            </h2>
            <p className="text-sm sm:text-base text-midnight-ink-600">
              Manage content processing and vector search functionality
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>OpenAI API Configured</span>
                <div className={`flex items-center gap-2 ${getStatusColor(serviceStatus?.configured)}`}>
                  {getStatusIcon(serviceStatus?.configured)}
                  <span>{serviceStatus?.configured ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Vector Search Enabled</span>
                <div className={`flex items-center gap-2 ${getStatusColor(serviceStatus?.vectorSearchEnabled)}`}>
                  {getStatusIcon(serviceStatus?.vectorSearchEnabled)}
                  <span>{serviceStatus?.vectorSearchEnabled ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Total Titles</span>
                <span className="font-mono">{serviceStatus?.totalTitles || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>With Embeddings</span>
                <span className="font-mono text-green-600">{serviceStatus?.titlesWithEmbeddings || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Need Processing</span>
                <span className="font-mono text-orange-600">{serviceStatus?.titlesNeedingProcessing || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Vector Search Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Vector Search Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Search Enabled</span>
                <div className={`flex items-center gap-2 ${getStatusColor(vectorStatus?.vector_search_enabled)}`}>
                  {getStatusIcon(vectorStatus?.vector_search_enabled)}
                  <span>{vectorStatus?.vector_search_enabled ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Indexed Titles</span>
                <span className="font-mono">{vectorStatus?.total_indexed_titles || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Embedding Model</span>
                <span className="text-sm text-gray-600">{vectorStatus?.embedding_model || 'N/A'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Last Processed</span>
                <span className="text-sm text-gray-600">
                  {vectorStatus?.last_processing_date 
                    ? new Date(vectorStatus.last_processing_date).toLocaleDateString()
                    : 'Never'
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Processing Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Processing Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {processingStatus?.inProgress ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Clock className="w-5 h-5 animate-pulse" />
                    <span className="font-medium">Processing in progress...</span>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span>Progress</span>
                      <span className="font-mono">
                        {processingStatus.processed + processingStatus.failed}/{processingStatus.total}
                      </span>
                    </div>
                    
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${((processingStatus.processed + processingStatus.failed) / processingStatus.total) * 100}%`
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>✅ {processingStatus.processed} completed</span>
                      <span>❌ {processingStatus.failed} failed</span>
                      {processingStatus.estimatedTimeRemaining && (
                        <span>⏱️ {formatDuration(processingStatus.estimatedTimeRemaining)} remaining</span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleAbortProcessing}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Abort Processing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {processingStatus?.startTime && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Last Processing Session</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <div className="font-mono">{processingStatus.total}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Completed:</span>
                          <div className="font-mono text-green-600">{processingStatus.processed}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Failed:</span>
                          <div className="font-mono text-red-600">{processingStatus.failed}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Started:</span>
                          <div className="text-xs">{new Date(processingStatus.startTime).toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {processingStatus.errors.length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {processingStatus.errors.length} errors (click to view)
                          </summary>
                          <div className="mt-2 bg-red-50 rounded p-2 text-sm text-red-700">
                            {processingStatus.errors.map((error: string, idx: number) => (
                              <div key={idx}>{error}</div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleDryRun}
                      disabled={isLoading || !serviceStatus?.configured}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      Dry Run
                    </Button>
                    
                    <Button
                      onClick={handleProcessAll}
                      disabled={isLoading || !serviceStatus?.configured || (serviceStatus?.titlesNeedingProcessing === 0)}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Play className="w-4 h-4" />
                      Process All Titles
                    </Button>
                    
                    {processingStatus?.failed > 0 && (
                      <Button
                        onClick={() => contentProcessingService.reprocessFailedTitles()}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center gap-2 text-orange-600 border-orange-300"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Retry Failed ({processingStatus.failed})
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Information Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                About Vector Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What is Vector Search?</h4>
                <p className="text-sm text-blue-800">
                  Vector search uses AI embeddings to understand the semantic meaning of content, enabling 
                  the chatbot to find titles based on themes, mood, and context rather than just keywords.
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Benefits</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• More accurate content recommendations</li>
                  <li>• Understanding of nuanced user preferences</li>
                  <li>• Better matching of themes and moods</li>
                  <li>• Semantic search capabilities</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">Setup Requirements</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• OpenAI API key configured in environment</li>
                  <li>• PostgreSQL with vector extension enabled</li>
                  <li>• All titles processed with embeddings</li>
                  <li>• Database migrations applied</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}