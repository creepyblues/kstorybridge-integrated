import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DebugTitles: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const info: any = {
        clientConfig: {
          url: supabase.supabaseUrl,
          key: supabase.supabaseKey?.substring(0, 20) + '...',
        },
        tests: {},
        errors: []
      };

      try {
        // Test 1: Basic connection
        console.log('Testing basic connection...');
        const { data: basicData, error: basicError } = await supabase
          .from('titles')
          .select('count(*)', { count: 'exact' });
        
        info.tests.basicConnection = {
          success: !basicError,
          error: basicError?.message,
          count: basicData?.[0]?.count || 'unknown'
        };

        // Test 2: Simple select without filters
        console.log('Testing simple select...');
        const { data: simpleData, error: simpleError } = await supabase
          .from('titles')
          .select('title_id, title_name_kr')
          .limit(3);

        info.tests.simpleSelect = {
          success: !simpleError,
          error: simpleError?.message,
          resultCount: simpleData?.length || 0,
          data: simpleData
        };

        // Test 3: Try to select all columns
        console.log('Testing full select...');
        const { data: fullData, error: fullError } = await supabase
          .from('titles')
          .select('*')
          .limit(1);

        info.tests.fullSelect = {
          success: !fullError,
          error: fullError?.message,
          resultCount: fullData?.length || 0,
          data: fullData
        };

        // Test 4: Check auth state
        console.log('Testing auth state...');
        const { data: authData, error: authError } = await supabase.auth.getUser();
        info.tests.authState = {
          success: !authError,
          error: authError?.message,
          isAuthenticated: !!authData?.user,
          userId: authData?.user?.id || null
        };

        // Test 5: Test with authentication if available
        if (authData?.user) {
          console.log('Testing authenticated query...');
          const { data: authQueryData, error: authQueryError } = await supabase
            .from('titles')
            .select('*')
            .limit(1);

          info.tests.authenticatedQuery = {
            success: !authQueryError,
            error: authQueryError?.message,
            resultCount: authQueryData?.length || 0
          };
        }

        // Test 6: Try different table to see if it's titles-specific
        console.log('Testing other tables...');
        const { data: usersData, error: usersError } = await supabase
          .from('user_buyers')
          .select('id')
          .limit(1);

        info.tests.otherTable = {
          success: !usersError,
          error: usersError?.message,
          table: 'user_buyers',
          resultCount: usersData?.length || 0
        };

      } catch (globalError: any) {
        info.errors.push({
          type: 'Global Error',
          message: globalError.message,
          stack: globalError.stack
        });
      }

      setDebugInfo(info);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Debugging Supabase Titles Connection</h1>
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          Running diagnostics...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Debug Information</h1>
      
      {/* Client Configuration */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Client Configuration</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre className="text-sm">{JSON.stringify(debugInfo.clientConfig, null, 2)}</pre>
        </div>
      </div>

      {/* Test Results */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        <div className="space-y-4">
          {Object.entries(debugInfo.tests || {}).map(([testName, result]: [string, any]) => (
            <div key={testName} className={`p-4 rounded border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className="font-bold text-lg mb-2 capitalize">
                {testName.replace(/([A-Z])/g, ' $1').trim()}
                {result.success ? ' ✅' : ' ❌'}
              </h3>
              
              {result.error && (
                <div className="text-red-600 mb-2">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
              
              {result.count !== undefined && (
                <div><strong>Count:</strong> {result.count}</div>
              )}
              
              {result.resultCount !== undefined && (
                <div><strong>Results:</strong> {result.resultCount}</div>
              )}
              
              {result.isAuthenticated !== undefined && (
                <div><strong>Authenticated:</strong> {result.isAuthenticated ? 'Yes' : 'No'}</div>
              )}
              
              {result.userId && (
                <div><strong>User ID:</strong> {result.userId}</div>
              )}
              
              {result.table && (
                <div><strong>Table:</strong> {result.table}</div>
              )}
              
              {result.data && result.data.length > 0 && (
                <div className="mt-2">
                  <strong>Sample Data:</strong>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Global Errors */}
      {debugInfo.errors && debugInfo.errors.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Global Errors</h2>
          <div className="space-y-2">
            {debugInfo.errors.map((error: any, index: number) => (
              <div key={index} className="bg-red-50 border border-red-200 p-4 rounded">
                <h3 className="font-bold text-red-800">{error.type}</h3>
                <p className="text-red-600">{error.message}</p>
                {error.stack && (
                  <pre className="text-xs text-red-500 mt-2 overflow-x-auto">{error.stack}</pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Possible Issues & Solutions</h2>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Row Level Security (RLS):</strong> The titles table might have RLS enabled. Check if you need to be authenticated or have specific permissions.</li>
            <li><strong>Empty Table:</strong> The table might genuinely be empty. Try inserting test data from the dashboard.</li>
            <li><strong>Column Permissions:</strong> Some columns might not be accessible to the anonymous user role.</li>
            <li><strong>API Key Permissions:</strong> The anon key might not have read permissions on the titles table.</li>
            <li><strong>Filters:</strong> There might be default filters or policies hiding the data.</li>
          </ul>
        </div>
      </div>

      {/* Raw Debug Data */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Raw Debug Data</h2>
        <details className="bg-gray-100 p-4 rounded">
          <summary className="cursor-pointer font-medium">Click to expand</summary>
          <pre className="mt-2 text-xs overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
};

export default DebugTitles;