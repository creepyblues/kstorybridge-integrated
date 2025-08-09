/**
 * Universal Title Scraper Service
 * Extracts title information from various Korean content platforms
 */

export interface ScrapedTitleData {
  title_name_kr: string;
  title_name_en?: string;
  description?: string;
  synopsis?: string;
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
  confidence: number; // 0-1 confidence in the extracted data
  extractedFields: string[]; // List of fields successfully extracted
}

class TitleScraperService {
  private readonly CORS_PROXY = '/api/scraper-proxy'; // We'll need to implement this
  
  /**
   * Main scraping function - detects platform and extracts data
   */
  async scrapeTitle(url: string): Promise<ScrapingResult> {
    try {
      console.log('🔍 Starting scrape for URL:', url);
      
      // Validate URL
      if (!this.isValidUrl(url)) {
        return {
          success: false,
          error: 'Invalid URL provided',
          confidence: 0,
          extractedFields: []
        };
      }

      // Detect platform and use appropriate scraper
      const platform = this.detectPlatform(url);
      console.log('🎯 Detected platform:', platform);

      let result: ScrapingResult;

      switch (platform) {
        case 'toons.kr':
          result = await this.scrapeToonsKr(url);
          break;
        case 'webtoons.com':
          result = await this.scrapeWebtoons(url);
          break;
        case 'kakaopage':
          result = await this.scrapeKakaoPage(url);
          break;
        case 'naver':
          result = await this.scrapeNaverWebtoon(url);
          break;
        case 'ridibooks':
          result = await this.scrapeRidiBooks(url);
          break;
        default:
          result = await this.scrapeGeneric(url);
      }

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
    if (hostname.includes('kakaopage')) return 'kakaopage';
    if (hostname.includes('comic.naver') || hostname.includes('webtoon.naver')) return 'naver';
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
        data: data as ScrapedTitleData,
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
        data.description = description.trim();
        extractedFields.push('description');
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
        data: data as ScrapedTitleData,
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
        /<title>([^<]+)</title>/i,
        /<h1[^>]*>([^<]+)</h1>/i
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
          data.description = match[1].trim();
          extractedFields.push('description');
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
        data: data as ScrapedTitleData,
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
    // TODO: Implement KakaoPage specific scraping
    return this.scrapeGeneric(url);
  }

  private async scrapeNaverWebtoon(url: string): Promise<ScrapingResult> {
    // TODO: Implement Naver Webtoon specific scraping
    return this.scrapeGeneric(url);
  }

  private async scrapeRidiBooks(url: string): Promise<ScrapingResult> {
    // TODO: Implement RidiBooks specific scraping
    return this.scrapeGeneric(url);
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
    // For now, we'll simulate fetching HTML
    // In production, this would use a CORS proxy or server-side endpoint
    throw new Error('HTML fetching not implemented - requires CORS proxy or server endpoint');
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

  private calculateConfidence(extractedFields: string[]): number {
    const weights = {
      'title_name_kr': 0.3,
      'title_name_en': 0.25,
      'description': 0.15,
      'synopsis': 0.15,
      'author': 0.1,
      'genre': 0.1,
      'title_image': 0.1
    };

    let totalWeight = 0;
    for (const field of extractedFields) {
      totalWeight += weights[field as keyof typeof weights] || 0.05;
    }

    return Math.min(totalWeight, 1.0);
  }
}

export const scraperService = new TitleScraperService();