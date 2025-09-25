import React, { useState } from 'react';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { debugSignupFlow, validateSignupData, TEST_CONFIGS, type SignupDebugResult } from '@/utils/signupDebugger';

const SignupDebugPage: React.FC = () => {
  const [results, setResults] = useState<SignupDebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<'buyer' | 'creator' | 'both'>('buyer');

  const runBuyerTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      const config = {
        ...TEST_CONFIGS.buyerBasic,
        testEmail: `test-buyer-${Date.now()}@example.com`,
        profileData: {
          ...TEST_CONFIGS.buyerBasic.profileData,
          email: `test-buyer-${Date.now()}@example.com`
        }
      };

      console.log('🔍 Testing Buyer Signup Flow with config:', config);

      // First validate the form data
      const validationResult = validateSignupData(config.accountType, config.profileData);
      const testResults = [validationResult];

      if (validationResult.success) {
        // Run the full signup flow test
        const flowResults = await debugSignupFlow(config);
        testResults.push(...flowResults);
      }

      setResults(testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
      setResults([{
        step: 'Test Execution',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const runCreatorTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      const config = {
        ...TEST_CONFIGS.creatorBasic,
        testEmail: `test-creator-${Date.now()}@example.com`,
        profileData: {
          ...TEST_CONFIGS.creatorBasic.profileData,
          email: `test-creator-${Date.now()}@example.com`
        }
      };

      console.log('🔍 Testing Creator Signup Flow with config:', config);

      // First validate the form data
      const validationResult = validateSignupData(config.accountType, config.profileData);
      const testResults = [validationResult];

      if (validationResult.success) {
        // Run the full signup flow test
        const flowResults = await debugSignupFlow(config);
        testResults.push(...flowResults);
      }

      setResults(testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
      setResults([{
        step: 'Test Execution',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const runBothTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      console.log('🚀 Testing Both Signup Flows...');

      // Run buyer test
      const buyerConfig = {
        ...TEST_CONFIGS.buyerBasic,
        testEmail: `test-buyer-${Date.now()}@example.com`,
        profileData: {
          ...TEST_CONFIGS.buyerBasic.profileData,
          email: `test-buyer-${Date.now()}@example.com`
        }
      };

      const buyerValidation = validateSignupData(buyerConfig.accountType, buyerConfig.profileData);
      let allResults = [{ ...buyerValidation, step: `Buyer - ${buyerValidation.step}` }];

      if (buyerValidation.success) {
        const buyerResults = await debugSignupFlow(buyerConfig);
        allResults.push(...buyerResults.map(r => ({ ...r, step: `Buyer - ${r.step}` })));
      }

      // Run creator test
      const creatorConfig = {
        ...TEST_CONFIGS.creatorBasic,
        testEmail: `test-creator-${Date.now()}@example.com`,
        profileData: {
          ...TEST_CONFIGS.creatorBasic.profileData,
          email: `test-creator-${Date.now()}@example.com`
        }
      };

      const creatorValidation = validateSignupData(creatorConfig.accountType, creatorConfig.profileData);
      allResults.push({ ...creatorValidation, step: `Creator - ${creatorValidation.step}` });

      if (creatorValidation.success) {
        const creatorResults = await debugSignupFlow(creatorConfig);
        allResults.push(...creatorResults.map(r => ({ ...r, step: `Creator - ${r.step}` })));
      }

      setResults(allResults);
    } catch (error) {
      console.error('Test execution failed:', error);
      setResults([{
        step: 'Test Execution',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const runSelectedTest = () => {
    switch (selectedTest) {
      case 'buyer':
        return runBuyerTest();
      case 'creator':
        return runCreatorTest();
      case 'both':
        return runBothTests();
    }
  };

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-midnight-ink mb-8">
          Signup Flow Debugger
        </h2>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Test Type:
              </label>
              <select
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value as 'buyer' | 'creator' | 'both')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hanok-teal focus:border-hanok-teal"
                disabled={isRunning}
              >
                <option value="buyer">Buyer Signup Only</option>
                <option value="creator">Creator Signup Only</option>
                <option value="both">Both Buyer and Creator</option>
              </select>
            </div>

            <Button
              onClick={runSelectedTest}
              disabled={isRunning}
              className="w-full bg-hanok-teal hover:bg-hanok-teal/90"
            >
              {isRunning ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running Tests...
                </div>
              ) : (
                `Run ${selectedTest.charAt(0).toUpperCase() + selectedTest.slice(1)} Test${selectedTest === 'both' ? 's' : ''}`
              )}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Test Results
                <div className="text-sm font-normal">
                  <span className="text-green-600">✅ {successCount}</span>
                  {' / '}
                  <span className="text-red-600">❌ {failureCount}</span>
                  {' / '}
                  <span className="text-gray-600">Total: {results.length}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">
                        {result.success ? '✅' : '❌'}
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {result.step}
                      </h3>
                    </div>

                    {result.error && (
                      <div className="text-red-700 text-sm mb-2">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}

                    {result.warnings && result.warnings.length > 0 && (
                      <div className="text-orange-700 text-sm mb-2">
                        <strong>Warnings:</strong> {result.warnings.join(', ')}
                      </div>
                    )}

                    {result.data && (
                      <div className="text-gray-600 text-sm">
                        <strong>Data:</strong>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2">
                      {result.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results.length === 0 && !isRunning && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600">
                Select a test type and click "Run Test" to begin debugging the signup flow.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SignupDebugPage;