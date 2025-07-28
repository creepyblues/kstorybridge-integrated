import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { testSupabaseConnection, quickConnectionTest } from '../utils/testSupabaseConnection';
import { supabase } from '../integrations/supabase/client';

interface ConnectionResult {
  success: boolean;
  error?: string;
  results?: {
    connection: boolean;
    dataFetching: boolean;
    authentication: boolean;
    currentUser: string | null;
    tables: Array<{
      table: string;
      accessible: boolean;
      error?: string;
      rowCount?: number;
    }>;
    sampleData: any[];
  };
}

const DebugSupabase = () => {
  const [testResult, setTestResult] = useState<ConnectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quickTest, setQuickTest] = useState<{ connected: boolean; error?: string } | null>(null);

  // Run quick test on component mount
  useEffect(() => {
    const runQuickTest = async () => {
      const result = await quickConnectionTest();
      setQuickTest(result);
    };
    runQuickTest();
  }, []);

  const runFullTest = async () => {
    setIsLoading(true);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthStatus = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Auth session:', session);
    console.log('Auth error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Supabase Connection Debug</h1>
        
        {/* Quick Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            {quickTest ? (
              <div className={`p-4 rounded-lg ${quickTest.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {quickTest.connected ? (
                  <span>✅ Supabase connection is working</span>
                ) : (
                  <span>❌ Connection failed: {quickTest.error}</span>
                )}
              </div>
            ) : (
              <div className="animate-pulse">Testing connection...</div>
            )}
          </CardContent>
        </Card>

        {/* Connection Config Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuration Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Supabase URL:</strong> https://dlrnrgcoguxlkkcitlpd.supabase.co</p>
            <p><strong>Project ID:</strong> dlrnrgcoguxlkkcitlpd</p>
            <p><strong>Client configured:</strong> ✅ Yes</p>
            <p><strong>Storage:</strong> localStorage</p>
            <p><strong>Persist Session:</strong> ✅ Yes</p>
            <p><strong>Auto Refresh:</strong> ✅ Yes</p>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runFullTest} 
              disabled={isLoading}
              className="mr-4"
            >
              {isLoading ? 'Running Full Test...' : 'Run Full Connection Test'}
            </Button>
            
            <Button 
              onClick={testAuthStatus} 
              variant="outline"
            >
              Check Auth Status
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>
                Full Test Results
                {testResult.success ? (
                  <span className="ml-2 text-green-600">✅ Success</span>
                ) : (
                  <span className="ml-2 text-red-600">❌ Failed</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResult.success && testResult.results ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Connection Status</h3>
                    <ul className="space-y-1">
                      <li>Basic Connection: {testResult.results.connection ? '✅' : '❌'}</li>
                      <li>Data Fetching: {testResult.results.dataFetching ? '✅' : '❌'}</li>
                      <li>Authentication: {testResult.results.authentication ? '✅' : '❌'}</li>
                      <li>Current User: {testResult.results.currentUser || 'Not authenticated'}</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Table Access</h3>
                    <ul className="space-y-1">
                      {testResult.results.tables.map((table) => (
                        <li key={table.table}>
                          {table.table}: {table.accessible ? '✅' : '❌'}
                          {table.error && <span className="text-red-600 ml-2">({table.error})</span>}
                          {table.rowCount !== undefined && <span className="text-gray-600 ml-2">({table.rowCount} rows)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Sample Data</h3>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(testResult.results.sampleData, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  <strong>Error:</strong> {testResult.error}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DebugSupabase;