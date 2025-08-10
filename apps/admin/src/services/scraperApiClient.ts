/**
 * Scraper API Client - Frontend client for backend scraper API
 */

export interface ScrapedTitleData {
  title_name_kr: string;
  title_name_en?: string;
  description?: string;
  synopsis?: string;
  logline?: string;
  tagline?: string;
  author?: string;
  writer?: string;
  illustrator?: string;
  art_author?: string;
  story_author?: string;
  genre?: string;
  content_format?: string;
  chapters?: number;
  completed?: boolean;
  title_image?: string;
  title_url: string;
  tags?: string[];
  tone?: string;
  audience?: string;
  pitch?: string;
  perfect_for?: string;
  comps?: string;
}

export interface ScrapingResult {
  success: boolean;
  data?: ScrapedTitleData;
  error?: string;
  confidence: number;
  extractedFields: string[];
  logs?: string[];
  metadata?: {
    requestUrl: string;
    timestamp: string;
    duration: string;
    serverVersion: string;
  };
}

class ScraperApiClient {
  private readonly baseUrl: string;

  constructor() {
    // Use environment variable or fallback to localhost
    this.baseUrl = import.meta.env.VITE_SCRAPER_API_URL || 'http://localhost:3001/api/scraper';
  }

  /**
   * Scrape a title from URL using backend API
   */
  async scrapeTitle(url: string): Promise<ScrapingResult> {
    try {
      console.log('📡 Calling backend scraper API:', url);
      
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Backend API error:', result);
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`,
          confidence: 0,
          extractedFields: [],
          logs: result.logs || [`❌ Backend API error: ${result.error || response.statusText}`]
        };
      }

      console.log('✅ Backend API response:', result);
      return result;

    } catch (error) {
      console.error('❌ Network error calling backend:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
      
      return {
        success: false,
        error: 'Backend API unavailable',
        confidence: 0,
        extractedFields: [],
        logs: [
          `❌ Failed to connect to scraper backend: ${errorMessage}`,
          '💡 Make sure the backend server is running on port 3001',
          '🔧 Command: cd backend && npm run dev'
        ]
      };
    }
  }

  /**
   * Get backend health status
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend health check failed:', error);
    }
    return null;
  }

  /**
   * Get supported platforms
   */
  async getPlatforms(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/platforms`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to get platforms:', error);
    }
    return { platforms: [] };
  }

  /**
   * Test with predefined URL
   */
  async runTest(): Promise<ScrapingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/test`);
      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`,
          confidence: 0,
          extractedFields: [],
          logs: result.logs || []
        };
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: 'Test failed',
        confidence: 0,
        extractedFields: [],
        logs: [`❌ Test failed: ${errorMessage}`]
      };
    }
  }

  /**
   * Test Korean number conversion (for debugging)
   */
  testKoreanNumbers(): void {
    const testCases = [
      ['13.7만', 137000],
      ['1.2억', 120000000],
      ['5천', 5000],
      ['999', 999]
    ];

    console.log('🧮 Testing Korean number conversion:');
    testCases.forEach(([input, expected]) => {
      // Simple conversion for testing
      let result = 0;
      const numStr = input.toString();
      const baseMatch = numStr.match(/([\d.]+)/);
      if (baseMatch) {
        const baseNum = parseFloat(baseMatch[1]);
        if (numStr.includes('억')) {
          result = baseNum * 100000000;
        } else if (numStr.includes('만')) {
          result = baseNum * 10000;
        } else if (numStr.includes('천')) {
          result = baseNum * 1000;
        } else {
          result = baseNum;
        }
      }
      
      const success = Math.round(result) === expected;
      console.log(`${success ? '✅' : '❌'} ${input} → ${Math.round(result)} (expected: ${expected})`);
    });
  }
}

export default new ScraperApiClient();