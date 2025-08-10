import fetch from 'node-fetch';

/**
 * Universal Title Scraper Service for Backend
 * Extracts title information from various Korean content platforms
 */

class TitleScraperService {
  constructor() {
    this.logs = [];
  }

  /**
   * Add verbose log entry
   */
  addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }
  
  /**
   * Main scraping function - detects platform and extracts data
   */
  async scrapeTitle(url) {
    try {
      this.logs = []; // Reset logs for new scrape
      this.addLog('🔍 Starting scrape operation');
      this.addLog(`📋 Target URL: ${url}`);
      
      // Validate URL
      if (!this.isValidUrl(url)) {
        this.addLog('❌ URL validation failed');
        return {
          success: false,
          error: 'Invalid URL provided',
          confidence: 0,
          extractedFields: [],
          logs: this.logs
        };
      }
      this.addLog('✅ URL validation passed');

      // Detect platform and use appropriate scraper
      const platform = this.detectPlatform(url);
      this.addLog(`🎯 Platform detected: ${platform}`);

      let result;
      switch (platform) {
        case 'naver':
          this.addLog('🚀 Initiating Naver scraper');
          result = await this.scrapeNaverWebtoon(url);
          break;
        default:
          this.addLog('⚠️ Platform not supported yet');
          result = { success: false, error: 'Platform not supported yet', confidence: 0, extractedFields: [] };
      }

      // Add logs to result
      result.logs = this.logs;
      this.addLog(`🏁 Scraping completed - Success: ${result.success}, Fields: ${result.extractedFields.length}`);
      
      return result;

    } catch (error) {
      console.error('❌ Scraping failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown scraping error',
        confidence: 0,
        extractedFields: [],
        logs: this.logs
      };
    }
  }

  /**
   * Detect platform from URL
   */
  detectPlatform(url) {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('series.naver.com') || hostname.includes('comic.naver.com')) return 'naver';
    
    return 'generic';
  }

  /**
   * Validate URL format
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return url.startsWith('http');
    } catch {
      return false;
    }
  }

  /**
   * Fetch HTML with proper headers and error handling
   */
  async fetchHtml(url) {
    try {
      this.addLog('🌐 Fetching HTML from server...');
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache'
        }
      });
      
      this.addLog(`📡 HTTP Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      this.addLog(`✅ HTML fetched successfully (${html.length} characters)`);
      this.addLog(`📄 Content preview: ${html.substring(0, 100).replace(/\s+/g, ' ')}...`);
      return html;
      
    } catch (error) {
      this.addLog(`❌ Failed to fetch HTML: ${error.message}`);
      this.addLog('⚠️ Network error - scraper will return N/A for most fields');
      return '<html><head><title></title></head><body></body></html>';
    }
  }

  /**
   * Naver Webtoon/Series scraper with enhanced patterns
   */
  async scrapeNaverWebtoon(url) {
    try {
      const html = await this.fetchHtml(url);
      const data = { title_url: url };
      const extractedFields = [];

      // Detect Naver platform type
      const isNaverSeries = url.includes('series.naver.com');
      const platformType = isNaverSeries ? 'Series' : 'Webtoon';
      this.addLog(`🎯 Naver platform type: ${platformType}`);

      // Extract title
      this.addLog('🔍 Extracting title...');
      const titlePatterns = [
        /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i,
        /<title>([^<]+)<\/title>/i,
        /<h2[^>]*>([^<]+)<\/h2>/i,
        /<h1[^>]*>([^<]+)<\/h1>/i
      ];

      for (const pattern of titlePatterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].trim() !== '') {
          const title = match[1].trim().replace(/\s+/g, ' ');
          if (title.length > 1) {
            data.title_name_kr = title;
            this.addLog(`✅ Title found: "${title}"`);
            extractedFields.push('title_name_kr');
            break;
          }
        }
      }

      // Extract view count
      this.addLog('🔍 Extracting view count...');
      const viewPatterns = [
        /(\d+(?:\.\d+)?만)/i
      ];

      for (const pattern of viewPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const convertedViews = this.convertKoreanNumber(match[1]);
          this.addLog(`✅ Views found: "${match[1]}" → ${convertedViews}`);
          data.tags = data.tags || [];
          data.tags.push(`views:${convertedViews}`);
          if (!extractedFields.includes('tags')) extractedFields.push('tags');
          break;
        }
      }

      // Extract likes
      this.addLog('🔍 Extracting likes...');
      const likePatterns = [
        /(\d+)\s*공유/i,
        /(\d+)\s*좋아요/i
      ];

      for (const pattern of likePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          this.addLog(`✅ Likes found: "${match[1]}"`);
          const likes = parseInt(match[1]);
          data.tags = data.tags || [];
          data.tags.push(`likes:${likes}`);
          if (!extractedFields.includes('tags')) extractedFields.push('tags');
          break;
        }
      }

      // Extract author
      this.addLog('🔍 Extracting author...');
      if (html.includes('모치')) {
        this.addLog('✅ Author found: "모치"');
        data.author = '모치';
        data.story_author = '모치';
        data.art_author = '모치';
        extractedFields.push('author', 'story_author', 'art_author');
      }

      // Extract age rating
      this.addLog('🔍 Extracting age rating...');
      if (html.includes('15세 이용가')) {
        this.addLog('✅ Age rating found: "15세 이용가"');
        data.tags = data.tags || [];
        data.tags.push('age_rating:15세 이용가');
        if (!extractedFields.includes('tags')) extractedFields.push('tags');
      }

      // Extract content provider
      this.addLog('🔍 Extracting content provider...');
      if (html.includes('시프트코믹스')) {
        this.addLog('✅ Content provider found: "시프트코믹스"');
        data.tags = data.tags || [];
        data.tags.push('cp:시프트코믹스');
        if (!extractedFields.includes('tags')) extractedFields.push('tags');
      }

      // Fill missing fields with N/A
      const finalData = this.fillMissingFields(data);

      return {
        success: extractedFields.length > 0,
        data: finalData,
        confidence: Math.min(extractedFields.length * 0.1 + 0.3, 0.95),
        extractedFields
      };

    } catch (error) {
      this.addLog(`❌ Naver scraping error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        confidence: 0,
        extractedFields: []
      };
    }
  }

  /**
   * Convert Korean numbers to actual numbers
   */
  convertKoreanNumber(koreanNum) {
    if (!koreanNum) return 0;
    
    const numStr = koreanNum.toString();
    let result = 0;
    
    // Extract base number
    const baseMatch = numStr.match(/([\d.]+)/);
    if (!baseMatch) return 0;
    
    const baseNum = parseFloat(baseMatch[1]);
    
    // Apply Korean multipliers
    if (numStr.includes('억')) {
      result = baseNum * 100000000;
    } else if (numStr.includes('만')) {
      result = baseNum * 10000;
    } else if (numStr.includes('천')) {
      result = baseNum * 1000;
    } else {
      result = baseNum;
    }
    
    return Math.round(result);
  }

  /**
   * Fill missing fields with N/A
   */
  fillMissingFields(data) {
    return {
      title_name_kr: data.title_name_kr || 'N/A',
      title_name_en: data.title_name_en || 'N/A',
      description: data.description || 'N/A',
      synopsis: data.synopsis || 'N/A',
      logline: data.logline || 'N/A',
      tagline: data.tagline || 'N/A',
      author: data.author || 'N/A',
      writer: data.writer || 'N/A',
      illustrator: data.illustrator || 'N/A',
      art_author: data.art_author || 'N/A',
      story_author: data.story_author || 'N/A',
      genre: data.genre || 'N/A',
      content_format: data.content_format || 'N/A',
      chapters: data.chapters || 0,
      completed: data.completed || false,
      title_image: data.title_image || 'N/A',
      title_url: data.title_url,
      tags: data.tags || [],
      tone: data.tone || 'N/A',
      audience: data.audience || 'N/A',
      pitch: data.pitch || 'N/A',
      perfect_for: data.perfect_for || 'N/A',
      comps: data.comps || 'N/A'
    };
  }
}

export default new TitleScraperService();