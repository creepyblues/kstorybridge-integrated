import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@kstorybridge/ui';
import { Badge } from '@kstorybridge/ui';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Shield } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface DebugInfo {
  hasSession: boolean;
  userEmail: string | null;
  adminQueryResult: any;
  adminQueryError: any;
  suggestions: string[];
}

export default function AdminAuthDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const { retryProfileLoad } = useAdminAuth();

  const runDiagnostics = async () => {
    setIsDebugging(true);
    console.log('🔍 Running admin auth diagnostics...');

    try {
      // 1. Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check:', { session: !!session, error: sessionError });

      if (!session) {
        setDebugInfo({
          hasSession: false,
          userEmail: null,
          adminQueryResult: null,
          adminQueryError: null,
          suggestions: ['User is not authenticated', 'Please log in with valid credentials']
        });
        return;
      }

      // 2. Test admin query
      const { data: adminData, error: adminError } = await supabase
        .from('admin')
        .select('*')
        .eq('email', session.user.email)
        .eq('active', true);

      console.log('Admin query:', { data: adminData, error: adminError });

      const suggestions: string[] = [];
      
      if (adminError) {
        if (adminError.code === 'PGRST116') {
          suggestions.push('No admin record found for this email');
          suggestions.push(`Add admin record: INSERT INTO public.admin (email, full_name, active) VALUES ('${session.user.email}', 'Admin User', true);`);
        } else if (adminError.code === '42501') {
          suggestions.push('Permission denied - RLS policy issue');
          suggestions.push('Run the fix-admin-access.sql script to fix policies');
        } else {
          suggestions.push('Database connection or configuration issue');
          suggestions.push('Check Supabase connection and admin table existence');
        }
      } else if (!adminData || adminData.length === 0) {
        suggestions.push('Admin record exists but query returned no results');
        suggestions.push('Check if admin record is active and email matches exactly');
      } else {
        suggestions.push('Admin record found - authentication should work');
        suggestions.push('Check useAdminAuth hook implementation');
      }

      setDebugInfo({
        hasSession: true,
        userEmail: session.user.email || null,
        adminQueryResult: adminData,
        adminQueryError: adminError,
        suggestions
      });

    } catch (error) {
      console.error('Diagnostics failed:', error);
      setDebugInfo({
        hasSession: false,
        userEmail: null,
        adminQueryResult: null,
        adminQueryError: error,
        suggestions: ['Exception occurred during diagnostics', 'Check browser console for details']
      });
    } finally {
      setIsDebugging(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-orange-500" />
            Admin Authentication Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Diagnostics</h3>
            <Button 
              onClick={runDiagnostics}
              disabled={isDebugging}
              variant="outline"
              size="sm"
            >
              {isDebugging ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Re-run
            </Button>
          </div>

          {debugInfo ? (
            <div className="space-y-4">
              {/* Session Status */}
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <span className="font-medium">Authentication Session</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.hasSession)}
                  <Badge variant={debugInfo.hasSession ? "default" : "destructive"}>
                    {debugInfo.hasSession ? "Active" : "None"}
                  </Badge>
                </div>
              </div>

              {/* User Email */}
              {debugInfo.userEmail && (
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <span className="font-medium">User Email</span>
                  <Badge variant="outline">{debugInfo.userEmail}</Badge>
                </div>
              )}

              {/* Admin Query Status */}
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <span className="font-medium">Admin Record Query</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(!debugInfo.adminQueryError && debugInfo.adminQueryResult?.length > 0)}
                  <Badge variant={!debugInfo.adminQueryError && debugInfo.adminQueryResult?.length > 0 ? "default" : "destructive"}>
                    {!debugInfo.adminQueryError && debugInfo.adminQueryResult?.length > 0 ? "Found" : "Failed"}
                  </Badge>
                </div>
              </div>

              {/* Error Details */}
              {debugInfo.adminQueryError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Error Details</h4>
                  <p className="text-sm text-red-700">
                    <strong>Code:</strong> {debugInfo.adminQueryError.code || 'Unknown'}
                  </p>
                  <p className="text-sm text-red-700">
                    <strong>Message:</strong> {debugInfo.adminQueryError.message || 'Unknown error'}
                  </p>
                </div>
              )}

              {/* Admin Data */}
              {debugInfo.adminQueryResult && debugInfo.adminQueryResult.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Admin Record Found</h4>
                  <pre className="text-xs text-green-700 bg-green-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(debugInfo.adminQueryResult[0], null, 2)}
                  </pre>
                  <div className="mt-3">
                    <Button
                      onClick={retryProfileLoad}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Retry Profile Load
                    </Button>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Suggestions</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {debugInfo.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex">
                      <span className="mr-2">•</span>
                      <span className="font-mono text-xs bg-blue-100 px-1 rounded">
                        {suggestion}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : isDebugging ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Running diagnostics...</p>
            </div>
          ) : null}

          <div className="text-center text-sm text-gray-500">
            Check the browser console for detailed logs
          </div>
        </CardContent>
      </Card>
    </div>
  );
}