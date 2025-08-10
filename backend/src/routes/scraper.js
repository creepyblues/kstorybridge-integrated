import express from 'express';
import scraperService from '../services/scraperService.js';

const router = express.Router();

/**
 * GET /api/scraper/health
 * Health check for scraper service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'KStoryBridge Scraper Service',
    timestamp: new Date().toISOString(),
    supportedPlatforms: [
      'series.naver.com',
      'comic.naver.com', 
      'page.kakao.com',
      'webtoon.kakao.com',
      'toons.kr (planned)',
      'webtoons.com (planned)',
      'ridibooks.com (planned)'
    ]
  });
});

/**
 * POST /api/scraper/scrape
 * Main scraping endpoint
 * 
 * Body: { "url": "https://series.naver.com/comic/detail.series?productNo=3293134" }
 */
router.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body;

    // Validate request
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        message: 'Please provide a URL in the request body'
      });
    }

    if (typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        message: 'URL must be a string'
      });
    }

    // Log the scraping request
    console.log(`📋 Scraping request received for: ${url}`);
    
    // Perform scraping
    const startTime = Date.now();
    const result = await scraperService.scrapeTitle(url);
    const duration = Date.now() - startTime;

    console.log(`⏱️ Scraping completed in ${duration}ms - Success: ${result.success}`);

    // Add metadata to response
    const response = {
      ...result,
      metadata: {
        requestUrl: url,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        serverVersion: '1.0.0'
      }
    };

    // Return appropriate status code
    if (result.success) {
      res.json(response);
    } else {
      res.status(422).json(response); // Unprocessable Entity
    }

  } catch (error) {
    console.error('💥 Scraper API Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/scraper/test
 * Test endpoint with predefined URL
 */
router.get('/test', async (req, res) => {
  const testUrl = 'https://series.naver.com/comic/detail.series?productNo=3293134';
  
  try {
    console.log(`🧪 Running test scrape for: ${testUrl}`);
    
    const result = await scraperService.scrapeTitle(testUrl);
    
    res.json({
      ...result,
      metadata: {
        testUrl,
        timestamp: new Date().toISOString(),
        isTestEndpoint: true
      }
    });
    
  } catch (error) {
    console.error('🧪 Test scraping failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Test scraping failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/scraper/platforms
 * List supported platforms and their status
 */
router.get('/platforms', (req, res) => {
  res.json({
    platforms: [
      {
        name: 'Naver Series',
        domain: 'series.naver.com',
        status: 'active',
        features: ['title', 'views', 'likes', 'author', 'age_rating', 'content_provider'],
        example: 'https://series.naver.com/comic/detail.series?productNo=3293134'
      },
      {
        name: 'Naver Webtoon',
        domain: 'comic.naver.com',
        status: 'active', 
        features: ['title', 'author', 'basic_info'],
        example: 'https://comic.naver.com/webtoon/list?titleId=814543'
      },
      {
        name: 'KakaoPage',
        domain: 'page.kakao.com',
        status: 'planned',
        features: [],
        example: 'https://page.kakao.com/content/54100540'
      },
      {
        name: 'Kakao Webtoon',
        domain: 'webtoon.kakao.com',
        status: 'planned',
        features: [],
        example: 'https://webtoon.kakao.com/content/RAINBOW/4122'
      },
      {
        name: 'Toons.kr',
        domain: 'toons.kr',
        status: 'planned',
        features: [],
        example: 'https://www.toons.kr/example-title'
      },
      {
        name: 'Webtoons.com',
        domain: 'webtoons.com',
        status: 'planned',
        features: [],
        example: 'https://www.webtoons.com/en/drama/example/list'
      }
    ],
    lastUpdated: new Date().toISOString()
  });
});

export default router;