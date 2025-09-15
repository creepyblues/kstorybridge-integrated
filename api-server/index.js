const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🔄 [${timestamp}] ${req.method} ${req.path}`);
  if (process.env.DEBUG_MODE === 'true' && req.body) {
    console.log('📝 Request body preview:', {
      query: req.body.query?.substring(0, 50) + '...' || 'No query',
      userId: req.body.userId?.substring(0, 8) + '...' || 'No userId',
      historyLength: req.body.conversationHistory?.length || 0
    });
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'kstorybridge-local-api-server',
    timestamp: new Date().toISOString(),
    environment: 'local-backend-mirror',
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    supabaseConfigured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });
});

// Import and use the production OpenAI API logic
app.post('/api/openai-enhanced', async (req, res) => {
  const startTime = Date.now();
  const requestId = Date.now().toString(36);
  
  console.log(`🤖 [${requestId}] OpenAI Enhanced API called via local backend`);
  
  try {
    // Import the production logic dynamically
    const openaiEnhancedPath = path.join(__dirname, '../apps/dashboard/api/openai-enhanced.js');
    
    // Clear require cache to ensure fresh imports
    delete require.cache[require.resolve(openaiEnhancedPath)];
    
    const openaiEnhanced = require(openaiEnhancedPath);
    
    // Create a mock Vercel request/response object structure
    const mockReq = {
      method: 'POST',
      body: req.body,
      headers: req.headers,
      query: req.query
    };
    
    const mockRes = {
      status: (code) => {
        res.status(code);
        return mockRes;
      },
      json: (data) => {
        const responseTime = Date.now() - startTime;
        console.log(`✅ [${requestId}] Local backend response completed in ${responseTime}ms`);
        res.json({
          ...data,
          _metadata: {
            requestId,
            responseTime,
            environment: 'local-backend-mirror',
            timestamp: new Date().toISOString()
          }
        });
        return mockRes;
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
        return mockRes;
      },
      end: (data) => {
        res.end(data);
        return mockRes;
      }
    };
    
    // Call the production API function
    await openaiEnhanced(mockReq, mockRes);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [${requestId}] Local backend error:`, {
      error: error.message,
      stack: error.stack?.split('\\n').slice(0, 3),
      responseTime
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message,
        _metadata: {
          requestId,
          responseTime,
          environment: 'local-backend-mirror',
          timestamp: new Date().toISOString(),
          errorType: 'local-backend-error'
        }
      });
    }
  }
});

// Debug endpoint to test titles loading
app.get('/api/debug-titles', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: titles, error } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, genre, synopsis')
      .limit(10);
      
    if (error) throw error;
    
    res.json({
      count: titles.length,
      titles,
      environment: 'local-backend-mirror',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      environment: 'local-backend-mirror'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled error:', error);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      environment: 'local-backend-mirror'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 KStoryBridge Local Backend API Server Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 OpenAI API: http://localhost:${PORT}/api/openai-enhanced`);
  console.log(`📊 Debug titles: http://localhost:${PORT}/api/debug-titles`);
  console.log('');
  console.log('🎯 This server mirrors your production API behavior exactly');
  console.log('📋 Environment check:');
  console.log(`   ✅ OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : '❌ Missing'}`);
  console.log(`   ✅ Supabase URL: ${process.env.SUPABASE_URL ? 'Configured' : '❌ Missing'}`);
  console.log(`   ✅ Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : '❌ Missing'}`);
  console.log('');
  console.log('🔧 To configure, copy .env.example to .env and add your keys');
});