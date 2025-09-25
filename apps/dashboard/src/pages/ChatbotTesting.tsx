import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, useToast } from "@kstorybridge/ui";
import { ArrowLeft, Play, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { openaiService } from '@/services/openaiService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  success: boolean;
  responseTime: number;
  titlesCount: number;
  firstTitle: string;
  messagePreview: string;
  vectorSearchUsed?: boolean;
  error?: string;
  environment: string;
  executionPath: string;
}

interface ComparisonResults {
  direct?: TestResult;
  localBackend?: TestResult;
  production?: TestResult;
}

export default function ChatbotTesting() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ComparisonResults>({});
  const [isTestingDirect, setIsTestingDirect] = useState(false);
  const [isTestingLocal, setIsTestingLocal] = useState(false);
  const [isTestingProduction, setIsTestingProduction] = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const defaultQuery = "I'm looking for action content similar to John Wick with intense fight scenes";

  const getSupabaseToken = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session found. Please sign in.');
    }
    return session.access_token;
  };

  const testDirectMode = async (testQuery: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      // Test with current environment (should use direct client if configured)
      const result = await openaiService.generateChatResponse(
        testQuery, 
        [], 
        user?.id || 'test-user', 
        'test-session-direct'
      );
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime,
        titlesCount: result.recommendedTitles?.length || 0,
        firstTitle: result.recommendedTitles?.[0]?.title_name_en || 'None',
        messagePreview: result.message.substring(0, 100) + '...',
        vectorSearchUsed: result.vectorSearchUsed,
        environment: 'localhost',
        executionPath: 'direct-client'
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        titlesCount: 0,
        firstTitle: 'Error',
        messagePreview: 'Failed to get response',
        error: error.message,
        environment: 'localhost',
        executionPath: 'direct-client'
      };
    }
  };

  const testLocalBackend = async (testQuery: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const token = await getSupabaseToken();
      const localUrl = import.meta.env.VITE_LOCAL_BACKEND_URL || 'http://localhost:3001';
      
      console.log('🧪 Testing local backend:', `${localUrl}/api/openai-enhanced`);
      
      const response = await fetch(`${localUrl}/api/openai-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: testQuery,
          conversationHistory: [],
          userId: user?.id || 'test-user',
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        responseTime,
        titlesCount: result.recommendedTitles?.length || 0,
        firstTitle: result.recommendedTitles?.[0]?.title_name_en || 'None',
        messagePreview: result.message?.substring(0, 100) + '...' || 'No message',
        vectorSearchUsed: result.vectorSearchUsed,
        environment: 'local-backend',
        executionPath: 'local-backend-api'
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        titlesCount: 0,
        firstTitle: 'Error',
        messagePreview: error.message || 'Failed to get response',
        error: error.message,
        environment: 'local-backend',
        executionPath: 'local-backend-api'
      };
    }
  };

  const testProduction = async (testQuery: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const token = await getSupabaseToken();
      
      console.log('🔴 Testing production API:', '/api/openai-enhanced');
      
      const response = await fetch('/api/openai-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: testQuery,
          conversationHistory: [],
          userId: user?.id || 'test-user',
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        responseTime,
        titlesCount: result.recommendedTitles?.length || 0,
        firstTitle: result.recommendedTitles?.[0]?.title_name_en || 'None',
        messagePreview: result.message?.substring(0, 100) + '...' || 'No message',
        vectorSearchUsed: result.vectorSearchUsed,
        environment: 'production',
        executionPath: 'production-api'
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        titlesCount: 0,
        firstTitle: 'Error',
        messagePreview: error.message || 'Failed to get response',
        error: error.message,
        environment: 'production',
        executionPath: 'production-api'
      };
    }
  };

  const testSingleMode = async (mode: 'direct' | 'localBackend' | 'production') => {
    const testQuery = query.trim() || defaultQuery;
    
    try {
      let result: TestResult;
      
      if (mode === 'direct') {
        setIsTestingDirect(true);
        result = await testDirectMode(testQuery);
        setResults(prev => ({ ...prev, direct: result }));
      } else if (mode === 'localBackend') {
        setIsTestingLocal(true);
        result = await testLocalBackend(testQuery);
        setResults(prev => ({ ...prev, localBackend: result }));
      } else {
        setIsTestingProduction(true);
        result = await testProduction(testQuery);
        setResults(prev => ({ ...prev, production: result }));
      }

      if (!result.success) {
        toast({
          title: `${mode} Test Failed`,
          description: result.error || 'Unknown error occurred',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Test Error",
        description: error.message || 'Failed to run test',
        variant: "destructive"
      });
    } finally {
      setIsTestingDirect(false);
      setIsTestingLocal(false);
      setIsTestingProduction(false);
    }
  };

  const testAllModes = async () => {
    const testQuery = query.trim() || defaultQuery;
    setIsTestingAll(true);
    
    try {
      console.log('🚀 Testing all environments with query:', testQuery);
      
      // Test all modes in parallel
      const [directResult, localBackendResult, productionResult] = await Promise.allSettled([
        testDirectMode(testQuery),
        testLocalBackend(testQuery),
        testProduction(testQuery)
      ]);

      const newResults: ComparisonResults = {};
      
      if (directResult.status === 'fulfilled') {
        newResults.direct = directResult.value;
      } else {
        newResults.direct = {
          success: false,
          responseTime: 0,
          titlesCount: 0,
          firstTitle: 'Failed',
          messagePreview: 'Test failed to execute',
          error: directResult.reason?.message || 'Unknown error',
          environment: 'localhost',
          executionPath: 'direct-client'
        };
      }
      
      if (localBackendResult.status === 'fulfilled') {
        newResults.localBackend = localBackendResult.value;
      } else {
        newResults.localBackend = {
          success: false,
          responseTime: 0,
          titlesCount: 0,
          firstTitle: 'Failed',
          messagePreview: 'Test failed to execute',
          error: localBackendResult.reason?.message || 'Unknown error',
          environment: 'local-backend',
          executionPath: 'local-backend-api'
        };
      }
      
      if (productionResult.status === 'fulfilled') {
        newResults.production = productionResult.value;
      } else {
        newResults.production = {
          success: false,
          responseTime: 0,
          titlesCount: 0,
          firstTitle: 'Failed',
          messagePreview: 'Test failed to execute',
          error: productionResult.reason?.message || 'Unknown error',
          environment: 'production',
          executionPath: 'production-api'
        };
      }
      
      setResults(newResults);
      
      // Show success toast
      const successCount = [newResults.direct, newResults.localBackend, newResults.production]
        .filter(result => result?.success).length;
      
      toast({
        title: "Tests Completed",
        description: `${successCount}/3 tests passed successfully`,
        variant: successCount === 3 ? "default" : "destructive"
      });
      
    } catch (error: any) {
      toast({
        title: "Test Suite Error",
        description: error.message || 'Failed to run test suite',
        variant: "destructive"
      });
    } finally {
      setIsTestingAll(false);
    }
  };

  const getStatusIcon = (result?: TestResult) => {
    if (!result) return <div className="w-5 h-5" />;
    
    if (result.success) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (result?: TestResult) => {
    if (!result) return 'border-gray-200';
    return result.success ? 'border-green-200' : 'border-red-200';
  };

  const areResultsMatching = (result1?: TestResult, result2?: TestResult) => {
    if (!result1 || !result2) return null;
    
    return result1.success === result2.success &&
           result1.titlesCount === result2.titlesCount &&
           result1.firstTitle === result2.firstTitle;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate("/profile")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-midnight-ink leading-tight">
              🧪 OpenAI Chatbot Environment Testing
            </h2>
            <p className="text-lg text-midnight-ink-600 mt-2">
              Compare responses across different execution environments
            </p>
          </div>
        </div>

        {/* Test Configuration */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Test Query:</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Enter test query (or leave empty for default):\n\n"${defaultQuery}"`}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-hanok-teal focus:border-hanok-teal"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => testSingleMode('direct')}
                disabled={isTestingDirect || isTestingAll}
                className="flex items-center gap-2"
                variant="outline"
              >
                {isTestingDirect ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Test Direct Client
              </Button>

              <Button
                onClick={() => testSingleMode('localBackend')}
                disabled={isTestingLocal || isTestingAll}
                className="flex items-center gap-2"
                variant="outline"
              >
                {isTestingLocal ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Test Local Backend
              </Button>

              <Button
                onClick={() => testSingleMode('production')}
                disabled={isTestingProduction || isTestingAll}
                className="flex items-center gap-2"
                variant="outline"
              >
                {isTestingProduction ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Test Production
              </Button>

              <Button
                onClick={testAllModes}
                disabled={isTestingAll || isTestingDirect || isTestingLocal || isTestingProduction}
                className="flex items-center gap-2 bg-hanok-teal hover:bg-hanok-teal-600 text-white"
              >
                {isTestingAll ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Test All Environments
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <>
            {/* Individual Results */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {[
                { key: 'direct', title: 'Direct Client', description: 'localhost:8081 → OpenAI API' },
                { key: 'localBackend', title: 'Local Backend', description: 'localhost:3001/api → OpenAI API' },
                { key: 'production', title: 'Production', description: 'production/api → OpenAI API' }
              ].map(({ key, title, description }) => {
                const result = results[key as keyof ComparisonResults];
                return (
                  <Card key={key} className={`border-2 ${getStatusColor(result)}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {getStatusIcon(result)}
                        <div>
                          <h3 className="font-bold text-lg">{title}</h3>
                          <p className="text-sm text-gray-600">{description}</p>
                        </div>
                      </div>
                      
                      {result ? (
                        <div className="space-y-3">
                          {result.success ? (
                            <>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Response Time:</span>
                                  <div className="text-lg font-bold text-hanok-teal">{result.responseTime}ms</div>
                                </div>
                                <div>
                                  <span className="font-medium">Titles Found:</span>
                                  <div className="text-lg font-bold text-hanok-teal">{result.titlesCount}</div>
                                </div>
                              </div>
                              
                              <div>
                                <span className="font-medium text-sm">First Title:</span>
                                <div className="text-sm text-gray-700 font-medium">{result.firstTitle}</div>
                              </div>
                              
                              <div>
                                <span className="font-medium text-sm">Vector Search:</span>
                                <div className={`text-sm font-medium ${result.vectorSearchUsed ? 'text-green-600' : 'text-gray-600'}`}>
                                  {result.vectorSearchUsed ? '✅ Yes' : '❌ No'}
                                </div>
                              </div>
                              
                              <div>
                                <span className="font-medium text-sm">Response Preview:</span>
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 line-clamp-3">
                                  {result.messagePreview}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-red-600">
                              <div className="font-medium">❌ Test Failed</div>
                              <div className="text-sm mt-1">{result.error || 'Unknown error'}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">Not tested yet</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Comparison Table */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  📊 Environment Comparison
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-3 text-left font-medium">Metric</th>
                        <th className="border border-gray-300 p-3 text-center font-medium">Direct Client</th>
                        <th className="border border-gray-300 p-3 text-center font-medium">Local Backend</th>
                        <th className="border border-gray-300 p-3 text-center font-medium">Production</th>
                        <th className="border border-gray-300 p-3 text-center font-medium">Local ↔ Prod Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-3 font-medium">Success</td>
                        <td className="border border-gray-300 p-3 text-center">
                          {results.direct?.success ? '✅' : results.direct ? '❌' : '⏸️'}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {results.localBackend?.success ? '✅' : results.localBackend ? '❌' : '⏸️'}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {results.production?.success ? '✅' : results.production ? '❌' : '⏸️'}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {results.localBackend?.success === results.production?.success ? '✅' : 
                           (results.localBackend && results.production) ? '❌' : '⏸️'}
                        </td>
                      </tr>
                      
                      <tr>
                        <td className="border border-gray-300 p-3 font-medium">Titles Count</td>
                        <td className="border border-gray-300 p-3 text-center">{results.direct?.titlesCount || 0}</td>
                        <td className="border border-gray-300 p-3 text-center">{results.localBackend?.titlesCount || 0}</td>
                        <td className="border border-gray-300 p-3 text-center">{results.production?.titlesCount || 0}</td>
                        <td className="border border-gray-300 p-3 text-center">
                          {results.localBackend?.titlesCount === results.production?.titlesCount ? '✅' : 
                           (results.localBackend && results.production) ? '❌' : '⏸️'}
                        </td>
                      </tr>
                      
                      <tr>
                        <td className="border border-gray-300 p-3 font-medium">First Title</td>
                        <td className="border border-gray-300 p-3 text-center text-xs max-w-32 truncate">
                          {results.direct?.firstTitle || 'None'}
                        </td>
                        <td className="border border-gray-300 p-3 text-center text-xs max-w-32 truncate">
                          {results.localBackend?.firstTitle || 'None'}
                        </td>
                        <td className="border border-gray-300 p-3 text-center text-xs max-w-32 truncate">
                          {results.production?.firstTitle || 'None'}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {results.localBackend?.firstTitle === results.production?.firstTitle ? '✅' : 
                           (results.localBackend && results.production) ? '❌' : '⏸️'}
                        </td>
                      </tr>
                      
                      <tr>
                        <td className="border border-gray-300 p-3 font-medium">Vector Search</td>
                        <td className="border border-gray-300 p-3 text-center">
                          {results.direct?.vectorSearchUsed ? '✅' : results.direct ? '❌' : '⏸️'}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {results.localBackend?.vectorSearchUsed ? '✅' : results.localBackend ? '❌' : '⏸️'}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {results.production?.vectorSearchUsed ? '✅' : results.production ? '❌' : '⏸️'}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {results.localBackend?.vectorSearchUsed === results.production?.vectorSearchUsed ? '✅' : 
                           (results.localBackend && results.production) ? '❌' : '⏸️'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Overall Match Status */}
                <div className="mt-6 p-4 rounded-lg border-2 border-dashed">
                  <div className="flex items-center gap-3">
                    {areResultsMatching(results.localBackend, results.production) ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <div>
                          <div className="font-bold text-green-700">✅ Environment Parity Achieved!</div>
                          <div className="text-sm text-green-600">Local backend perfectly mirrors production behavior</div>
                        </div>
                      </>
                    ) : (results.localBackend && results.production) ? (
                      <>
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                        <div>
                          <div className="font-bold text-orange-700">⚠️ Environment Mismatch Detected</div>
                          <div className="text-sm text-orange-600">Local backend and production show different results</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-6 h-6 text-gray-500" />
                        <div>
                          <div className="font-bold text-gray-700">⏸️ Incomplete Testing</div>
                          <div className="text-sm text-gray-600">Run tests on both local backend and production to compare</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}