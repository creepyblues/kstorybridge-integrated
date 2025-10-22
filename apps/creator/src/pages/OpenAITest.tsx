import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";
import { useToast } from "@/hooks/use-toast";import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { openaiService } from "@/services/openaiService";

export default function OpenAITest() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    apiKeyExists: boolean;
    apiKeyFormat: boolean;
    connectionTest: boolean | null;
    sampleResponse: string | null;
    error: string | null;
  }>({
    apiKeyExists: false,
    apiKeyFormat: false,
    connectionTest: null,
    sampleResponse: null,
    error: null,
  });

  const runDiagnostics = async () => {
    setTesting(true);
    setTestResults({
      apiKeyExists: false,
      apiKeyFormat: false,
      connectionTest: null,
      sampleResponse: null,
      error: null,
    });

    try {
      // Test 1: Check if API key exists
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      console.log('API Key check:', apiKey ? 'Present' : 'Missing');
      console.log('API Key value:', apiKey ? `${apiKey.substring(0, 7)}...` : 'undefined');
      
      const apiKeyExists = !!apiKey && apiKey !== 'sk-your_actual_api_key_here';
      
      // Test 2: Check API key format
      const apiKeyFormat = apiKey ? apiKey.startsWith('sk-') && apiKey.length > 20 : false;
      
      setTestResults(prev => ({
        ...prev,
        apiKeyExists,
        apiKeyFormat,
      }));

      if (!apiKeyExists) {
        setTestResults(prev => ({
          ...prev,
          error: 'API key not found or not replaced in .env.local file'
        }));
        return;
      }

      if (!apiKeyFormat) {
        setTestResults(prev => ({
          ...prev,
          error: 'API key format invalid. Should start with "sk-" and be longer than 20 characters'
        }));
        return;
      }

      // Test 3: Test connection
      console.log('Testing OpenAI connection...');
      const connectionTest = await openaiService.testConnection();
      
      setTestResults(prev => ({
        ...prev,
        connectionTest,
      }));

      if (!connectionTest) {
        setTestResults(prev => ({
          ...prev,
          error: 'Connection test failed. Check your API key or account status.'
        }));
        return;
      }

      // Test 4: Generate sample response (simple test without loading all titles)
      console.log('Generating sample response...');
      const response = await openaiService.generateChatResponse("Hello, can you recommend a romantic comedy webtoon?");
      
      setTestResults(prev => ({
        ...prev,
        sampleResponse: response.message,
      }));

      toast({
        title: "✅ OpenAI API Test Successful",
        description: "All tests passed! Your API is working correctly.",
      });

    } catch (error: any) {
      console.error('OpenAI test error:', error);
      setTestResults(prev => ({
        ...prev,
        error: error.message || 'Unknown error occurred',
        connectionTest: false,
      }));

      toast({
        title: "❌ OpenAI API Test Failed",
        description: error.message || "Check console for details",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const TestResult = ({ label, status, details }: { 
    label: string; 
    status: boolean | null; 
    details?: string;
  }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        {status === null ? (
          <AlertCircle className="w-5 h-5 text-gray-400" />
        ) : status ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
        <span className="font-medium">{label}</span>
      </div>
      {details && (
        <span className="text-sm text-gray-600">{details}</span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-midnight-ink mb-2">
            🔧 OpenAI API Diagnostics
          </h2>
          <p className="text-gray-600">
            Test your OpenAI API configuration and troubleshoot issues
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
                  <li>Get API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></li>
                  <li>Copy the key (starts with "sk-")</li>
                  <li>Replace "sk-your_actual_api_key_here" in .env.local with your real key</li>
                  <li>Restart your development server</li>
                  <li>Click "Run Diagnostics" below</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={runDiagnostics}
                  disabled={testing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    "Run Diagnostics"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <TestResult
                label="API Key Present"
                status={testResults.apiKeyExists}
                details={testResults.apiKeyExists ? "✓ Found" : "✗ Missing"}
              />
              
              <TestResult
                label="API Key Format"
                status={testResults.apiKeyFormat}
                details={testResults.apiKeyFormat ? "✓ Valid format" : "✗ Invalid format"}
              />
              
              <TestResult
                label="Connection Test"
                status={testResults.connectionTest}
                details={
                  testResults.connectionTest === null ? "Not tested" :
                  testResults.connectionTest ? "✓ Connected" : "✗ Failed"
                }
              />

              {testResults.error && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-1">Error:</h4>
                  <p className="text-red-800 text-sm">{testResults.error}</p>
                </div>
              )}

              {testResults.sampleResponse && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">✅ Sample AI Response:</h4>
                  <p className="text-green-800 text-sm whitespace-pre-wrap">
                    {testResults.sampleResponse}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">API Key Status:</span>
                <span className="ml-2">
                  {import.meta.env.VITE_OPENAI_API_KEY ? 
                    (import.meta.env.VITE_OPENAI_API_KEY === 'sk-your_actual_api_key_here' ? 
                      '🔴 Not configured' : 
                      '🟢 Configured'
                    ) : 
                    '🔴 Missing'
                  }
                </span>
              </div>
              <div>
                <span className="font-medium">Service Status:</span>
                <span className="ml-2">
                  {openaiService.getUsageInfo().configured ? '🟢 Initialized' : '🔴 Not initialized'}
                </span>
              </div>
              <div>
                <span className="font-medium">Model:</span>
                <span className="ml-2">{openaiService.getUsageInfo().model}</span>
              </div>
              <div>
                <span className="font-medium">Environment:</span>
                <span className="ml-2">{import.meta.env.DEV ? 'Development' : 'Production'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}