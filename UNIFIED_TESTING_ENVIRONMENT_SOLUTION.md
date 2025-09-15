# Unified Testing Environment Solution

## Overview
This solution enables testing the OpenAI chatbot with identical behavior between localhost and production environments while maintaining security.

## Solution Architecture

### 1. **Local Backend API Setup**

Create a local version of the production API that mirrors exact behavior:

```bash
# New environment file: .env.testing
VITE_OPENAI_ENABLED=true
VITE_FORCE_OPENAI_PRODUCTION=true
VITE_LOCAL_BACKEND_URL=http://localhost:3001
VITE_USE_LOCAL_BACKEND=true

# Backend API environment
OPENAI_API_KEY=sk-your-api-key-here
SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. **Local Backend Server**

Create `api-server/index.js`:
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Import the exact production API logic
const openaiEnhanced = require('../apps/dashboard/api/openai-enhanced.js');

app.post('/api/openai-enhanced', async (req, res) => {
  try {
    // Use the exact same handler as production
    const result = await openaiEnhanced(req, res);
    if (!res.headersSent) {
      res.json(result);
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

app.listen(3001, () => {
  console.log('🔧 Local backend API running on http://localhost:3001');
  console.log('📡 Mirroring production /api/openai-enhanced behavior');
});
```

### 3. **Environment Toggle System**

Update `openaiService.ts`:
```typescript
private shouldUseLocalBackend(): boolean {
  return import.meta.env.VITE_USE_LOCAL_BACKEND === 'true';
}

private getBackendURL(): string {
  if (this.shouldUseLocalBackend()) {
    return import.meta.env.VITE_LOCAL_BACKEND_URL || 'http://localhost:3001';
  }
  return ''; // Use current domain for production
}

async generateChatResponse(userQuery: string, conversationHistory: string[] = [], userId?: string, sessionId?: string): Promise<LLMChatResponse> {
  const requestId = Date.now().toString(36);
  const startTime = Date.now();
  
  // Force backend mode for testing
  const useBackend = import.meta.env.PROD || 
                    import.meta.env.VITE_FORCE_OPENAI_PRODUCTION === 'true' ||
                    this.shouldUseLocalBackend();
  
  if (useBackend) {
    console.log(`📡 [${requestId}] Using backend API (${this.shouldUseLocalBackend() ? 'LOCAL' : 'PRODUCTION'})`);
    return this.generateChatResponseViaAPI(userQuery, conversationHistory, userId, sessionId, requestId);
  }
  
  // Fallback to direct client only if specifically enabled
  console.log(`⚡ [${requestId}] Using direct OpenAI client`);
  // ... rest of direct client logic
}
```

### 4. **Testing Modes**

Create three distinct testing environments:

#### **Mode 1: Direct Client (Current Localhost)**
```bash
# .env.local
VITE_OPENAI_ENABLED=true
VITE_OPENAI_API_KEY=sk-your-key
# No force flags = direct client mode
```

#### **Mode 2: Local Backend (Production Mirror)**
```bash
# .env.testing
VITE_OPENAI_ENABLED=true
VITE_FORCE_OPENAI_PRODUCTION=true
VITE_USE_LOCAL_BACKEND=true
VITE_LOCAL_BACKEND_URL=http://localhost:3001
```

#### **Mode 3: Production Backend**
```bash
# .env.staging
VITE_OPENAI_ENABLED=true
VITE_FORCE_OPENAI_PRODUCTION=true
# Uses production API endpoints
```

### 5. **Comparison Testing Tool**

