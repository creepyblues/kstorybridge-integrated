import fetch from 'node-fetch';
import { load as loadHtml } from 'cheerio';

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
      
      // Normalize URL early for consistency
      const normalizedUrl = this.normalizeUrl(url);
      if (normalizedUrl !== url) {
        this.addLog(`🔄 Normalized URL: ${normalizedUrl}`);
      }
      const workingUrl = normalizedUrl;
      
      // Validate URL
      if (!this.isValidUrl(workingUrl)) {
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
      const platform = this.detectPlatform(workingUrl);
      this.addLog(`🎯 Platform detected: ${platform}`);

      let result;
      switch (platform) {
        case 'naver':
          this.addLog('🚀 Initiating Naver scraper');
          result = await this.scrapeNaverWebtoon(workingUrl);
          break;
        case 'kakaopage':
          this.addLog('🚀 Initiating KakaoPage scraper');
          result = await this.scrapeKakaoPage(workingUrl);
          break;
        case 'kakao_webtoon':
          this.addLog('🚀 Initiating Kakao Webtoon scraper');
          result = await this.scrapeKakaoWebtoon(workingUrl);
          break;
        case 'webtoons':
          this.addLog('🚀 Initiating Webtoons.com scraper');
          result = await this.scrapeWebtoons(workingUrl);
          break;
        case 'toons':
          this.addLog('🚀 Initiating Toons.kr scraper');
          result = await this.scrapeToonsKr(workingUrl);
          break;
        default:
          this.addLog('🚀 Initiating generic scraper (Cheerio-based)');
          result = await this.scrapeGeneric(workingUrl);
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
    if (hostname.includes('page.kakao.com')) return 'kakaopage';
    if (hostname.includes('webtoon.kakao.com')) return 'kakao_webtoon';
    if (hostname.includes('webtoons.com')) return 'webtoons';
    if (hostname.includes('toons.kr')) return 'toons';
    if (hostname.includes('ridibooks')) return 'ridibooks';
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
    const maxRetries = 2;
    const timeoutMs = 12000;
    const backoffMs = 500;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const attemptLabel = `attempt ${attempt + 1}/${maxRetries + 1}`;
      try {
        this.addLog(`🌐 Fetching HTML from server (${attemptLabel})...`);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
          },
          redirect: 'follow',
          signal: controller.signal
        });
        clearTimeout(timer);

        this.addLog(`📡 HTTP Response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          // Retry on transient statuses
          if ((response.status >= 500 || response.status === 429) && attempt < maxRetries) {
            const wait = backoffMs * (attempt + 1);
            this.addLog(`↻ Transient error ${response.status}. Retrying in ${wait}ms...`);
            await new Promise(r => setTimeout(r, wait));
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        this.addLog(`✅ HTML fetched successfully (${html.length} characters)`);
        this.addLog(`📄 Content preview: ${html.substring(0, 100).replace(/\s+/g, ' ')}...`);
        return html;

      } catch (error) {
        const message = error && typeof error.message === 'string' ? error.message : String(error);
        if (message.includes('The operation was aborted') || message.includes('aborted')) {
          this.addLog(`⏱️ Request timed out (${attemptLabel}) after ${timeoutMs}ms`);
        } else {
          this.addLog(`❌ Fetch error (${attemptLabel}): ${message}`);
        }

        if (attempt < maxRetries) {
          const wait = backoffMs * (attempt + 1);
          this.addLog(`↻ Will retry in ${wait}ms...`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }

        this.addLog('⚠️ All fetch attempts failed - returning minimal HTML');
        return '<html><head><title></title></head><body></body></html>';
      }
    }
  }

  /**
   * Extract common meta fields using Cheerio
   */
  parseMeta(html) {
    try {
      const $ = loadHtml(html);
      const meta = {
        title:
          $('meta[property="og:title"]').attr('content') ||
          $('meta[name="og:title"]').attr('content') ||
          $('meta[name="twitter:title"]').attr('content') ||
          $('meta[name="title"]').attr('content') ||
          $('title').first().text().trim() ||
          null,
        description:
          $('meta[property="og:description"]').attr('content') ||
          $('meta[name="og:description"]').attr('content') ||
          $('meta[name="twitter:description"]').attr('content') ||
          $('meta[name="description"]').attr('content') ||
          null,
        image:
          $('meta[property="og:image"]').attr('content') ||
          $('meta[name="og:image"]').attr('content') ||
          $('meta[name="twitter:image"]').attr('content') ||
          $('meta[name="image"]').attr('content') ||
          null
      };
      return meta;
    } catch (e) {
      return { title: null, description: null, image: null };
    }
  }

  /**
   * Detect and parse Next.js __NEXT_DATA__ JSON
   */
  parseNextData(html) {
    try {
      const $ = loadHtml(html);
      const nextDataRaw = $('script#__NEXT_DATA__').first().html();
      if (!nextDataRaw) return null;
      const json = JSON.parse(nextDataRaw);
      return json;
    } catch {
      return null;
    }
  }

  /**
   * Naver Webtoon/Series scraper with enhanced patterns
   */
  async scrapeNaverWebtoon(url) {
    try {
      const html = await this.fetchHtml(url);
      const $ = loadHtml(html);
      const data = { title_url: url };
      const extractedFields = [];

      // Detect Naver platform type
      const isNaverSeries = url.includes('series.naver.com');
      const platformType = isNaverSeries ? 'Series' : 'Webtoon';
      this.addLog(`🎯 Naver platform type: ${platformType}`);

      // Meta-first extraction (title/desc/image)
      this.addLog('🔍 Extracting title (meta tags)...');
      const meta = this.parseMeta(html);
      if (meta.title && meta.title.trim().length > 1) {
        const title = meta.title.trim().replace(/\s+/g, ' ');
        data.title_name_kr = title;
        extractedFields.push('title_name_kr');
        this.addLog(`✅ Title found via meta: "${title}"`);
      }
      if (meta.description) {
        data.description = meta.description.trim();
        extractedFields.push('description');
      }
      if (meta.image) {
        data.title_image = this.resolveUrl(meta.image, url);
        extractedFields.push('title_image');
        this.addLog('🖼️ Image via meta og:image');
      }

      // Fallback: header selectors for title
      if (!data.title_name_kr) {
        // Fallback: try common headers
        const headerTitle = $('h1').first().text().trim() || $('h2').first().text().trim();
        if (headerTitle) {
          data.title_name_kr = headerTitle;
          extractedFields.push('title_name_kr');
          this.addLog(`✅ Title found via header: "${headerTitle}"`);
        }
      }

      // Image extraction fallbacks for Naver (Series/Webtoon)
      if (!data.title_image) {
        this.addLog('🔍 Extracting image...');
        const imagePatterns = [
          /<img[^>]+class="[^"]*book_thumb[^"]*"[^>]+src="([^"]+)"/i,
          /<img[^>]+class="[^"]*(?:thumb|poster|cover)[^"]*"[^>]+src="([^"]+)"/i,
          /<img[^>]+src="([^"]*book[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
          /<img[^>]+src="([^"]*thumb[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
          /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
          /<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi
        ];
        for (const pattern of imagePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            let imageUrl = match[1];
            if (!imageUrl.startsWith('http')) {
              imageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : this.resolveUrl(imageUrl, url);
            }
            if (!imageUrl.includes('icon') && !imageUrl.includes('logo') && imageUrl.length > 20) {
              data.title_image = imageUrl;
              extractedFields.push('title_image');
              this.addLog('🖼️ Image found via HTML patterns');
              break;
            }
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

      // Extract authors: 글 (writer) → story_author_kr, 그림 (art) → art_author_kr, 작가 → author
      this.addLog('🔍 Extracting authors (글/그림/작가)...');
      const extractFirst = (patterns) => {
        for (const re of patterns) {
          const m = html.match(re);
          if (m && m[1]) {
            const val = String(m[1]).trim();
            if (val && val.length < 50 && !val.includes('style') && !val.includes('class')) return val;
          }
        }
        return null;
      };

      const writerName = extractFirst([
        /글\s*[:\s]*([가-힣A-Za-z0-9._\-]+)/i,
        /글작가[^>]*>([^<]+)/i,
        /글[^>]*>([^<]+)/i
      ]);
      if (writerName) {
        data.story_author_kr = writerName;
        data.story_author = writerName;
        data.writer = writerName;
        if (!extractedFields.includes('story_author_kr')) extractedFields.push('story_author_kr');
        if (!extractedFields.includes('story_author')) extractedFields.push('story_author');
        if (!extractedFields.includes('writer')) extractedFields.push('writer');
        this.addLog(`✅ 글 (writer) → story_author_kr: "${writerName}"`);
      }

      const artistName = extractFirst([
        /그림\s*[:\s]*([가-힣A-Za-z0-9._\-]+)/i,
        /그림[^>]*>([^<]+)/i
      ]);
      if (artistName) {
        data.art_author_kr = artistName;
        data.art_author = artistName;
        data.illustrator = artistName;
        if (!extractedFields.includes('art_author_kr')) extractedFields.push('art_author_kr');
        if (!extractedFields.includes('art_author')) extractedFields.push('art_author');
        if (!extractedFields.includes('illustrator')) extractedFields.push('illustrator');
        this.addLog(`✅ 그림 (art) → art_author_kr: "${artistName}"`);
      }

      const authorGeneric = extractFirst([
        /작가[^>]*>([^<]+)/i
      ]);
      if (authorGeneric) {
        data.author = authorGeneric;
        if (!extractedFields.includes('author')) extractedFields.push('author');
        this.addLog(`✅ 작가 → author: "${authorGeneric}"`);
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

      // Extract content provider (출판사) → cp (publisher)
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
            this.addLog(`✅ Publisher (cp) found: "${publisher}"`);
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
      // Set content format
      if (isNaverSeries) {
        data.content_format = url.includes('/comic/') ? 'webtoon' : 'web_novel';
      } else {
        data.content_format = 'webtoon';
      }
      extractedFields.push('content_format');

      const finalData = this.fillMissingFields(data);

      return {
        success: extractedFields.length > 0,
        data: finalData,
        confidence: this.calculateConfidence(extractedFields),
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
   * Generic scraper using Cheerio meta extraction and minimal fallbacks
   */
  async scrapeGeneric(url) {
    try {
      const html = await this.fetchHtml(url);
      const data = { title_url: url };
      const extractedFields = [];

      // Meta extraction (preferred)
      const meta = this.parseMeta(html);
      if (meta.title) {
        const title = meta.title.trim();
        if (/[가-힣]/.test(title)) {
          data.title_name_kr = title;
          extractedFields.push('title_name_kr');
        } else {
          data.title_name_en = title;
          extractedFields.push('title_name_en');
        }
        this.addLog(`✅ Title via meta: "${title}"`);
      }
      if (meta.description) {
        data.description = meta.description.trim();
        extractedFields.push('description');
      }
      if (meta.image) {
        data.title_image = this.resolveUrl(meta.image, url);
        extractedFields.push('title_image');
      }

      // Detect Next.js data (log presence for diagnostics)
      const nextData = this.parseNextData(html);
      if (nextData) {
        this.addLog('🧩 Detected __NEXT_DATA__ JSON');
      }

      const finalData = this.fillMissingFields(data);
      return {
        success: extractedFields.length > 0,
        data: finalData,
        confidence: this.calculateConfidence(extractedFields),
        extractedFields
      };
    } catch (error) {
      this.addLog(`❌ Generic scraping error: ${error.message}`);
      return { success: false, error: error.message, confidence: 0, extractedFields: [] };
    }
  }

  /**
   * Kakao Page extractor (Cheerio + meta-first approach)
   */
  async scrapeKakaoPage(url) {
    try {
      // Normalize home?seriesId=... to content/{id}?tab_type=about
      let targetUrl = url;
      const seriesIdMatch = url.match(/seriesId=(\d+)/);
      if (seriesIdMatch) {
        targetUrl = `https://page.kakao.com/content/${seriesIdMatch[1]}?tab_type=about`;
        this.addLog(`🔄 Normalized KakaoPage URL: ${targetUrl}`);
      }

      const html = await this.fetchHtml(targetUrl);
      const data = { title_url: url };
      const extractedFields = [];

      // Meta-first extraction
      const meta = this.parseMeta(html);
      if (meta.title) {
        data.title_name_kr = meta.title.trim();
        extractedFields.push('title_name_kr');
        this.addLog(`✅ Title via meta: "${data.title_name_kr}"`);
      }
      if (meta.description) {
        data.description = meta.description.trim();
        extractedFields.push('description');
      }
      if (meta.image) {
        data.title_image = this.resolveUrl(meta.image, targetUrl);
        extractedFields.push('title_image');
      }

      // Heuristic genre mapping from content
      const genreHints = [
        { re: /로맨스/i, g: 'romance' },
        { re: /판타지/i, g: 'fantasy' },
        { re: /액션/i, g: 'action' },
        { re: /드라마/i, g: 'drama' },
        { re: /코미디/i, g: 'comedy' },
        { re: /공포|호러/i, g: 'horror' },
        { re: /스릴러/i, g: 'thriller' },
        { re: /일상/i, g: 'slice_of_life' }
      ];
      for (const { re, g } of genreHints) {
        if (re.test(html)) {
          data.genre = g;
          extractedFields.push('genre');
          break;
        }
      }

      data.content_format = 'webtoon';
      extractedFields.push('content_format');

      const finalData = this.fillMissingFields(data);
      return { success: extractedFields.length > 0, data: finalData, confidence: this.calculateConfidence(extractedFields), extractedFields };
    } catch (error) {
      this.addLog(`❌ KakaoPage scraping error: ${error.message}`);
      return { success: false, error: error.message, confidence: 0, extractedFields: [] };
    }
  }

  /**
   * Kakao Webtoon extractor
   */
  async scrapeKakaoWebtoon(url) {
    try {
      const html = await this.fetchHtml(url);
      const data = { title_url: url };
      const extractedFields = [];

      const meta = this.parseMeta(html);
      if (meta.title) {
        const t = meta.title.trim();
        if (/[가-힣]/.test(t)) {
          data.title_name_kr = t;
          extractedFields.push('title_name_kr');
        } else {
          data.title_name_en = t;
          extractedFields.push('title_name_en');
        }
        this.addLog(`✅ Title via meta: "${t}"`);
      }
      if (meta.description) {
        data.description = meta.description.trim();
        extractedFields.push('description');
      }
      if (meta.image) {
        data.title_image = this.resolveUrl(meta.image, url);
        extractedFields.push('title_image');
      }

      // Simple genre inference
      if (/드라마|romance|로맨스|판타지|액션|코미디/i.test(html)) {
        const gMatch = html.match(/드라마|로맨스|판타지|액션|코미디/i);
        if (gMatch) {
          data.genre = this.mapGenre(gMatch[0]);
          extractedFields.push('genre');
        }
      }

      data.content_format = 'webtoon';
      extractedFields.push('content_format');

      const finalData = this.fillMissingFields(data);
      return { success: extractedFields.length > 0, data: finalData, confidence: this.calculateConfidence(extractedFields), extractedFields };
    } catch (error) {
      this.addLog(`❌ Kakao Webtoon scraping error: ${error.message}`);
      return { success: false, error: error.message, confidence: 0, extractedFields: [] };
    }
  }

  /**
   * LINE Webtoons extractor
   */
  async scrapeWebtoons(url) {
    try {
      const html = await this.fetchHtml(url);
      const data = { title_url: url };
      const extractedFields = [];

      const meta = this.parseMeta(html);
      if (meta.title) {
        const t = meta.title.trim();
        if (/[가-힣]/.test(t)) {
          data.title_name_kr = t;
          extractedFields.push('title_name_kr');
        } else {
          data.title_name_en = t;
          extractedFields.push('title_name_en');
        }
        this.addLog(`✅ Title via meta: "${t}"`);
      }
      if (meta.description) {
        data.description = meta.description.trim();
        extractedFields.push('description');
      }
      if (meta.image) {
        data.title_image = this.resolveUrl(meta.image, url);
        extractedFields.push('title_image');
      }

      data.content_format = 'webtoon';
      extractedFields.push('content_format');

      const finalData = this.fillMissingFields(data);
      return { success: extractedFields.length > 0, data: finalData, confidence: this.calculateConfidence(extractedFields), extractedFields };
    } catch (error) {
      this.addLog(`❌ Webtoons.com scraping error: ${error.message}`);
      return { success: false, error: error.message, confidence: 0, extractedFields: [] };
    }
  }

  /**
   * Toons.kr extractor using Next.js __NEXT_DATA__ when available
   */
  async scrapeToonsKr(url) {
    try {
      const html = await this.fetchHtml(url);
      const data = { title_url: url };
      const extractedFields = [];

      // First, meta
      const meta = this.parseMeta(html);
      if (meta.title) {
        data.title_name_kr = meta.title.trim();
        extractedFields.push('title_name_kr');
      }
      if (meta.description) {
        data.description = meta.description.trim();
        extractedFields.push('description');
      }
      if (meta.image) {
        data.title_image = this.resolveUrl(meta.image, url);
        extractedFields.push('title_image');
      }

      // Next.js data
      const nextData = this.parseNextData(html);
      if (nextData) {
        this.addLog('🧩 Parsing Toons.kr __NEXT_DATA__');
        const recordMap = nextData?.props?.pageProps?.recordMap || {};
        const blockMap = recordMap.block || {};

        // If this URL is a detail page for a specific block, try to locate by pathname id
        const urlIdMatch = url.match(/toons\.kr\/(.+)$/);
        if (urlIdMatch) {
          const blockId = urlIdMatch[1].replace(/\/?$/,'');
          const entry = blockMap[blockId];
          if (entry && entry.value && entry.value.properties) {
            const props = entry.value.properties;
            // Map common fields (property keys may change; best-effort)
            const getText = (val) => {
              if (!val || !Array.isArray(val)) return '';
              const flat = [];
              for (const item of val) {
                if (Array.isArray(item)) {
                  if (typeof item[0] === 'string') flat.push(item[0]);
                  else if (Array.isArray(item[0]) && item[0][0]) flat.push(String(item[0][0]));
                }
              }
              return flat.join(' ').trim();
            };

            const titleTxt = getText(props.title);
            if (titleTxt) { data.title_name_kr = titleTxt; if (!extractedFields.includes('title_name_kr')) extractedFields.push('title_name_kr'); }
            const genreTxt = getText(props['JgOi']);
            if (genreTxt) { data.genre = genreTxt; extractedFields.push('genre'); }
            const writerTxt = getText(props['TGUB']);
            if (writerTxt) { data.writer = writerTxt; data.author = writerTxt; extractedFields.push('writer','author'); }
            const artistTxt = getText(props['ft;E']);
            if (artistTxt) { data.illustrator = artistTxt; data.art_author = artistTxt; extractedFields.push('illustrator','art_author'); }
            const synopsisTxt = getText(props['QvJr']);
            if (synopsisTxt) { data.synopsis = synopsisTxt; extractedFields.push('synopsis'); }
            const linkTxt = getText(props['j=G;']);
            if (linkTxt) { data.tags = [...(data.tags||[]), `external:${linkTxt}`]; if (!extractedFields.includes('tags')) extractedFields.push('tags'); }
          }
        }
      }

      data.content_format = data.content_format || 'webtoon';
      if (!extractedFields.includes('content_format')) extractedFields.push('content_format');

      const finalData = this.fillMissingFields(data);
      return { success: extractedFields.length > 0, data: finalData, confidence: this.calculateConfidence(extractedFields), extractedFields };
    } catch (error) {
      this.addLog(`❌ Toons.kr scraping error: ${error.message}`);
      return { success: false, error: error.message, confidence: 0, extractedFields: [] };
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
   * Calculate confidence score based on extracted fields
   */
  calculateConfidence(extractedFields) {
    try {
      const weights = {
        title_name_kr: 0.3,
        title_name_en: 0.25,
        description: 0.15,
        synopsis: 0.15,
        author: 0.1,
        writer: 0.08,
        story_author: 0.08,
        art_author: 0.08,
        illustrator: 0.08,
        genre: 0.1,
        title_image: 0.1,
        tags: 0.05,
        completed: 0.05,
        content_format: 0.03
      };

      let total = 0;
      for (const field of extractedFields) {
        total += weights[field] || 0.02;
      }
      return Math.min(total, 0.98);
    } catch {
      return 0;
    }
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
      story_author_kr: data.story_author_kr || 'N/A',
      art_author_kr: data.art_author_kr || 'N/A',
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

  /**
   * Normalize platform-specific URL shapes into stable forms
   */
  normalizeUrl(inputUrl) {
    try {
      const u = new URL(inputUrl);
      const host = u.hostname.toLowerCase();

      // Kakao Page: /home?seriesId=ID -> /content/ID?tab_type=about
      if (host.includes('page.kakao.com')) {
        const seriesId = u.searchParams.get('seriesId');
        if (u.pathname.includes('/home') && seriesId) {
          return `https://page.kakao.com/content/${seriesId}?tab_type=about`;
        }
      }

      // Naver Series: ensure canonical detail URL shape when productNo present
      if (host.includes('series.naver.com')) {
        const productNo = u.searchParams.get('productNo');
        if (productNo && !u.pathname.includes('/detail.series')) {
          // If it's a comic product, route to comic detail
          const isComic = u.pathname.includes('/comic') || u.search.includes('categoryTypeCode=comic');
          const basePath = isComic ? 'comic' : 'comic';
          return `https://series.naver.com/${basePath}/detail.series?productNo=${productNo}`;
        }
      }

      // Kakao Webtoon: keep as-is; may standardize tabs later
      // Naver Webtoon: keep as-is

      return inputUrl;
    } catch {
      return inputUrl;
    }
  }

  /**
   * Resolve possibly relative image URLs against a base URL
   */
  resolveUrl(url, baseUrl) {
    try {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      if (url.startsWith('//')) return 'https:' + url;
      const base = new URL(baseUrl);
      return new URL(url, base.origin).href;
    } catch {
      return url;
    }
  }

  /**
   * Normalize genre strings (KR/EN) to internal values
   */
  mapGenre(genre) {
    if (!genre) return 'other';
    const g = String(genre).trim();
    const map = {
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
    return map[g] || map[g.toLowerCase?.()] || 'other';
  }
}

export default new TitleScraperService();