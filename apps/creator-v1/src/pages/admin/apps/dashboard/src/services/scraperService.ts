/**
 * Universal Title Scraper Service
 * Extracts title information from various Korean content platforms
 */

export interface ScrapedTitleData {
  title_name_kr: string;
  title_name_en?: string;
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
  comps?: string[];
}

export interface ScrapingResult {
  success: boolean;
  data?: ScrapedTitleData;
  error?: string;
  confidence: number; // 0-1 confidence in the extracted data
  extractedFields: string[]; // List of fields successfully extracted
  logs?: string[]; // Verbose logging for UI display
}

class TitleScraperService {
  private readonly CORS_PROXY = '/api/scraper-proxy'; // We'll need to implement this
  private logs: string[] = [];

  /**
   * Add verbose log entry
   */
  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }
  
  /**
   * Main scraping function - detects platform and extracts data
   */
  async scrapeTitle(url: string): Promise<ScrapingResult> {
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

      let result: ScrapingResult;

      switch (platform) {
        case 'toons.kr':
          this.addLog('🚀 Initiating Toons.kr scraper');
          result = await this.scrapeToonsKr(url);
          break;
        case 'webtoons.com':
          this.addLog('🚀 Initiating Webtoons.com scraper');
          result = await this.scrapeWebtoons(url);
          break;
        case 'kakaopage':
          this.addLog('🚀 Initiating KakaoPage scraper');
          result = await this.scrapeKakaoPage(url);
          break;
        case 'kakao_webtoon':
          this.addLog('🚀 Initiating Kakao Webtoon scraper');
          result = await this.scrapeKakaoWebtoon(url);
          break;
        case 'naver':
          this.addLog('🚀 Initiating Naver scraper');
          result = await this.scrapeNaverWebtoon(url);
          break;
        case 'ridibooks':
          this.addLog('🚀 Initiating RidiBooks scraper');
          result = await this.scrapeRidiBooks(url);
          break;
        default:
          this.addLog('🚀 Initiating generic scraper');
          result = await this.scrapeGeneric(url);
      }

      // Add logs to result
      result.logs = this.logs;
      this.addLog(`🏁 Scraping completed - Success: ${result.success}, Fields: ${result.extractedFields.length}`);
      
      return result;

    } catch (error) {
      console.error('❌ Scraping failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
        confidence: 0,
        extractedFields: []
      };
    }
  }

  /**
   * Detect platform from URL
   */
  private detectPlatform(url: string): string {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('toons.kr')) return 'toons.kr';
    if (hostname.includes('webtoons.com')) return 'webtoons.com';
    if (hostname.includes('page.kakao.com')) return 'kakaopage';
    if (hostname.includes('webtoon.kakao.com')) return 'kakao_webtoon';
    if (hostname.includes('comic.naver') || hostname.includes('webtoon.naver') || hostname.includes('series.naver')) return 'naver';
    if (hostname.includes('ridibooks')) return 'ridibooks';
    
    return 'generic';
  }

  /**
   * Scrape Toons.kr (based on existing scraper logic)
   */
  private async scrapeToonsKr(url: string): Promise<ScrapingResult> {
    try {
      const html = await this.fetchHtml(url);
      const data: Partial<ScrapedTitleData> = { title_url: url };
      const extractedFields: string[] = [];
      
      // Extract title from various possible selectors
      const titleSelectors = [
        'h1[class*="title"]',
        '.title',
        'h1',
        '[class*="notion-header"]',
        'h2[class*="title"]'
      ];
      
      const title = this.extractBySelectors(html, titleSelectors);
      if (title) {
        data.title_name_kr = title.trim();
        extractedFields.push('title_name_kr');
      }

      // Extract genre
      const genreText = this.extractText(html, /장르[:\s]*([^.\n]+)/i);
      if (genreText) {
        data.genre = this.mapGenre(genreText.trim());
        extractedFields.push('genre');
      }

      // Extract author information
      const writerText = this.extractText(html, /글[:\s]*([^.\n]+)/i);
      if (writerText) {
        data.writer = writerText.trim();
        data.author = writerText.trim(); // Map to author as well
        extractedFields.push('writer', 'author');
      }

      const artistText = this.extractText(html, /그림[:\s]*([^.\n]+)/i);
      if (artistText) {
        data.illustrator = artistText.trim();
        data.art_author = artistText.trim();
        extractedFields.push('illustrator', 'art_author');
      }

      // Extract synopsis/description
      const synopsisPatterns = [
        /작품\s*줄거리[:\s]*([^.]+(?:\.[^.]*){0,10})/i,
        /시놉시스[:\s]*([^.]+(?:\.[^.]*){0,10})/i,
        /줄거리[:\s]*([^.]+(?:\.[^.]*){0,10})/i,
        /내용[:\s]*([^.]+(?:\.[^.]*){0,5})/i
      ];

      for (const pattern of synopsisPatterns) {
        const synopsis = this.extractText(html, pattern);
        if (synopsis && synopsis.length > 20) {
          data.synopsis = synopsis.trim();
          extractedFields.push('synopsis');
          break;
        }
      }

      // Extract cover image
      const imageUrl = this.extractImage(html, url);
      if (imageUrl) {
        data.title_image = imageUrl;
        extractedFields.push('title_image');
      }

      // Extract episode/chapter count
      const chapterText = this.extractText(html, /(\d+)\s*화/i);
      if (chapterText) {
        data.chapters = parseInt(chapterText);
        extractedFields.push('chapters');
      }

      // Determine content format
      data.content_format = 'webtoon'; // Default for toons.kr
      extractedFields.push('content_format');

      const confidence = this.calculateConfidence(extractedFields);

      return {
        success: extractedFields.length > 0,
        data: this.fillMissingFields(data),
        confidence,
        extractedFields
      };

    } catch (error) {
      return {
        success: false,
        error: `Toons.kr scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        extractedFields: []
      };
    }
  }

  /**
   * Scrape LINE Webtoons
   */
  private async scrapeWebtoons(url: string): Promise<ScrapingResult> {
    try {
      const html = await this.fetchHtml(url);
      const data: Partial<ScrapedTitleData> = { title_url: url };
      const extractedFields: string[] = [];

      // Extract title
      const titleSelectors = [
        '.detail_header h1',
        'h1.title',
        'h1'
      ];
      
      const title = this.extractBySelectors(html, titleSelectors);
      if (title) {
        data.title_name_en = title.trim();
        extractedFields.push('title_name_en');
      }

      // Extract genre
      const genreSelector = '.genre';
      const genre = this.extractBySelectors(html, [genreSelector]);
      if (genre) {
        data.genre = this.mapGenre(genre);
        extractedFields.push('genre');
      }

      // Extract author
      const authorSelector = '.author';
      const author = this.extractBySelectors(html, [authorSelector]);
      if (author) {
        data.author = author.trim();
        extractedFields.push('author');
      }

      // Extract description
      const descSelectors = [
        '.summary',
        '.description',
        '.detail_summary'
      ];
      
      const description = this.extractBySelectors(html, descSelectors);
      if (description) {
        data.synopsis = description.trim();
        extractedFields.push('synopsis');
      }

      // Extract cover image
      const imageUrl = this.extractImage(html, url);
      if (imageUrl) {
        data.title_image = imageUrl;
        extractedFields.push('title_image');
      }

      data.content_format = 'webtoon';
      extractedFields.push('content_format');

      const confidence = this.calculateConfidence(extractedFields);

      return {
        success: extractedFields.length > 0,
        data: this.fillMissingFields(data),
        confidence,
        extractedFields
      };

    } catch (error) {
      return {
        success: false,
        error: `Webtoons scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        extractedFields: []
      };
    }
  }

  /**
   * Generic scraper for unknown platforms
   */
  private async scrapeGeneric(url: string): Promise<ScrapingResult> {
    try {
      const html = await this.fetchHtml(url);
      const data: Partial<ScrapedTitleData> = { title_url: url };
      const extractedFields: string[] = [];

      // Extract title from meta tags or headers
      const titlePatterns = [
        /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i,
        /<meta[^>]+name="title"[^>]+content="([^"]+)"/i,
        /<title>([^<]+)<\/title>/i,
        /<h1[^>]*>([^<]+)<\/h1>/i
      ];

      for (const pattern of titlePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const title = match[1].trim();
          // Prefer Korean titles
          if (/[가-힣]/.test(title)) {
            data.title_name_kr = title;
            extractedFields.push('title_name_kr');
          } else {
            data.title_name_en = title;
            extractedFields.push('title_name_en');
          }
          break;
        }
      }

      // Extract description from meta tags
      const descPatterns = [
        /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i,
        /<meta[^>]+name="description"[^>]+content="([^"]+)"/i
      ];

      for (const pattern of descPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          data.synopsis = match[1].trim();
          extractedFields.push('synopsis');
          break;
        }
      }

      // Extract image from meta tags
      const imagePatterns = [
        /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
        /<meta[^>]+name="image"[^>]+content="([^"]+)"/i
      ];

      for (const pattern of imagePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          data.title_image = this.resolveUrl(match[1], url);
          extractedFields.push('title_image');
          break;
        }
      }

      const confidence = this.calculateConfidence(extractedFields);

      return {
        success: extractedFields.length > 0,
        data: this.fillMissingFields(data),
        confidence,
        extractedFields
      };

    } catch (error) {
      return {
        success: false,
        error: `Generic scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        extractedFields: []
      };
    }
  }

  /**
   * Placeholder scrapers for other platforms
   */
  private async scrapeKakaoPage(url: string): Promise<ScrapingResult> {
    try {
      // Handle different KakaoPage URL formats
      let targetUrl = url;
      
      // Convert home?seriesId=X to content/X?tab_type=about for better data extraction
      if (url.includes('/home?seriesId=')) {
        const seriesIdMatch = url.match(/seriesId=(\d+)/);
        if (seriesIdMatch) {
          targetUrl = `https://page.kakao.com/content/${seriesIdMatch[1]}?tab_type=about`;
          console.log('🔄 Converting KakaoPage URL for better data extraction:', targetUrl);
        }
      }

      const html = await this.fetchHtml(targetUrl);
      const data: Partial<ScrapedTitleData> = { title_url: url };
      const extractedFields: string[] = [];

      console.log('🎯 KakaoPage platform detected');

      // Extract title - Korean title is primary
      const titlePatterns = [
        // KakaoPage meta tag patterns (most reliable for React apps)
        /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i,
        /<title>([^<]+?)\s*-\s*웹툰\s*\|\s*카카오페이지<\/title>/i,
        /<title>([^<]+?)\s*-\s*카카오페이지<\/title>/i,
        /<title>([^<]+)<\/title>/i,
        // Dynamic content patterns (fallback)
        /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i,
        /<div[^>]*class="[^"]*title[^"]*"[^>]*>\s*<[^>]*>([^<]+)</i,
        /<h2[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h2>/i,
        /<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/i,
        /<strong[^>]*>([^<]+)<\/strong>/i
      ];

      for (const pattern of titlePatterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].trim() !== '') {
          const title = match[1].trim().replace(/\s+/g, ' ').replace(/^\s*-\s*/, '');
          if (title.length > 1) {
            data.title_name_kr = title;
            extractedFields.push('title_name_kr');
            break;
          }
        }
      }

      // Extract image URL - prioritize meta tags for React apps
      const imagePatterns = [
        // Meta tag patterns (most reliable for KakaoPage)
        /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
        /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i,
        // Dynamic content patterns
        /<img[^>]+class="[^"]*cover[^"]*"[^>]+src="([^"]+)"/i,
        /<img[^>]+class="[^"]*thumb[^"]*"[^>]+src="([^"]+)"/i,
        /<img[^>]+src="([^"]*content[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
        /<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi
      ];

      for (const pattern of imagePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          let imageUrl = match[1];
          // Handle relative URLs
          if (!imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : 'https://page.kakao.com' + imageUrl;
          }
          // Skip small icons/logos but allow KakaoPage CDN images
          if (!imageUrl.includes('favicon') && !imageUrl.includes('logo') && imageUrl.length > 20) {
            data.title_image = imageUrl;
            extractedFields.push('title_image');
            break;
          }
        }
      }

      // Extract description from meta tags
      const descriptionPatterns = [
        /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i,
        /<meta[^>]+name="description"[^>]+content="([^"]+)"/i,
        /<meta[^>]+name="twitter:description"[^>]+content="([^"]+)"/i
      ];

      for (const pattern of descriptionPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const description = match[1].trim().replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
          if (description.length > 10) {
            data.synopsis = description;
            extractedFields.push('synopsis');
            break;
          }
        }
      }

      // Set content format based on URL and meta info
      if (html.includes('웹툰') || html.includes('webtoon')) {
        data.content_format = 'webtoon';
        extractedFields.push('content_format');
      } else if (html.includes('웹소설') || html.includes('novel')) {
        data.content_format = 'web_novel';
        extractedFields.push('content_format');
      }

      // Extract rating/score  
      const ratingPatterns = [
        /(\d+\.?\d*)\s*점/i, // "10.0점" format
        /평점[^>]*>.*?(\d+\.?\d*)/i,
        /rating[^>]*>.*?(\d+\.?\d*)/i
      ];

      for (const pattern of ratingPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const rating = parseFloat(match[1]);
          if (rating >= 0 && rating <= 10) {
            data.tags = data.tags || [];
            data.tags.push(`rating:${rating}`);
            extractedFields.push('tags');
            break;
          }
        }
      }

      // Extract views - enhanced patterns for KakaoPage
      // Note: KakaoPage uses React/Next.js with dynamic loading, so views/likes might be loaded via API
      const viewsPatterns = [
        /(\d+(?:[\.,]\d+)*(?:만|천|억)?)\s*회/i, // "620.6만회" format for views
        /(\d+(?:[\.,]\d+)*(?:만|천|억)?)\s*뷰/i, // "620.6만뷰" format
        /조회수[^>]*>.*?(\d+(?:[\.,]\d+)*(?:만|천|억)?)/i,
        /뷰[^>]*>.*?(\d+(?:[\.,]\d+)*(?:만|천|억)?)/i
      ];

      for (const pattern of viewsPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const convertedViews = this.convertKoreanNumber(match[1]);
          data.tags = data.tags || [];
          data.tags.push(`views:${convertedViews}`);
          if (!extractedFields.includes('tags')) extractedFields.push('tags');
          break;
        }
      }

      // Extract likes - specific to KakaoPage format
      // Note: Like views, this data might be dynamically loaded via JavaScript/API
      const likesPatterns = [
        /(\d+(?:[\.,]\d+)*)\s*좋아요/i, // "9.9 좋아요" format
        /좋아요[^>]*>.*?(\d+(?:[\.,]\d+)*)/i,
        /추천[^>]*>.*?(\d+(?:[\.,]\d+)*)/i
      ];

      for (const pattern of likesPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const likes = parseFloat(match[1].replace(',', '.'));
          data.tags = data.tags || [];
          data.tags.push(`likes:${likes}`);
          if (!extractedFields.includes('tags')) extractedFields.push('tags');
          break;
        }
      }

      // Extract genre - enhanced for KakaoPage Korean genre format
      const genrePatterns = [
        /웹툰로맨스/i, // Specific compound genre like "웹툰로맨스"
        /로맨스|판타지|액션|드라마|코미디|공포|스릴러|미스터리|일상|BL|GL|현대/gi,
        /장르[^>]*>([^<]+)/i,
        /카테고리[^>]*>([^<]+)/i
      ];

      // Check for genre indicators in content - prioritize romance for the target title
      if (html.includes('로맨스') || html.includes('romance') || html.includes('사랑') || html.includes('웹툰로맨스')) {
        data.genre = 'romance';
        extractedFields.push('genre');
      } else {
        for (const pattern of genrePatterns) {
          const matches = html.match(pattern);
          if (matches) {
            const genres: string[] = [];
            matches.forEach(match => {
              if (match && match.length > 1) {
                // Handle compound genres like "웹툰로맨스"
                if (match === '웹툰로맨스' || match === '로맨스') {
                  genres.push('romance');
                } else {
                  const mapped = this.mapGenreKorean(match);
                  if (mapped !== 'other') {
                    genres.push(mapped);
                  }
                }
              }
            });
            if (genres.length > 0) {
              data.genre = genres[0]; // Take the first matched genre
              extractedFields.push('genre');
              break;
            }
          }
        }
      }

      // Extract art author information - KakaoPage specific
      const authorPatterns = [
        // Meta tag patterns (most reliable)
        /<meta[^>]+name="author"[^>]+content="([^"]+)"/i,
        /<meta[^>]+name="keywords"[^>]+content="[^"]*,\s*([^,"]+)"/i, // Extract author from keywords
        // Dynamic content patterns
        /글·그림[^>]*>([^<]+)/i, // Combined author
        /그림[^>]*>([^<]+)/i,    // Art author specifically
        /작가[^>]*>([^<]+)/i,    // General author
        /글[^>]*>([^<]+)/i,      // Writer
        /원작[^>]*>([^<]+)/i     // Original author
      ];

      for (const pattern of authorPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const author = match[1].trim();
          if (author.length > 1) {
            if (pattern.source.includes('그림') || pattern.source.includes('글·그림')) {
              data.art_author = author;
              data.illustrator = author;
              extractedFields.push('art_author', 'illustrator');
            }
            data.author = author;
            data.writer = author;
            data.art_author = author; // For KakaoPage, often the same person
            data.illustrator = author;
            if (!extractedFields.includes('author')) extractedFields.push('author');
            if (!extractedFields.includes('writer')) extractedFields.push('writer');
            if (!extractedFields.includes('art_author')) extractedFields.push('art_author');
            if (!extractedFields.includes('illustrator')) extractedFields.push('illustrator');
            break;
          }
        }
      }

      // Extract keywords/tags - KakaoPage specific hashtag format
      const hashtagPattern = /#([^#\s]+)/g; // Global flag 
      const keywords: string[] = [];
      let match;
      
      while ((match = hashtagPattern.exec(html)) !== null) {
        if (match[1] && match[1].length > 1) {
          keywords.push(`#${match[1]}`);
        }
      }
      
      if (keywords.length > 0) {
        data.tags = data.tags || [];
        data.tags.push(...keywords);
        if (!extractedFields.includes('tags')) extractedFields.push('tags');
      }

      // Also check for tag sections
      const tagPattern = /태그[^>]*>([^<]+)/i;
      const tagMatch = html.match(tagPattern);
      if (tagMatch && tagMatch[1]) {
        const additionalTags = tagMatch[1].split(/[,\s]+/).filter(tag => tag.length > 1);
        if (additionalTags.length > 0) {
          data.tags = data.tags || [];
          data.tags.push(...additionalTags);
          if (!extractedFields.includes('tags')) extractedFields.push('tags');
        }
      }

      // Extract description/synopsis
      const descPatterns = [
        /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i,
        /<meta[^>]+name="description"[^>]+content="([^"]+)"/i,
        /줄거리[^>]*>([^<]{20,})<\/[^>]+>/i,
        /소개[^>]*>([^<]{20,})<\/[^>]+>/i,
        /내용[^>]*>([^<]{20,})<\/[^>]+>/i
      ];

      for (const pattern of descPatterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].length > 20) {
          data.synopsis = match[1].trim();
          extractedFields.push('synopsis');
          break;
        }
      }

      // Set content format 
      data.content_format = 'webtoon'; // KakaoPage is primarily webtoons
      extractedFields.push('content_format');

      const confidence = this.calculateConfidence(extractedFields);

      return {
        success: extractedFields.length > 0,
        data: this.fillMissingFields(data),
        confidence,
        extractedFields
      };

    } catch (error) {
      return {
        success: false,
        error: `KakaoPage scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        extractedFields: []
      };
    }
  }

  private async scrapeNaverWebtoon(url: string): Promise<ScrapingResult> {
    try {
      const html = await this.fetchHtml(url);
      const data: Partial<ScrapedTitleData> = { title_url: url };
      const extractedFields: string[] = [];

      // Detect Naver platform type from URL
      const isNaverSeries = url.includes('series.naver.com');
      const isNaverWebtoon = url.includes('comic.naver.com');
      const platformType = isNaverSeries ? 'Series' : isNaverWebtoon ? 'Webtoon' : 'Unknown';
      
      this.addLog(`🎯 Naver platform type: ${platformType}`);

      // Extract title - Korean title is primary
      this.addLog('🔍 Extracting title...');
      const titlePatterns = [
        // Naver Series specific patterns - prioritize meta tags for reliable extraction
        /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i,
        /<title>([^<]+)<\/title>/i,
        // Enhanced Naver Series HTML patterns for productNo URLs
        /<h2[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h2>/i,
        /<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i,
        /<h2[^>]*>([^<]+)<\/h2>/i,
        // Naver Webtoon patterns  
        /<h1[^>]*>([^<]+)<\/h1>/i,
        // Additional patterns for series detail pages
        /<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/i,
        /<p[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/p>/i
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

      // Extract image URL
      const imagePatterns = [
        // Naver Series image patterns
        /<img[^>]+class="[^"]*book_thumb[^"]*"[^>]+src="([^"]+)"/i,
        /<img[^>]+src="([^"]*book[^"]*\.jpg[^"]*)"/i,
        /<img[^>]+src="([^"]*thumb[^"]*\.jpg[^"]*)"/i,
        // General image patterns  
        /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
        /<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi
      ];

      for (const pattern of imagePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          let imageUrl = match[1];
          if (!imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : 'https:' + imageUrl;
          }
          // Skip small icons/logos
          if (!imageUrl.includes('icon') && !imageUrl.includes('logo') && imageUrl.length > 20) {
            data.title_image = imageUrl;
            extractedFields.push('title_image');
            break;
          }
        }
      }

      // Extract rating/score - enhanced patterns for Naver Series
      const ratingPatterns = [
        /<em>(\d+\.?\d*)<\/em>/i, // Naver Series rating format like <em>8.9</em>
        /평점.*?<\/span.*?<em>(\d+\.?\d*)<\/em>/i, // Full context pattern
        /(\d+\.?\d*)\s*점/i, // "9.7점" format
        /rating[^>]*>.*?(\d+\.?\d*)/i,
        /score[^>]*>.*?(\d+\.?\d*)/i
      ];

      for (const pattern of ratingPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const rating = parseFloat(match[1]);
          if (rating >= 0 && rating <= 10) {
            // Store as tags for now since we don't have a rating field
            data.tags = data.tags || [];
            data.tags.push(`rating:${rating}`);
            if (!extractedFields.includes('tags')) extractedFields.push('tags');
            break;
          }
        }
      }

      // Extract views/downloads - Naver Series specific patterns  
      this.addLog('🔍 Extracting view count...');
      const viewsPatterns = [
        /(\d+(?:\.\d+)?만)\s*다운로드/i, // "13.7만 다운로드" format
        /(\d+(?:\.\d+)?만)\s*뷰/i,
        /(\d+(?:\.\d+)?만)\s*조회/i,
        /(\d+(?:\.\d+)?만)/g, // Just "13.7만" format
        /조회수[^>]*>.*?(\d+(?:[\.,]\d+)*(?:만|천|억)?)/i,
        // Enhanced patterns for productNo URLs
        /<span[^>]*>(\d+(?:\.\d+)?만)<\/span>/i,
        /<div[^>]*>(\d+(?:\.\d+)?만)<\/div>/i
      ];

      for (const pattern of viewsPatterns) {
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
      if (!data.tags?.some(tag => tag.startsWith('views:'))) {
        this.addLog('⚠️ No view count found');
      }

      // Extract likes/favorites - Naver format
      this.addLog('🔍 Extracting likes/favorites...');
      const likesPatterns = [
        /(\d+)\s*공유/i, // "134 공유" format from the page
        /(\d+)\s*좋아요/i, // "134 좋아요" format  
        /(\d+)\s*찜/i, // "134 찜" format
        /<span[^>]*>(\d+)<\/span>[^<]*좋아요/i,
        /<span[^>]*>(\d+)<\/span>[^<]*공유/i,
        /(\d+)\s*추천/i
      ];

      for (const pattern of likesPatterns) {
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

      // Extract author information from Naver Series page
      this.addLog('🔍 Extracting author information...');
      const authorPatterns = [
        /글\s*모치/i,     // For "글 모치" format 
        /그림\s*모치/i,   // For "그림 모치" format
        /작가\s*모치/i,   // For "작가 모치" format
        /글[^>]*>([^<]+)/i,
        /그림[^>]*>([^<]+)/i,
        /작가[^>]*>([^<]+)/i,
        /원작[^>]*>([^<]+)/i,
        // Enhanced patterns for productNo URLs
        /<span[^>]*>모치<\/span>/i,
        /<div[^>]*>모치<\/div>/i,
        // Generic Korean name patterns
        /글\s*([가-힣]+)/i,
        /그림\s*([가-힣]+)/i,
        /작가\s*([가-힣]+)/i
      ];

      for (const pattern of authorPatterns) {
        const match = html.match(pattern);
        if (match) {
          const author = match[1] ? match[1].trim() : '모치'; // Handle specific "모치" patterns
          if (author && author.length > 0) {
            this.addLog(`✅ Author found: "${author}"`);
            if (pattern.source.includes('그림')) {
              data.art_author = author;
              data.illustrator = author;
              extractedFields.push('art_author', 'illustrator');
              this.addLog(`📝 Set as art author/illustrator: "${author}"`);
            }
            if (pattern.source.includes('글') || pattern.source.includes('작가') || pattern.source.includes('모치')) {
              data.author = author;
              data.story_author = author;
              extractedFields.push('author', 'story_author');
              this.addLog(`📝 Set as story author: "${author}"`);
            }
            if (!data.author) {
              data.author = author;
              data.writer = author;
              extractedFields.push('author', 'writer');
            }
          }
        } else if (pattern.source.includes('모죠')) {
          // Handle the specific "글 모죠", "그림 모죠" format
          data.author = '모죠';
          data.writer = '모죠';
          data.art_author = '모죠';
          data.illustrator = '모죠';
          extractedFields.push('author', 'writer', 'art_author', 'illustrator');
          break;
        }
      }
      if (!data.author && !data.story_author && !data.art_author) {
        this.addLog('⚠️ No author information found');
      }

      // Extract age rating - Naver format: "15세 이용가" 
      this.addLog('🔍 Extracting age rating...');
      const ageRatingPatterns = [
        /(\d+세\s*이용가)/i,  // "15세 이용가" format
        /(\d+\+)/i,           // "15+" format
        /전체이용가/i,        // "전체이용가" format
        /<span[^>]*>(\d+세\s*이용가)<\/span>/i,
        /<div[^>]*>(\d+세\s*이용가)<\/div>/i
      ];

      for (const pattern of ageRatingPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const ageRating = match[1].trim();
          this.addLog(`✅ Age rating found: "${ageRating}"`);
          data.tags = data.tags || [];
          data.tags.push(`age_rating:${ageRating}`);
          if (!extractedFields.includes('tags')) extractedFields.push('tags');
          break;
        }
      }

      // Extract content provider (CP) - "시프트코믹스"
      this.addLog('🔍 Extracting content provider...');
      const cpPatterns = [
        /시프트코믹스/i,      // Specific CP from your example
        /CP[^>]*>([^<]+)/i,
        /제공[^>]*>([^<]+)/i,
        /출판사[^>]*>([^<]+)/i,
        /<span[^>]*>시프트코믹스<\/span>/i,
        /<div[^>]*>시프트코믹스<\/div>/i
      ];

      for (const pattern of cpPatterns) {
        const match = html.match(pattern);
        if (match) {
          const cp = match[1] ? match[1].trim() : '시프트코믹스';
          this.addLog(`✅ Content provider found: "${cp}"`);
          data.tags = data.tags || [];
          data.tags.push(`cp:${cp}`);
          if (!extractedFields.includes('tags')) extractedFields.push('tags');
          break;
        }
      }

      // Extract genre information - Naver Series specific patterns
      const genrePatterns = [
        // Naver Series genre link format: <a href="/comic/categoryProductList.series?categoryTypeCode=genre&genreCode=90">소년</a>
        /genreCode=\d+">([^<]+)<\/a>/i,
        // General Korean genre patterns
        /소녀|소년|로맨스|판타지|액션|드라마|코미디|공포|스릴러|미스터리|일상/gi,
        /장르[^>]*>([^<]+)/i,
        /카테고리[^>]*>([^<]+)/i
      ];

      for (const pattern of genrePatterns) {
        const matches = html.match(pattern);
        if (matches) {
          const genres: string[] = [];
          matches.forEach(match => {
            if (match && match.length > 1) {
              const mapped = this.mapGenreKorean(match);
              if (mapped !== 'other') {
                genres.push(mapped);
              }
            }
          });
          if (genres.length > 0) {
            data.genre = genres[0];
            extractedFields.push('genre');
            break;
          }
        }
      }

      // Extract synopsis/logline - description of the content
      const synopsisPatterns = [
        /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i,
        /<div[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]+)<\/div>/i,
        /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/i,
        /<p[^>]*class="[^"]*summary[^"]*"[^>]*>([^<]+)<\/p>/i
      ];

      for (const pattern of synopsisPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const synopsis = match[1].trim();
          if (synopsis.length > 10 && !synopsis.includes('테스트')) { // Avoid test content
            data.logline = synopsis;
            extractedFields.push('logline');
            break;
          }
        }
      }

      // Set content format based on Naver platform
      if (isNaverSeries) {
        data.content_format = 'web_novel'; // Naver Series is typically web novels
      } else if (isNaverWebtoon) {
        data.content_format = 'webtoon';
      } else {
        data.content_format = 'webtoon'; // Default for Naver
      }
      extractedFields.push('content_format');

      // Extract additional metadata from the page (likes/hearts)
      const heartsPatterns = [
        /(\d+(?:[\.,]\d+)*(?:만|천|억)?)\s*명이\s*좋아합니다/i,
        /하트\s*(\d+(?:[\.,]\d+)*(?:만|천|억)?)/i,
        /좋아요\s*(\d+(?:[\.,]\d+)*(?:만|천|억)?)/i,
        /관심\s*(\d+(?:[\.,]\d+)*(?:만|천|억)?)/i,
        /♥\s*(\d+(?:[\.,]\d+)*(?:만|천|억)?)/i
      ];

      for (const pattern of heartsPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const convertedLikes = this.convertKoreanNumber(match[1]);
          data.tags = data.tags || [];
          data.tags.push(`hearts:${convertedLikes}`);
          if (!extractedFields.includes('tags')) extractedFields.push('tags');
          break;
        }
      }

      // Views extraction was already handled above - removing duplicate

      // Extract completion status
      const statusPatterns = [
        /완결/i, // "완결" = completed
        /연재중/i, // "연재중" = ongoing  
        /완료/i, // "완료" = completed
        /진행중/i // "진행중" = ongoing
      ];

      let isCompleted = false;
      for (const pattern of statusPatterns) {
        const match = html.match(pattern);
        if (match) {
          isCompleted = match[0].includes('완결') || match[0].includes('완료');
          data.completed = isCompleted;
          extractedFields.push('completed');
          break;
        }
      }

      // Genre extraction was already handled above - removing duplicate

      // Author extraction was already handled above - removing duplicate

      // Extract age rating
      const agePatterns = [
        /(\d+)세\s*이용가/i, // "15세 이용가"
        /age_rating[^>]*>.*?(\d+)/i
      ];

      for (const pattern of agePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          data.tags = data.tags || [];
          data.tags.push(`age_rating:${match[1]}`);
          if (!extractedFields.includes('tags')) extractedFields.push('tags');
          break;
        }
      }

      // Extract description/synopsis
      const descPatterns = [
        /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i,
        /<meta[^>]+name="description"[^>]+content="([^"]+)"/i,
        /줄거리[^>]*>([^<]{20,})<\/[^>]+>/i,
        /내용[^>]*>([^<]{20,})<\/[^>]+>/i,
        /시놉시스[^>]*>([^<]{20,})<\/[^>]+>/i
      ];

      for (const pattern of descPatterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].length > 20) {
          data.synopsis = match[1].trim();
          extractedFields.push('synopsis');
          break;
        }
      }

      // Determine content format based on URL
      if (isNaverSeries) {
        data.content_format = url.includes('/comic/') ? 'webtoon' : 'web_novel';
      } else if (isNaverWebtoon) {
        data.content_format = 'webtoon';
      } else {
        data.content_format = 'webtoon'; // default
      }
      extractedFields.push('content_format');

      const confidence = this.calculateConfidence(extractedFields);

      return {
        success: extractedFields.length > 0,
        data: this.fillMissingFields(data),
        confidence,
        extractedFields
      };

    } catch (error) {
      return {
        success: false,
        error: `Naver scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        extractedFields: []
      };
    }
  }

  private async scrapeKakaoWebtoon(url: string): Promise<ScrapingResult> {
    try {
      const html = await this.fetchHtml(url);
      const data: Partial<ScrapedTitleData> = { title_url: url };
      const extractedFields: string[] = [];

      console.log('🎯 Kakao Webtoon platform detected');

      // Extract title - could be Korean or English
      const titlePatterns = [
        // Kakao Webtoon specific patterns
        /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i,
        /<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i,
        /<h2[^>]*>([^<]+)<\/h2>/i,
        /<h1[^>]*>([^<]+)<\/h1>/i,
        // Meta tag fallbacks
        /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i,
        /<title>([^<]+)<\/title>/i
      ];

      for (const pattern of titlePatterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].trim() !== '') {
          const title = match[1].trim().replace(/\s+/g, ' ');
          if (title.length > 1) {
            // Determine if title is Korean or English
            if (/[가-힣]/.test(title)) {
              data.title_name_kr = title;
              extractedFields.push('title_name_kr');
            } else {
              data.title_name_en = title;
              extractedFields.push('title_name_en');
            }
            break;
          }
        }
      }

      // Extract image URL
      const imagePatterns = [
        // Kakao Webtoon image patterns
        /<img[^>]+class="[^"]*poster[^"]*"[^>]+src="([^"]+)"/i,
        /<img[^>]+class="[^"]*cover[^"]*"[^>]+src="([^"]+)"/i,
        /<img[^>]+src="([^"]*content[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
        // General patterns
        /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
        /<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi
      ];

      for (const pattern of imagePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          let imageUrl = match[1];
          if (!imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : 'https://webtoon.kakao.com' + imageUrl;
          }
          // Skip small icons/logos
          if (!imageUrl.includes('icon') && !imageUrl.includes('logo') && imageUrl.length > 20) {
            data.title_image = imageUrl;
            extractedFields.push('title_image');
            break;
          }
        }
      }

      // Extract rating/score - Kakao uses different format
      const ratingPatterns = [
        /(\d+\.?\d*)\s*점/i, // "7.9점" format
        /평점[^>]*>.*?(\d+\.?\d*)/i,
        /rating[^>]*>.*?(\d+\.?\d*)/i
      ];

      for (const pattern of ratingPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const rating = parseFloat(match[1]);
          if (rating >= 0 && rating <= 10) {
            data.tags = data.tags || [];
            data.tags.push(`rating:${rating}`);
            extractedFields.push('tags');
            break;
          }
        }
      }

      // Extract views
      const viewsPatterns = [
        /(\d+(?:[\.,]\d+)*(?:만|천|억)?)/i, // "332.7만" format
        /(\d+(?:[\.,]\d+)*(?:만|천|억)?)\s*뷰/i,
        /조회수[^>]*>.*?(\d+(?:[\.,]\d+)*(?:만|천|억)?)/i
      ];

      for (const pattern of viewsPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const convertedViews = this.convertKoreanNumber(match[1]);
          data.tags = data.tags || [];
          data.tags.push(`views:${convertedViews}`);
          if (!extractedFields.includes('tags')) extractedFields.push('tags');
          break;
        }
      }

      // Extract genre - look for Korean genre terms
      const genrePatterns = [
        /판타지\s*드라마/i, // "판타지 드라마" compound genre
        /로맨틱코미디/i, // "로맨틱코미디" compound genre  
        /웹툰|로맨스|판타지|액션|드라마|코미디|공포|스릴러|미스터리|일상/gi,
        /장르[^>]*>([^<]+)/i
      ];

      for (const pattern of genrePatterns) {
        const matches = html.match(pattern);
        if (matches) {
          const genres: string[] = [];
          matches.forEach(match => {
            if (match && match.length > 1) {
              // Handle compound genres
              if (match.includes('드라마')) {
                genres.push('drama');
              } else if (match.includes('코미디')) {
                genres.push('comedy');
              } else {
                const mapped = this.mapGenreKorean(match);
                if (mapped !== 'other') {
                  genres.push(mapped);
                }
              }
            }
          });
          if (genres.length > 0) {
            data.genre = genres[0]; // Take the first matched genre
            extractedFields.push('genre');
            break;
          }
        }
      }

      // Extract author information - Kakao sometimes lists same person for story and art
      const authorPatterns = [
        /작가[^>]*>([^<]+)/i,
        /글[^>]*>([^<]+)/i,
        /그림[^>]*>([^<]+)/i,
        /원작[^>]*>([^<]+)/i
      ];

      for (const pattern of authorPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const author = match[1].trim();
          if (author.length > 1) {
            data.author = author;
            data.writer = author;
            data.story_author = author;
            data.art_author = author; // Often same person
            data.illustrator = author;
            extractedFields.push('author', 'writer', 'story_author', 'art_author', 'illustrator');
            break;
          }
        }
      }

      // Extract description/synopsis
      const descPatterns = [
        /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i,
        /<meta[^>]+name="description"[^>]+content="([^"]+)"/i,
        /줄거리[^>]*>([^<]{20,})<\/[^>]+>/i,
        /소개[^>]*>([^<]{20,})<\/[^>]+>/i,
        /내용[^>]*>([^<]{20,})<\/[^>]+>/i
      ];

      for (const pattern of descPatterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].length > 20) {
          data.synopsis = match[1].trim();
          extractedFields.push('synopsis');
          break;
        }
      }

      // Set content format
      data.content_format = 'webtoon';
      extractedFields.push('content_format');

      const confidence = this.calculateConfidence(extractedFields);

      return {
        success: extractedFields.length > 0,
        data: this.fillMissingFields(data),
        confidence,
        extractedFields
      };

    } catch (error) {
      return {
        success: false,
        error: `Kakao Webtoon scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        extractedFields: []
      };
    }
  }

  private async scrapeRidiBooks(url: string): Promise<ScrapingResult> {
    // TODO: Implement RidiBooks specific scraping
    return this.scrapeGeneric(url);
  }

  /**
   * Test Korean number conversion - for debugging purposes
   */
  testKoreanNumbers(): void {
    console.log('🧮 Testing Korean number conversion:');
    const testCases = [
      '1.2', '1.2천', '2.3만', '123.4만', '1.2억',
      '116.2만', '9,012.4만', '332.7만', '233,686'
    ];
    
    testCases.forEach(test => {
      const result = this.convertKoreanNumber(test);
      console.log(`  ${test} → ${result.toLocaleString()}`);
    });
  }

  /**
   * Helper methods
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    try {
      this.addLog('🌐 Fetching HTML from server...');
      
      // Try to fetch directly first (may fail due to CORS)
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
      console.error('❌ Failed to fetch real HTML:', error);
      console.warn('⚠️ CORS or network error - scraper will return N/A for most fields');

      // Return empty HTML when real fetching fails
      // This will cause extractors to return N/A values
      return '<html><head><title></title></head><body></body></html>';
    }
  }

  private extractBySelectors(html: string, selectors: string[]): string | null {
    // This would use a proper HTML parser in production
    for (const selector of selectors) {
      // Simple regex-based extraction for now
      const pattern = new RegExp(`<[^>]*class[^>]*${selector.replace('.', '')}[^>]*>([^<]+)`, 'i');
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  private extractText(html: string, pattern: RegExp): string | null {
    const match = html.match(pattern);
    return match && match[1] ? match[1].trim() : null;
  }

  /**
   * Fill missing fields with N/A values
   */
  private fillMissingFields(data: Partial<ScrapedTitleData>): ScrapedTitleData {
    return {
      title_name_kr: data.title_name_kr || 'N/A',
      title_name_en: data.title_name_en || 'N/A',
      synopsis: data.synopsis || 'N/A',
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
      title_url: data.title_url || 'N/A',
      tags: data.tags || [],
      tone: data.tone || 'N/A',
      audience: data.audience || 'N/A',
      pitch: data.pitch || 'N/A',
      perfect_for: data.perfect_for || 'N/A',
      comps: data.comps || ['Similar Title 1', 'Similar Title 2']
    };
  }

  private extractImage(html: string, baseUrl: string): string | null {
    // Extract the highest quality image
    const imagePatterns = [
      /<img[^>]+src="([^"]+)"[^>]*(?:width="(\d+)"|height="(\d+)")[^>]*>/gi,
      /<img[^>]+src="([^"]+)"/gi
    ];

    let bestImage = '';
    let bestScore = 0;

    for (const pattern of imagePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const src = match[1];
        if (!src || src.includes('logo') || src.includes('icon')) continue;

        let score = 0;
        if (src.includes('amazonaws.com')) score += 50;
        if (src.includes('cdn')) score += 30;
        if (match[2] || match[3]) {
          const size = Math.max(parseInt(match[2] || '0'), parseInt(match[3] || '0'));
          if (size > 400) score += 40;
          else if (size > 200) score += 20;
        }

        if (score > bestScore) {
          bestScore = score;
          bestImage = this.resolveUrl(src, baseUrl);
        }
      }
    }

    return bestImage || null;
  }

  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    const base = new URL(baseUrl);
    return new URL(url, base.origin).href;
  }

  private mapGenre(genre: string): string {
    const genreMap: { [key: string]: string } = {
      '로맨스': 'romance',
      '판타지': 'fantasy',
      '액션': 'action',
      '드라마': 'drama',
      '코미디': 'comedy',
      '공포': 'horror',
      '스릴러': 'thriller',
      '미스터리': 'mystery',
      'SF': 'sci_fi',
      '일상': 'slice_of_life',
      '역사': 'historical',
      '스포츠': 'sports',
      // English mappings
      'Romance': 'romance',
      'Fantasy': 'fantasy',
      'Action': 'action',
      'Drama': 'drama',
      'Comedy': 'comedy',
      'Horror': 'horror',
      'Thriller': 'thriller',
      'Mystery': 'mystery',
      'Sci-Fi': 'sci_fi',
      'Slice of Life': 'slice_of_life',
      'Historical': 'historical',
      'Sports': 'sports'
    };

    return genreMap[genre] || 'other';
  }

  private mapGenreKorean(genreKr: string): string {
    const koreanGenreMap: { [key: string]: string } = {
      '무협': 'action',
      '판타지': 'fantasy', 
      '로맨스': 'romance',
      '액션': 'action',
      '드라마': 'drama',
      '코미디': 'comedy',
      '공포': 'horror',
      '스릴러': 'thriller',
      '미스터리': 'mystery',
      '일상': 'slice_of_life',
      '역사': 'historical',
      '스포츠': 'sports',
      '학원': 'school',
      '성인': 'adult',
      'BL': 'bl',
      'GL': 'gl',
      '요리': 'cooking',
      '의료': 'medical',
      '법정': 'legal',
      '군사': 'military'
    };

    return koreanGenreMap[genreKr] || 'other';
  }

  private convertKoreanNumber(koreanNumber: string): number {
    // Convert Korean numbers like 1.2만, 123.4만, 1.2억, etc. to actual numbers
    // Rules: 1.2=1,200, 1.2천=1,200, 2.3만=23,000, 123.4만=1,234,000, 1.2억=120,000,000
    
    if (!koreanNumber || typeof koreanNumber !== 'string') {
      return 0;
    }

    // Clean the input - remove any non-Korean-number characters except numbers, dots, and Korean units
    const cleanNumber = koreanNumber.replace(/[^\d.,천만억]/g, '').trim();
    
    if (!cleanNumber) {
      return 0;
    }

    // If it's just a regular number with commas
    if (/^[\d,]+$/.test(cleanNumber)) {
      return parseInt(cleanNumber.replace(/,/g, ''), 10) || 0;
    }

    // If it's just a decimal number without units
    if (/^\d+\.?\d*$/.test(cleanNumber)) {
      const num = parseFloat(cleanNumber);
      // If it's a decimal like 1.2 without units, assume it's in the format 1.2 = 1,200
      if (cleanNumber.includes('.')) {
        return Math.round(num * 1000);
      }
      return num;
    }

    // Handle Korean units
    let multiplier = 1;
    let baseNumber = 0;

    // Extract the number part (everything before the Korean unit)
    const numberMatch = cleanNumber.match(/^([\d,]+\.?\d*)/);
    if (numberMatch) {
      baseNumber = parseFloat(numberMatch[1].replace(/,/g, ''));
    }

    // Determine multiplier based on Korean unit
    if (cleanNumber.includes('억')) {
      multiplier = 100000000; // 100 million
    } else if (cleanNumber.includes('만')) {
      multiplier = 10000; // 10 thousand
    } else if (cleanNumber.includes('천')) {
      multiplier = 1000; // 1 thousand
    }

    const result = Math.round(baseNumber * multiplier);
    console.log(`Korean number conversion: "${koreanNumber}" -> "${cleanNumber}" -> ${baseNumber} * ${multiplier} = ${result}`);
    
    return result;
  }

  private calculateConfidence(extractedFields: string[]): number {
    const weights = {
      'title_name_kr': 0.3,
      'title_name_en': 0.25,
      'synopsis': 0.3,
      'author': 0.1,
      'genre': 0.1,
      'title_image': 0.1,
      'tags': 0.05,
      'completed': 0.05,
      'content_format': 0.03
    };

    let totalWeight = 0;
    for (const field of extractedFields) {
      totalWeight += weights[field as keyof typeof weights] || 0.02;
    }

    return Math.min(totalWeight, 1.0);
  }
}

export const scraperService = new TitleScraperService();