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

      // Extract view count - store in views field
      this.addLog('🔍 Extracting view count...');
      const viewPatterns = [
        /(\d+(?:\.\d+)?만)/i,  // X.X만 (10,000s)
        /(\d+(?:\.\d+)?천)/i,  // X.X천 (1,000s) 
        /(\d+(?:\.\d+)?억)/i   // X.X억 (100,000,000s)
      ];

      for (const pattern of viewPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const convertedViews = this.convertKoreanNumber(match[1]);
          this.addLog(`✅ Views found: "${match[1]}" → ${convertedViews}`);
          data.views = convertedViews;
          extractedFields.push('views');
          break;
        }
      }

      // Extract likes - store in description or custom field
      this.addLog('🔍 Extracting likes...');
      const likePatterns = [
        /(\d+)\s*공유/i,
        /(\d+)\s*좋아요/i,
        /좋아요\s*(\d+)/i
      ];

      for (const pattern of likePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          this.addLog(`✅ Likes found: "${match[1]}"`);
          // Store likes in pitch field for now since we don't have a likes field
          data.pitch = `Likes: ${match[1]}`;
          extractedFields.push('pitch');
          break;
        }
      }

      // Extract author - look for various patterns
      this.addLog('🔍 Extracting author...');
      const authorPatterns = [
        /작가[^>]*>([^<]+)</i,
        /글[^>]*>([^<]+)</i, 
        /글작가[^>]*>([^<]+)</i,
        /(모치)/i,
        /(Eon Comics)/i
      ];
      
      for (const pattern of authorPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const author = match[1].trim();
          if (author.length > 0 && author.length < 50 && !author.includes('style') && !author.includes('class')) {
            this.addLog(`✅ Author found: "${author}"`);
            data.author = author;
            data.story_author = author;
            data.art_author = author;
            extractedFields.push('author', 'story_author', 'art_author');
            break;
          }
        }
      }

      // Extract age rating - store in audience field
      this.addLog('🔍 Extracting age rating...');
      const ageRatingPatterns = [
        /(\d+세 이용가)/i,
        /연령가/i,
        /전체이용가/i
      ];
      
      for (const pattern of ageRatingPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          this.addLog(`✅ Age rating found: "${match[1]}"`);
          data.audience = match[1];
          extractedFields.push('audience');
          break;
        } else if (html.includes('15세 이용가')) {
          this.addLog('✅ Age rating found: "15세 이용가"');
          data.audience = '15세 이용가';
          extractedFields.push('audience');
          break;
        }
      }

      // Extract content provider - look for text next to "출판사"
      this.addLog('🔍 Extracting publisher (출판사)...');
      const publisherPatterns = [
        /출판사[^>]*>([가-힣a-zA-Z\s]+)<\/[^>]*>/i,
        /출판사[:\s]+([가-힣a-zA-Z\s]+)(?=\s|$)/i,
        /출판사<[^>]*>([가-힣a-zA-Z\s]+)</i
      ];
      
      for (const pattern of publisherPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const publisher = match[1].trim();
          // Filter out HTML artifacts and only keep valid publisher names
          if (publisher.length > 0 && publisher.length < 50 && !publisher.includes('style') && !publisher.includes('class')) {
            this.addLog(`✅ Publisher found: "${publisher}"`);
            data.cp = publisher;
            extractedFields.push('cp');
            break;
          }
        }
      }
      
      // Fallback: Look for known content providers if publisher pattern fails
      if (!data.cp) {
        this.addLog('🔍 Using fallback content provider patterns...');
        const contentProviderPatterns = [
          /(Eon Comics)/i,
          /(시프트코믹스)/i,
          /(네이버웹툰)/i,
          /(카카오페이지)/i,
          /(레진코믹스)/i,
          /(투믹스)/i
        ];
        
        for (const pattern of contentProviderPatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            this.addLog(`✅ Content provider found: "${match[1]}"`);
            data.cp = match[1];
            extractedFields.push('cp');
            break;
          }
        }
      }

      // Extract genre
      this.addLog('🔍 Extracting genre...');
      const genrePatterns = [
        /(순정)/i,  // 순정
        /(소년)/i,  // 소년
        /(소녀)/i,  // 소녀
        /(청년)/i,  // 청년
        /(성인)/i,  // 성인
        /(일반)/i   // 일반
      ];
      
      for (const pattern of genrePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          this.addLog(`✅ Genre found: "${match[1]}"`);
          data.genre = match[1];
          extractedFields.push('genre');
          break;
        }
      }
      
      // Extract completion status
      this.addLog('🔍 Extracting completion status...');
      if (html.includes('완결')) {
        this.addLog('✅ Completion status found: "완결" → true');
        data.completed = true;
        extractedFields.push('completed');
      } else if (html.includes('연재')) {
        this.addLog('✅ Completion status found: "연재" → false');
        data.completed = false;
        extractedFields.push('completed');
      }
      
      // Only add tags for comic.naver.com (which has keywords), not series.naver.com
      if (!isNaverSeries && html.includes('키워드')) {
        this.addLog('🔍 Extracting keywords/tags (comic.naver.com only)...');
        // Extract keywords/tags only for comic.naver.com
        const keywordMatch = html.match(/키워드[^>]*>([^<]+)/i);
        if (keywordMatch && keywordMatch[1]) {
          const keywords = keywordMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
          if (keywords.length > 0) {
            data.tags = keywords;
            this.addLog(`✅ Keywords found: ${keywords.join(', ')}`);
            extractedFields.push('tags');
          }
        }
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
      completed: data.completed !== undefined ? data.completed : false,
      title_image: data.title_image || 'N/A',
      title_url: data.title_url,
      tags: data.tags || [],
      tone: data.tone || 'N/A',
      audience: data.audience || 'N/A',
      pitch: data.pitch || 'N/A',
      perfect_for: data.perfect_for || 'N/A',
      comps: data.comps || 'N/A',
      views: data.views || 0,
      cp: data.cp || 'N/A'
    };
  }
}

export default new TitleScraperService();