Create `src/pages/ChatbotTesting.tsx`:
```typescript
import { useState } from 'react';
import { openaiService } from '@/services/openaiService';

export default function ChatbotTesting() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({});
  
  const testAllModes = async () => {
    const testQuery = query || "I'm looking for action content similar to John Wick";
    
    // Test direct client
    const directResult = await testDirectMode(testQuery);
    
    // Test local backend
    const localBackendResult = await testLocalBackend(testQuery);
    
    // Test production backend
    const productionResult = await testProduction(testQuery);
    
    setResults({
      direct: directResult,
      localBackend: localBackendResult,
      production: productionResult
    });
  };
  
  const testDirectMode = async (query: string) => {
    // Temporarily set environment to direct mode
    const originalForce = import.meta.env.VITE_FORCE_OPENAI_PRODUCTION;
    const originalLocal = import.meta.env.VITE_USE_LOCAL_BACKEND;
    
    // @ts-ignore
    import.meta.env.VITE_FORCE_OPENAI_PRODUCTION = 'false';
    // @ts-ignore
    import.meta.env.VITE_USE_LOCAL_BACKEND = 'false';
    
    const startTime = Date.now();
    try {
      const result = await openaiService.generateChatResponse(query, [], 'test-user', 'test-session');
      return {
        success: true,
        responseTime: Date.now() - startTime,
        titlesCount: result.recommendedTitles?.length || 0,
        firstTitle: result.recommendedTitles?.[0]?.title_name_en || 'None',
        messagePreview: result.message.substring(0, 100) + '...',
        vectorSearchUsed: result.vectorSearchUsed
      };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      // Restore original environment
      // @ts-ignore
      import.meta.env.VITE_FORCE_OPENAI_PRODUCTION = originalForce;
      // @ts-ignore
      import.meta.env.VITE_USE_LOCAL_BACKEND = originalLocal;
    }
  };
  
  const testLocalBackend = async (query: string) => {
    // Test local backend by making direct API call
    const response = await fetch('http://localhost:3001/api/openai-enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSupabaseToken()}`
      },
      body: JSON.stringify({
        query,
        conversationHistory: [],
        userId: 'test-user'
      })
    });
    
    const result = await response.json();
    return {
      success: response.ok,
      responseTime: result.responseTime || 0,
      titlesCount: result.recommendedTitles?.length || 0,
      firstTitle: result.recommendedTitles?.[0]?.title_name_en || 'None',
      messagePreview: result.message?.substring(0, 100) + '...',
      vectorSearchUsed: result.vectorSearchUsed
    };
  };
  
  const testProduction = async (query: string) => {
    // Test production backend
    const response = await fetch('/api/openai-enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSupabaseToken()}`
      },
      body: JSON.stringify({
        query,
        conversationHistory: [],
        userId: 'test-user'
      })
    });
    
    const result = await response.json();
    return {
      success: response.ok,
      responseTime: result.responseTime || 0,
      titlesCount: result.recommendedTitles?.length || 0,
      firstTitle: result.recommendedTitles?.[0]?.title_name_en || 'None',
      messagePreview: result.message?.substring(0, 100) + '...',
      vectorSearchUsed: result.vectorSearchUsed
    };
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">OpenAI Chatbot Environment Testing</h1>
      
      <div className="mb-6">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter test query (or leave empty for default)"
          className="w-full h-20 p-3 border rounded"
        />
        <button
          onClick={testAllModes}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test All Environments
        </button>
      </div>
      
      {Object.keys(results).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['direct', 'localBackend', 'production'].map((mode) => (
            <div key={mode} className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 capitalize">{mode.replace('Backend', ' Backend')}</h3>
              {results[mode] ? (
                <div className="space-y-2 text-sm">
                  <div className={`font-medium ${results[mode].success ? 'text-green-600' : 'text-red-600'}`}>
                    {results[mode].success ? '✅ Success' : '❌ Failed'}
                  </div>
                  {results[mode].success ? (
                    <>
                      <div>Response Time: {results[mode].responseTime}ms</div>
                      <div>Titles: {results[mode].titlesCount}</div>
                      <div>First Title: {results[mode].firstTitle}</div>
                      <div>Vector Search: {results[mode].vectorSearchUsed ? 'Yes' : 'No'}</div>
                      <div className="text-xs text-gray-600">
                        Preview: {results[mode].messagePreview}
                      </div>
                    </>
                  ) : (
                    <div className="text-red-600">Error: {results[mode].error}</div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">Not tested yet</div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {Object.keys(results).length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-3">Comparison Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2">Metric</th>
                  <th className="border border-gray-300 p-2">Direct Client</th>
                  <th className="border border-gray-300 p-2">Local Backend</th>
                  <th className="border border-gray-300 p-2">Production</th>
                  <th className="border border-gray-300 p-2">Match?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Success</td>
                  <td className="border border-gray-300 p-2">{results.direct?.success ? '✅' : '❌'}</td>
                  <td className="border border-gray-300 p-2">{results.localBackend?.success ? '✅' : '❌'}</td>
                  <td className="border border-gray-300 p-2">{results.production?.success ? '✅' : '❌'}</td>
                  <td className="border border-gray-300 p-2">
                    {results.localBackend?.success === results.production?.success ? '✅' : '❌'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Titles Count</td>
                  <td className="border border-gray-300 p-2">{results.direct?.titlesCount || 0}</td>
                  <td className="border border-gray-300 p-2">{results.localBackend?.titlesCount || 0}</td>
                  <td className="border border-gray-300 p-2">{results.production?.titlesCount || 0}</td>
                  <td className="border border-gray-300 p-2">
                    {results.localBackend?.titlesCount === results.production?.titlesCount ? '✅' : '❌'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">First Title</td>
                  <td className="border border-gray-300 p-2 text-xs">{results.direct?.firstTitle || 'None'}</td>
                  <td className="border border-gray-300 p-2 text-xs">{results.localBackend?.firstTitle || 'None'}</td>
                  <td className="border border-gray-300 p-2 text-xs">{results.production?.firstTitle || 'None'}</td>
                  <td className="border border-gray-300 p-2">
                    {results.localBackend?.firstTitle === results.production?.firstTitle ? '✅' : '❌'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function getSupabaseToken() {
  // Get current Supabase session token
  return 'your-token-here';
}
```

### 6. **Implementation Steps**

1. **Setup Local Backend Server**
   ```bash
   mkdir api-server
   cd api-server
   npm init -y
   npm install express cors
   # Copy the setup above
   ```

2. **Create Testing Environment File**
   ```bash
   cp .env.local .env.testing
   # Add the testing environment variables
   ```

3. **Add Testing Scripts to package.json**
   ```json
   {
     "scripts": {
       "test:chatbot:direct": "cp .env.local .env && npm run dev",
       "test:chatbot:backend": "cp .env.testing .env && npm run dev",
       "test:chatbot:production": "cp .env.staging .env && npm run dev",
       "api-server": "cd api-server && node index.js"
     }
   }
   ```

4. **Start Testing Environment**
   ```bash
   # Terminal 1: Start local backend API
   npm run api-server
   
   # Terminal 2: Start dashboard in testing mode
   npm run test:chatbot:backend
   
   # Access testing tool at: http://localhost:8081/chatbot-testing
   ```

### 7. **Benefits of This Solution**

✅ **Identical Behavior**: Local backend mirrors production exactly
✅ **Security Maintained**: API keys stay server-side
✅ **Easy Comparison**: Side-by-side testing of all modes
✅ **Development Speed**: Fast iteration with production-like results
✅ **Quality Assurance**: Catch differences before deployment

### 8. **Usage Workflow**

1. **Development**: Use direct client mode for rapid iteration
2. **Pre-deployment Testing**: Use local backend mode to verify production behavior
3. **Quality Assurance**: Use comparison tool to ensure consistency
4. **Production Validation**: Use production mode to verify live behavior

This solution gives you the best of both worlds: fast development iteration and production-accurate testing for critical quality validation.