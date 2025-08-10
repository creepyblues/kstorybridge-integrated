import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import scraperRoutes from './routes/scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    'http://localhost:5173',  // Website dev
    'http://localhost:8081',  // Dashboard dev  
    'http://localhost:8082',  // Admin dev
    'https://kstorybridge.com',
    'https://dashboard.kstorybridge.com',
    'https://admin.kstorybridge.com'
  ],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'KStoryBridge Scraper API'
  });
});

// API routes
app.use('/api/scraper', scraperRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'KStoryBridge Scraper API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      scraper: '/api/scraper'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 KStoryBridge Scraper API running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Scraper API: http://localhost:${PORT}/api/scraper`);
});