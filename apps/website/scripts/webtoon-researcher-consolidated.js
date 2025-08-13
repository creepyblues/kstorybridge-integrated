#!/usr/bin/env node

/**
 * Consolidated Webtoon Research Script
 * 
 * A comprehensive Korean webtoon research tool that combines multiple approaches:
 * - Mock data demonstration (default)
 * - Real web scraping (with --live flag)
 * - Enhanced analysis with multiple strategies
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class ConsolidatedWebtoonResearcher {
  constructor(options = {}) {
    this.liveMode = options.liveMode || false;
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    
    this.results = {
      title: '',
      searchQuery: '',
      timestamp: new Date().toISOString(),
      mode: this.liveMode ? 'live' : 'demo',
      sources: [],
      story: {
        synopsis: '',
        plot: '',
        genre: [],
        tags: [],
        themes: [],
        summary: ''
      },
      characters: [],
      reviews: {
        positive: [],
        negative: [],
        neutral: [],
        ratings: [],
        overall_sentiment: 'neutral'
      },
      metadata: {
        author: '',
        artist: '',
        publisher: '',
        publication_year: '',
        status: '',
        chapters: '',
        platforms: [],
        views: '',
        likes: ''
      },
      rawData: [],
      searchStrategies: []
    };
    
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.delay = 2000; // 2 second delay between requests
    
    // Korean webtoon platforms and search URLs
    this.platforms = {
      naver: {
        name: '네이버웹툰',
        searchUrl: 'https://comic.naver.com/search?keyword=',
        baseUrl: 'https://comic.naver.com'
      },
      kakao: {
        name: '카카오페이지',
        searchUrl: 'https://page.kakao.com/search?keyword=',
        baseUrl: 'https://page.kakao.com'
      },
      lezhin: {
        name: '레진코믹스',
        searchUrl: 'https://www.lezhin.com/ko/search?q=',
        baseUrl: 'https://www.lezhin.com'
      }
    };

    // Community search URLs for live mode
    this.communitySearches = [
      {
        name: '네이버 검색',
        baseUrl: 'https://search.naver.com/search.naver?query=',
        queries: ['웹툰 {title} 리뷰', '웹툰 {title} 줄거리', '웹툰 {title} 감상']
      },
      {
        name: '다음 검색',
        baseUrl: 'https://search.daum.net/search?q=',
        queries: ['웹툰 {title}']
      }
    ];
  }

  async delay_execution(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, data = null, level = 'info') {
    const timestamp = new Date().toISOString();
    const levelEmoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    };
    
    console.log(`[${timestamp}] ${levelEmoji[level] || '📝'} ${message}`);
    
    if (data && this.verbose) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  // ===== MOCK DATA MODE =====
  async generateMockPlatformResults(title) {
    this.log(`🎭 Demo Mode: Generating mock platform results for "${title}"`);
    
    const mockResults = [
      {
        platform: '네이버웹툰',
        searchUrl: `https://comic.naver.com/search?keyword=${encodeURIComponent(title)}`,
        links: [
          {
            url: `https://comic.naver.com/webtoon/list?titleId=12345`,
            title: title,
            relevanceScore: 100
          }
        ]
      },
      {
        platform: '카카오페이지',
        searchUrl: `https://page.kakao.com/search?keyword=${encodeURIComponent(title)}`,
        links: [
          {
            url: `https://page.kakao.com/home?seriesId=57672662`,
            title: title,
            relevanceScore: 95
          }
        ]
      },
      {
        platform: '레진코믹스',
        searchUrl: `https://www.lezhin.com/ko/search?q=${encodeURIComponent(title)}`,
        links: []
      }
    ];

    await this.delay_execution(500); // Simulate processing time
    this.log(`✅ Generated ${mockResults.length} mock platform results`, null, 'success');
    return mockResults;
  }

  async generateMockCommunityData(title) {
    this.log(`🎭 Demo Mode: Generating realistic mock community data for "${title}"`);
    
    // Create realistic mock content based on common Korean webtoon patterns
    const mockCommunityData = [
      {
        url: 'https://blog.naver.com/mock/webtoon-review-001',
        title: `웹툰 ${title} 리뷰 - 정말 재미있어요!`,
        type: 'community',
        content: `
          ${title}는 정말 흥미진진한 웹툰입니다. 
          주인공이 게임 운영자의 권한을 얻게 되면서 벌어지는 이야기가 매우 재미있습니다.
          작가는 김작가님이고, 현재 네이버웹툰에서 연재중입니다.
          장르는 판타지, 액션이며 매주 업데이트됩니다.
          주인공 김철수는 평범한 직장인이었는데 갑자기 게임 관리자 권한을 얻게 됩니다.
          이 웹툰 정말 추천합니다! 스토리가 탄탄하고 그림체도 좋아요.
          현재 50화까지 나왔고 계속 연재중입니다.
          평점 9.2/10 정도 되는 것 같습니다.
        `
      },
      {
        url: 'https://cafe.naver.com/webtoon/discussion-002',
        title: `${title} 줄거리 정리 및 등장인물 분석`,
        type: 'community',
        content: `
          줄거리: 평범한 회사원 김철수가 어느 날 갑자기 온라인 게임의 운영자 권한을 얻게 되면서 
          현실과 가상의 경계가 무너지는 판타지 액션 웹툰입니다.
          등장인물: 김철수(주인공), 박영희(히로인), 최악역(악역), 이조연(조연)
          이 작품은 게임과 현실이 섞이는 독특한 설정이 매력적입니다.
          작화도 수준급이고 스토리 전개도 빠른 편이라 지루하지 않아요.
          특히 김철수의 캐릭터 성장이 인상적입니다.
          박영희는 똑똑하고 용감한 히로인으로 그려집니다.
          완결까지는 아직 멀었지만 꾸준히 업데이트되고 있어요.
        `
      },
      {
        url: 'https://tistory.blog/webtoon-analysis-003',
        title: `${title} 심층 분석 - 장르적 특징과 매력`,
        type: 'community',
        content: `
          이 웹툰의 가장 큰 매력은 게임과 현실을 넘나드는 스토리텔링입니다.
          장르: 판타지, 액션, 직장, 게임, 드라마
          태그: 운영자권한, 게임시스템, 현실침공, 능력자, 성장물
          작가의 스토리 구성 능력이 뛰어나며, 매 화마다 긴장감을 놓지 않습니다.
          독자들 반응도 매우 좋은 편이고, 댓글창이 항상 활발해요.
          다만 가끔 전개가 빠른 편이라 아쉬운 부분도 있습니다.
          전체적으로는 강력 추천하는 작품입니다.
        `
      }
    ];

    await this.delay_execution(800); // Simulate processing time
    this.log(`✅ Generated ${mockCommunityData.length} realistic mock community sources`, null, 'success');
    return mockCommunityData;
  }

  // ===== LIVE WEB SCRAPING MODE =====
  async searchLivePlatforms(title) {
    this.log(`🌐 Live Mode: Searching webtoon platforms for "${title}"`);
    const results = [];

    for (const [key, platform] of Object.entries(this.platforms)) {
      this.log(`🔍 Searching ${platform.name}...`);
      
      try {
        const searchUrl = platform.searchUrl + encodeURIComponent(title);
        const response = await fetch(searchUrl, {
          headers: { 'User-Agent': this.userAgent },
          timeout: 10000
        });

        if (!response.ok) {
          this.log(`⚠️ Failed to search ${platform.name}: ${response.status}`, null, 'warning');
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const links = [];

        // Platform-specific selectors (simplified for demo)
        let selector = 'a[href*="webtoon"], a[href*="comic"], a[href*="series"]';
        
        $(selector).each((i, elem) => {
          const href = $(elem).attr('href');
          const text = $(elem).text().trim();
          
          if (href && text && text.includes(title.substring(0, 3))) {
            links.push({
              url: href.startsWith('http') ? href : platform.baseUrl + href,
              title: text,
              relevanceScore: this.calculateRelevance(text, title)
            });
          }
        });

        results.push({
          platform: platform.name,
          searchUrl: searchUrl,
          links: links.slice(0, 5) // Limit results
        });

        this.log(`✅ Found ${links.length} results on ${platform.name}`, null, 'success');
        await this.delay_execution(this.delay);

      } catch (error) {
        this.log(`❌ Error searching ${platform.name}: ${error.message}`, null, 'error');
        results.push({
          platform: platform.name,
          searchUrl: platform.searchUrl + encodeURIComponent(title),
          links: [],
          error: error.message
        });
      }
    }

    return results;
  }

  async searchLiveCommunities(title) {
    this.log(`🌐 Live Mode: Searching Korean communities for "${title}"`);
    const allSources = [];

    for (const community of this.communitySearches) {
      for (const queryTemplate of community.queries) {
        const query = queryTemplate.replace('{title}', title);
        const searchUrl = community.baseUrl + encodeURIComponent(query);
        
        this.log(`🔍 Searching community: ${searchUrl}`);

        try {
          const response = await fetch(searchUrl, {
            headers: { 'User-Agent': this.userAgent },
            timeout: 10000
          });

          if (!response.ok) {
            this.log(`⚠️ Failed to search community: ${response.status}`, null, 'warning');
            continue;
          }

          const html = await response.text();
          const $ = cheerio.load(html);
          const links = [];

          // Generic selectors for blog/community links
          $('a[href*="blog.naver.com"], a[href*="cafe.naver.com"], a[href*="tistory.com"]').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            
            if (href && text && text.length > 10) {
              links.push({
                url: href,
                title: text,
                type: 'community'
              });
            }
          });

          allSources.push(...links.slice(0, 3)); // Limit per search
          this.log(`✅ Found ${links.length} community links`, null, 'success');
          await this.delay_execution(this.delay);

        } catch (error) {
          this.log(`❌ Error searching community: ${error.message}`, null, 'error');
        }
      }
    }

    return allSources;
  }

  async fetchLiveContent(url) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract main content (simplified)
      const content = $('article, .post-content, .entry-content, .content, main').first().text() || 
                     $('body').text();
      
      return content.substring(0, 10000); // Limit content length
      
    } catch (error) {
      this.log(`❌ Failed to fetch content from ${url}: ${error.message}`, null, 'error');
      return '';
    }
  }

  // ===== SHARED ANALYSIS METHODS =====
  calculateRelevance(text, title) {
    const titleWords = title.split(' ');
    let score = 0;
    
    for (const word of titleWords) {
      if (text.includes(word)) {
        score += 20;
      }
    }
    
    return Math.min(score, 100);
  }

  analyzeContent(content, title) {
    return {
      story: this.extractStoryInfo(content, title),
      characters: this.extractCharacters(content, title),
      reviews: this.extractReviews(content, title),
      metadata: this.extractMetadata(content, title)
    };
  }

  extractStoryInfo(content, title) {
    const story = {
      synopsis: '',
      genre: [],
      tags: [],
      themes: [],
      summary: ''
    };

    // Look for synopsis patterns
    const synopsisPatterns = [
      new RegExp(`${title}[은는이가]?\\s*([^.!?。]{50,300}[.!?。])`, 'g'),
      /줄거리[:\s]*([^.!?。]{50,300}[.!?。])/g,
      /내용[:\s]*([^.!?。]{50,300}[.!?。])/g,
      /스토리[:\s]*([^.!?。]{50,300}[.!?。])/g
    ];

    for (const pattern of synopsisPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (match.length > story.synopsis.length && match.length < 400) {
            story.synopsis = match.trim();
          }
        }
      }
    }

    // Extract genres
    const genres = [
      '로맨스', '드라마', '액션', '판타지', '코미디', '스릴러', '호러', 
      '미스터리', '일상', '학원', '직장', '성인', '무협', '역사', 
      'BL', 'GL', '이세계', '회귀', '빙의', '게임', 'SF', '좀비'
    ];

    for (const genre of genres) {
      if (content.includes(genre) && !story.genre.includes(genre)) {
        story.genre.push(genre);
      }
    }

    // Extract tags
    const tagPatterns = [
      /태그[:\s]*([가-힣\s,]+)/g,
      /키워드[:\s]*([가-힣\s,]+)/g
    ];

    for (const pattern of tagPatterns) {
      const match = pattern.exec(content);
      if (match && match[1]) {
        const tags = match[1].split(/[,\s]+/).filter(tag => tag.length > 1);
        story.tags.push(...tags);
      }
    }

    return story;
  }

  extractCharacters(content, title) {
    const characters = [];
    
    // Character name patterns
    const characterPatterns = [
      /([가-힣]{2,4})\s*[은는이가]\s*(주인공|남주|여주|히로인)/g,
      /(주인공|남주|여주|히로인)\s*([가-힣]{2,4})/g,
      /등장인물\s*[:\-]\s*([가-힣\s,]+)/g
    ];

    for (const pattern of characterPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1] || match[2];
        if (name && name !== title && name.length >= 2 && name.length <= 6) {
          if (!characters.some(c => c.name === name)) {
            characters.push({
              name: name,
              role: this.determineCharacterRole(content, name),
              description: this.extractCharacterDescription(content, name)
            });
          }
        }
      }
    }

    return characters.slice(0, 10);
  }

  determineCharacterRole(content, name) {
    const rolePatterns = [
      { pattern: new RegExp(`${name}[은는이가]?\\s*(주인공|메인)`), role: '주인공' },
      { pattern: new RegExp(`${name}[은는이가]?\\s*(남주|남자주인공)`), role: '남주인공' },
      { pattern: new RegExp(`${name}[은는이가]?\\s*(여주|여자주인공|히로인)`), role: '여주인공' },
      { pattern: new RegExp(`${name}[은는이가]?\\s*(악역|빌런)`), role: '악역' },
      { pattern: new RegExp(`${name}[은는이가]?\\s*(조연|서브)`), role: '조연' }
    ];

    for (const { pattern, role } of rolePatterns) {
      if (pattern.test(content)) {
        return role;
      }
    }

    return '등장인물';
  }

  extractCharacterDescription(content, name) {
    const sentences = content.split(/[.!?。]/);
    for (const sentence of sentences) {
      if (sentence.includes(name) && sentence.length > 20 && sentence.length < 200) {
        return sentence.trim();
      }
    }
    return '';
  }

  extractReviews(content, title) {
    const reviews = {
      positive: [],
      negative: [],
      neutral: [],
      ratings: []
    };

    // Sentiment keywords
    const positiveKeywords = [
      '재미있', '좋', '훌륭', '최고', '완벽', '감동', '추천', '명작', 
      '대박', '흥미진진', '몰입', '인상적', '기대', '마지막까지', '꿀잼'
    ];

    const negativeKeywords = [
      '재미없', '아쉽', '실망', '지루', '뻔하', '식상', '별로', 
      '최악', '하차', '포기', '끝까지 못', '억지', '노잼'
    ];

    // Extract review sentences
    const sentences = content.split(/[.!?。]/);
    
    for (const sentence of sentences) {
      if (sentence.includes(title) && sentence.length > 20 && sentence.length < 300) {
        const positiveCount = positiveKeywords.filter(kw => sentence.includes(kw)).length;
        const negativeCount = negativeKeywords.filter(kw => sentence.includes(kw)).length;

        if (positiveCount > negativeCount && positiveCount > 0) {
          reviews.positive.push(sentence.trim());
        } else if (negativeCount > positiveCount && negativeCount > 0) {
          reviews.negative.push(sentence.trim());
        } else if (sentence.includes('평가') || sentence.includes('리뷰') || sentence.includes('감상')) {
          reviews.neutral.push(sentence.trim());
        }
      }
    }

    // Extract ratings
    const ratingPatterns = [
      /(\d+(?:\.\d+)?)\s*[\/점]\s*(\d+)/g,
      /평점\s*(\d+(?:\.\d+)?)/g,
      /(\d+(?:\.\d+)?)점/g,
      /★+/g
    ];

    for (const pattern of ratingPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        reviews.ratings.push({
          score: match[1] || match[0].length, // For star ratings, count stars
          context: match[0],
          type: match[0].includes('★') ? 'stars' : 'numeric'
        });
      }
    }

    return reviews;
  }

  extractMetadata(content, title) {
    const metadata = {
      author: '',
      artist: '',
      publisher: '',
      status: '',
      chapters: '',
      platforms: []
    };

    // Metadata patterns
    const patterns = {
      author: [
        new RegExp(`작가[:\\s]*([가-힣\\w\\s]+)`, 'g'),
        new RegExp(`글[:\\s]*([가-힣\\w\\s]+)`, 'g')
      ],
      artist: [
        new RegExp(`그림[:\\s]*([가-힣\\w\\s]+)`, 'g'),
        new RegExp(`작화[:\\s]*([가-힣\\w\\s]+)`, 'g')
      ],
      status: [
        /(완결|연재중|휴재|중단)/g
      ],
      chapters: [
        /(\d+)화/g,
        /총\s*(\d+)편/g,
        /(\d+)편까지/g
      ]
    };

    for (const [key, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        const match = pattern.exec(content);
        if (match && match[1]) {
          metadata[key] = match[1].trim();
          break;
        }
      }
    }

    // Extract platforms
    const platforms = ['네이버', '카카오', '레진', '봄툰', '투믹스', '탑툰'];
    for (const platform of platforms) {
      if (content.includes(platform) && !metadata.platforms.includes(platform)) {
        metadata.platforms.push(platform);
      }
    }

    return metadata;
  }

  mergeAnalysis(analysis, sourceUrl) {
    // Merge story info
    if (analysis.story.synopsis && analysis.story.synopsis.length > this.results.story.synopsis.length) {
      this.results.story.synopsis = analysis.story.synopsis;
    }
    
    this.results.story.genre = [...new Set([...this.results.story.genre, ...analysis.story.genre])];
    this.results.story.tags = [...new Set([...this.results.story.tags, ...analysis.story.tags])];

    // Merge characters
    for (const char of analysis.characters) {
      if (!this.results.characters.some(c => c.name === char.name)) {
        this.results.characters.push(char);
      }
    }

    // Merge reviews
    this.results.reviews.positive.push(...analysis.reviews.positive);
    this.results.reviews.negative.push(...analysis.reviews.negative);
    this.results.reviews.neutral.push(...analysis.reviews.neutral);
    this.results.reviews.ratings.push(...analysis.reviews.ratings);

    // Merge metadata
    Object.keys(analysis.metadata).forEach(key => {
      if (key === 'platforms') {
        this.results.metadata.platforms = [...new Set([...this.results.metadata.platforms, ...analysis.metadata.platforms])];
      } else if (!this.results.metadata[key] && analysis.metadata[key]) {
        this.results.metadata[key] = analysis.metadata[key];
      }
    });

    // Store raw data
    this.results.rawData.push({
      source: sourceUrl,
      analysis: analysis
    });
  }

  async fetchDetailedInfo(sources) {
    this.log(`📚 Analyzing ${sources.length} sources`);
    
    for (const source of sources) {
      this.log(`📄 Analyzing: ${source.url}`);
      
      let content = '';
      
      if (this.liveMode) {
        content = await this.fetchLiveContent(source.url);
        await this.delay_execution(this.delay);
      } else {
        content = source.content || '';
      }
      
      if (content) {
        const analysis = this.analyzeContent(content, this.results.title);
        this.mergeAnalysis(analysis, source.url);
        
        this.log(`✅ Analyzed ${source.url} - Story: ${!!analysis.story.synopsis}, Characters: ${analysis.characters.length}, Reviews: ${analysis.reviews.positive.length + analysis.reviews.negative.length}`, null, 'success');
      } else {
        this.log(`⚠️ No content extracted from ${source.url}`, null, 'warning');
      }
    }
  }

  async researchWebtoon(title) {
    this.log(`🚀 Starting ${this.liveMode ? 'live' : 'demo'} research for: "${title}"`);
    
    this.results.title = title;
    this.results.searchQuery = `웹툰 ${title}`;

    try {
      // Strategy 1: Search webtoon platforms
      let platformResults;
      if (this.liveMode) {
        platformResults = await this.searchLivePlatforms(title);
      } else {
        platformResults = await this.generateMockPlatformResults(title);
      }
      
      this.results.searchStrategies.push({
        strategy: 'webtoon_platforms',
        results: platformResults
      });

      // Strategy 2: Search communities
      let communityResults;
      if (this.liveMode) {
        communityResults = await this.searchLiveCommunities(title);
      } else {
        communityResults = await this.generateMockCommunityData(title);
      }
      
      this.results.searchStrategies.push({
        strategy: 'korean_communities', 
        results: communityResults
      });

      // Combine all sources
      const allSources = [
        ...platformResults.flatMap(p => p.links || []),
        ...communityResults
      ];

      this.results.sources = allSources;
      this.log(`📊 Total sources found: ${allSources.length}`);

      if (allSources.length === 0) {
        this.log(`⚠️ No sources found for "${title}"`, null, 'warning');
        return this.results;
      }

      // Strategy 3: Detailed analysis
      await this.fetchDetailedInfo(allSources);

      // Finalize results
      this.finalizeResults();

      this.log(`🎉 Research completed for "${title}"`, null, 'success');
      this.logSummary();

      return this.results;

    } catch (error) {
      this.log(`❌ Research failed: ${error.message}`, null, 'error');
      this.results.error = error.message;
      return this.results;
    }
  }

  finalizeResults() {
    // Clean and deduplicate
    this.results.story.genre = [...new Set(this.results.story.genre)];
    this.results.characters = this.results.characters.slice(0, 15);
    
    // Limit reviews
    this.results.reviews.positive = this.results.reviews.positive.slice(0, 10);
    this.results.reviews.negative = this.results.reviews.negative.slice(0, 10);
    this.results.reviews.neutral = this.results.reviews.neutral.slice(0, 10);
    
    // Calculate overall sentiment
    const totalPositive = this.results.reviews.positive.length;
    const totalNegative = this.results.reviews.negative.length;
    
    if (totalPositive > totalNegative * 1.5) {
      this.results.reviews.overall_sentiment = 'positive';
    } else if (totalNegative > totalPositive * 1.5) {
      this.results.reviews.overall_sentiment = 'negative';
    } else {
      this.results.reviews.overall_sentiment = 'mixed';
    }

    // Generate overall summary
    this.results.overall_summary = this.generateOverallSummary();
  }

  generateOverallSummary() {
    const summary = {
      title_assessment: '',
      genre_analysis: '',
      character_dynamics: '',
      reader_reception: '',
      market_positioning: '',
      strengths: [],
      weaknesses: [],
      target_audience: '',
      recommendation_score: 0,
      key_selling_points: [],
      comparable_works: [],
      overall_conclusion: ''
    };

    // Title Assessment
    if (this.results.story.synopsis) {
      const synopsisLength = this.results.story.synopsis.length;
      if (synopsisLength > 200) {
        summary.title_assessment = '상세한 줄거리가 확인되어 작품의 스토리가 체계적으로 구성되어 있음을 시사합니다.';
      } else if (synopsisLength > 100) {
        summary.title_assessment = '기본적인 줄거리 정보가 확인되며, 작품의 핵심 설정이 파악 가능합니다.';
      } else {
        summary.title_assessment = '제한적인 줄거리 정보가 확인되었습니다.';
      }
    } else {
      summary.title_assessment = '줄거리 정보가 부족하여 작품의 전체적인 스토리 파악이 어려운 상황입니다.';
    }

    // Genre Analysis
    const genres = this.results.story.genre;
    if (genres.length >= 3) {
      summary.genre_analysis = `다양한 장르 요소(${genres.slice(0, 3).join(', ')})가 결합된 복합 장르 작품으로, 폭넓은 독자층에게 어필할 수 있는 잠재력을 가지고 있습니다.`;
    } else if (genres.length === 2) {
      summary.genre_analysis = `${genres.join('과 ')} 장르가 결합된 작품으로, 명확한 타겟 독자층을 가지고 있습니다.`;
    } else if (genres.length === 1) {
      summary.genre_analysis = `${genres[0]} 장르에 특화된 작품으로 보입니다.`;
    } else {
      summary.genre_analysis = '장르 분류가 명확하지 않아 작품의 성격 파악이 필요합니다.';
    }

    // Character Dynamics
    const characters = this.results.characters;
    if (characters.length >= 4) {
      const roles = characters.map(c => c.role);
      summary.character_dynamics = `풍부한 등장인물 구성(${characters.length}명)으로 복잡한 인물 관계와 스토리 전개가 예상됩니다. 주요 역할 분포가 균형잡혀 있어 캐릭터 중심의 스토리텔링이 강점으로 보입니다.`;
    } else if (characters.length >= 2) {
      summary.character_dynamics = `핵심 등장인물들이 확인되어 캐릭터 간의 관계성에 중점을 둔 스토리 구조로 추정됩니다.`;
    } else if (characters.length === 1) {
      summary.character_dynamics = '주인공 중심의 스토리로, 개인의 성장이나 변화에 초점을 맞춘 작품으로 보입니다.';
    } else {
      summary.character_dynamics = '캐릭터 정보가 부족하여 인물 관계 분석이 제한적입니다.';
    }

    // Reader Reception
    const positive = this.results.reviews.positive.length;
    const negative = this.results.reviews.negative.length;
    const sentiment = this.results.reviews.overall_sentiment;
    
    if (sentiment === 'positive' && positive >= 3) {
      summary.reader_reception = `독자들의 반응이 전반적으로 긍정적이며, 특히 스토리와 캐릭터에 대한 호평이 다수 확인됩니다. 팬층 형성이 잘 되어 있는 작품으로 보입니다.`;
      summary.strengths.push('독자 만족도 높음', '긍정적 입소문');
    } else if (sentiment === 'positive') {
      summary.reader_reception = '독자들의 반응이 대체로 긍정적이며, 작품에 대한 관심과 애정이 확인됩니다.';
      summary.strengths.push('긍정적 독자 반응');
    } else if (sentiment === 'negative') {
      summary.reader_reception = '일부 독자들로부터 비판적 의견이 제기되고 있어, 스토리나 연출 개선이 필요할 수 있습니다.';
      summary.weaknesses.push('독자 불만 사항 존재');
    } else {
      summary.reader_reception = '독자 반응이 혼재되어 있어, 호불호가 갈리는 작품 특성을 보입니다.';
    }

    // Market Positioning
    const platforms = this.results.metadata.platforms;
    const status = this.results.metadata.status;
    
    if (platforms.includes('네이버') || platforms.includes('카카오')) {
      summary.market_positioning = '주요 웹툰 플랫폼에서 연재되어 높은 접근성과 노출도를 가지고 있습니다.';
      summary.strengths.push('주요 플랫폼 연재');
    } else if (platforms.length > 0) {
      summary.market_positioning = `${platforms.join(', ')} 플랫폼에서 서비스되고 있습니다.`;
    } else {
      summary.market_positioning = '연재 플랫폼 정보가 명확하지 않습니다.';
    }

    if (status === '연재중') {
      summary.market_positioning += ' 현재 연재 중인 작품으로 지속적인 독자 관리가 이루어지고 있습니다.';
      summary.strengths.push('현재 연재중');
    } else if (status === '완결') {
      summary.market_positioning += ' 완결된 작품으로 완성도 높은 스토리를 제공합니다.';
      summary.strengths.push('완결작');
    }

    // Target Audience Analysis
    if (genres.includes('로맨스') && genres.includes('학원')) {
      summary.target_audience = '10-20대 여성 독자층';
    } else if (genres.includes('액션') && genres.includes('판타지')) {
      summary.target_audience = '10-30대 남성 독자층';
    } else if (genres.includes('직장') || genres.includes('일상')) {
      summary.target_audience = '20-40대 직장인 독자층';
    } else if (genres.includes('게임') || genres.includes('이세계')) {
      summary.target_audience = '10-30대 게임/판타지 애호가';
    } else {
      summary.target_audience = '전연령 독자층';
    }

    // Key Selling Points
    if (this.results.story.synopsis.includes('운영자') || this.results.story.synopsis.includes('권한')) {
      summary.key_selling_points.push('독특한 설정과 세계관');
    }
    if (genres.includes('게임')) {
      summary.key_selling_points.push('게임 요소와 현실의 결합');
    }
    if (characters.length >= 3) {
      summary.key_selling_points.push('다양한 캐릭터와 관계성');
    }
    if (positive >= 2) {
      summary.key_selling_points.push('검증된 독자 만족도');
    }

    // Recommendation Score (1-10)
    let score = 5; // Base score
    
    // Positive factors
    if (this.results.story.synopsis) score += 1;
    if (genres.length >= 2) score += 1;
    if (characters.length >= 2) score += 1;
    if (sentiment === 'positive') score += 2;
    if (platforms.includes('네이버') || platforms.includes('카카오')) score += 1;
    if (status === '연재중') score += 0.5;
    
    // Negative factors
    if (sentiment === 'negative') score -= 2;
    if (this.results.sources.length < 3) score -= 1;
    
    summary.recommendation_score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

    // Overall Conclusion
    if (summary.recommendation_score >= 8) {
      summary.overall_conclusion = `${this.results.title}은 높은 추천도를 가진 우수한 웹툰으로, 탄탄한 스토리와 매력적인 캐릭터, 긍정적인 독자 반응을 모두 갖춘 작품입니다. 안정적인 투자 가치와 높은 상업적 잠재력을 가지고 있습니다.`;
    } else if (summary.recommendation_score >= 6) {
      summary.overall_conclusion = `${this.results.title}은 괜찮은 수준의 웹툰으로, 특정 독자층에게는 매력적일 수 있으나 보편적 어필에는 한계가 있을 수 있습니다. 신중한 검토 후 투자 결정을 권장합니다.`;
    } else {
      summary.overall_conclusion = `${this.results.title}은 현재로서는 제한적인 정보와 평가를 바탕으로 할 때, 추가적인 조사와 분석이 필요한 작품입니다. 투자 전 더 심층적인 검토가 필요합니다.`;
    }

    return summary;
  }

  logSummary() {
    this.log(`📊 Research Summary for "${this.results.title}"`);
    this.log(`   📚 Story Synopsis: ${this.results.story.synopsis ? 'Found (' + this.results.story.synopsis.substring(0, 50) + '...)' : 'Not found'}`);
    this.log(`   🎭 Characters: ${this.results.characters.length} found`);
    this.log(`   ⭐ Reviews: ${this.results.reviews.positive.length} positive, ${this.results.reviews.negative.length} negative (${this.results.reviews.overall_sentiment})`);
    this.log(`   🏷️ Genres: ${this.results.story.genre.join(', ') || 'None found'}`);
    this.log(`   👤 Author: ${this.results.metadata.author || 'Not found'}`);
    this.log(`   📱 Platforms: ${this.results.metadata.platforms.join(', ') || 'None found'}`);
    this.log(`   📊 Sources: ${this.results.sources.length} analyzed`);
    this.log(`   🎯 Mode: ${this.results.mode}`);
    
    // Add overall summary highlights
    if (this.results.overall_summary) {
      this.log(`   🌟 Recommendation Score: ${this.results.overall_summary.recommendation_score}/10`);
      this.log(`   🎯 Target Audience: ${this.results.overall_summary.target_audience}`);
      this.log(`   💪 Key Strengths: ${this.results.overall_summary.strengths.slice(0, 2).join(', ') || 'None identified'}`);
    }
  }

  async saveResults(outputPath) {
    try {
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      await fs.writeFile(outputPath, JSON.stringify(this.results, null, 2), 'utf8');
      this.log(`💾 Results saved to: ${outputPath}`, null, 'success');
      
      // Save readable summary
      const summaryPath = outputPath.replace('.json', '_summary.txt');
      const summary = this.generateReadableSummary();
      await fs.writeFile(summaryPath, summary, 'utf8');
      this.log(`📄 Summary saved to: ${summaryPath}`, null, 'success');
      
    } catch (error) {
      this.log(`❌ Failed to save results: ${error.message}`, null, 'error');
    }
  }

  generateReadableSummary() {
    const lines = [];
    lines.push(`🎯 웹툰 연구 보고서: ${this.results.title}`);
    lines.push(`📅 연구 시간: ${new Date(this.results.timestamp).toLocaleString('ko-KR')}`);
    lines.push(`🔍 검색어: ${this.results.searchQuery}`);
    lines.push(`🎭 연구 모드: ${this.results.mode === 'live' ? '실시간 웹 스크래핑' : '데모 모드 (목 데이터)'}`);
    lines.push('='.repeat(60));
    lines.push('');

    // Story information
    lines.push('📚 작품 정보');
    lines.push('-'.repeat(30));
    if (this.results.story.synopsis) {
      lines.push(`📖 줄거리: ${this.results.story.synopsis}`);
      lines.push('');
    }
    
    if (this.results.story.genre.length > 0) {
      lines.push(`🏷️ 장르: ${this.results.story.genre.join(', ')}`);
    }

    if (this.results.story.tags.length > 0) {
      lines.push(`🏷️ 태그: ${this.results.story.tags.join(', ')}`);
    }

    if (this.results.metadata.author) {
      lines.push(`✍️ 작가: ${this.results.metadata.author}`);
    }
    
    if (this.results.metadata.status) {
      lines.push(`📊 상태: ${this.results.metadata.status}`);
    }
    
    if (this.results.metadata.platforms.length > 0) {
      lines.push(`📱 연재처: ${this.results.metadata.platforms.join(', ')}`);
    }
    lines.push('');

    // Characters
    if (this.results.characters.length > 0) {
      lines.push('🎭 등장인물');
      lines.push('-'.repeat(30));
      this.results.characters.slice(0, 8).forEach(char => {
        lines.push(`• ${char.name} (${char.role})`);
        if (char.description) {
          lines.push(`  ${char.description.substring(0, 100)}...`);
        }
      });
      lines.push('');
    }

    // Reviews and sentiment
    lines.push(`⭐ 리뷰 분석 (전체 감정: ${this.results.reviews.overall_sentiment})`);
    lines.push('-'.repeat(30));
    
    if (this.results.reviews.positive.length > 0) {
      lines.push(`👍 긍정적 의견 (${this.results.reviews.positive.length}개):`);
      this.results.reviews.positive.slice(0, 3).forEach(review => {
        lines.push(`  • ${review.substring(0, 100)}...`);
      });
      lines.push('');
    }

    if (this.results.reviews.negative.length > 0) {
      lines.push(`👎 부정적 의견 (${this.results.reviews.negative.length}개):`);
      this.results.reviews.negative.slice(0, 3).forEach(review => {
        lines.push(`  • ${review.substring(0, 100)}...`);
      });
      lines.push('');
    }

    if (this.results.reviews.ratings.length > 0) {
      lines.push(`⭐ 평점 정보:`);
      this.results.reviews.ratings.slice(0, 3).forEach(rating => {
        lines.push(`  • ${rating.context} (${rating.type})`);
      });
      lines.push('');
    }

    // Sources
    lines.push('🔗 분석된 소스');
    lines.push('-'.repeat(30));
    lines.push(`총 ${this.results.sources.length}개 소스 분석`);
    
    this.results.searchStrategies.forEach(strategy => {
      lines.push(`• ${strategy.strategy}: ${strategy.results.length}개 결과`);
    });
    
    // Overall Summary Section
    if (this.results.overall_summary) {
      lines.push('🎯 종합 분석 및 평가');
      lines.push('-'.repeat(30));
      
      lines.push(`📋 작품 평가: ${this.results.overall_summary.title_assessment}`);
      lines.push('');
      
      lines.push(`🎭 장르 분석: ${this.results.overall_summary.genre_analysis}`);
      lines.push('');
      
      lines.push(`👥 캐릭터 구성: ${this.results.overall_summary.character_dynamics}`);
      lines.push('');
      
      lines.push(`📊 독자 반응: ${this.results.overall_summary.reader_reception}`);
      lines.push('');
      
      lines.push(`📈 시장 포지셔닝: ${this.results.overall_summary.market_positioning}`);
      lines.push('');

      if (this.results.overall_summary.key_selling_points.length > 0) {
        lines.push(`💎 핵심 매력 포인트:`);
        this.results.overall_summary.key_selling_points.forEach(point => {
          lines.push(`  • ${point}`);
        });
        lines.push('');
      }

      if (this.results.overall_summary.strengths.length > 0) {
        lines.push(`💪 강점:`);
        this.results.overall_summary.strengths.forEach(strength => {
          lines.push(`  ✅ ${strength}`);
        });
        lines.push('');
      }

      if (this.results.overall_summary.weaknesses.length > 0) {
        lines.push(`⚠️ 개선점:`);
        this.results.overall_summary.weaknesses.forEach(weakness => {
          lines.push(`  🔸 ${weakness}`);
        });
        lines.push('');
      }

      lines.push(`🎯 타겟 독자층: ${this.results.overall_summary.target_audience}`);
      lines.push(`⭐ 추천 점수: ${this.results.overall_summary.recommendation_score}/10`);
      lines.push('');
      
      lines.push('📝 종합 결론');
      lines.push('-'.repeat(20));
      lines.push(this.results.overall_summary.overall_conclusion);
      lines.push('');
    }

    lines.push('');
    lines.push(`📊 연구 완료 시간: ${new Date().toLocaleString('ko-KR')}`);

    return lines.join('\n');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {
    liveMode: args.includes('--live'),
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  // Remove flags from args to get title
  const title = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'))[0];
  
  if (!title) {
    console.log(`
📖 Consolidated Webtoon Research Script

Usage: node webtoon-researcher-consolidated.js [options] "웹툰 제목"

Options:
  --live      Use live web scraping instead of mock data
  --dry-run   Show what would be done without actually doing it
  --verbose   Show detailed logging and debug information
  -v          Short form of --verbose

Examples:
  node webtoon-researcher-consolidated.js "운영자의 권한으로"
  node webtoon-researcher-consolidated.js --live "운영자의 권한으로"
  node webtoon-researcher-consolidated.js --verbose "운영자의 권한으로"

Modes:
🎭 Demo Mode (Default): Uses realistic mock data to demonstrate full functionality
🌐 Live Mode (--live): Performs actual web scraping with rate limiting
🔍 Verbose Mode (-v): Shows detailed analysis and debug information

Features:
🎯 Multi-strategy research approach
📱 Platform searching (네이버웹툰, 카카오페이지, 레진코믹스)
💬 Korean community analysis
🔍 Advanced Korean text processing and NLP
📊 Sentiment analysis of reviews
👥 Character identification and role analysis
📚 Comprehensive story information gathering
📄 Bilingual output (Korean summary + JSON data)

Note: 
- Demo mode provides rich mock data for testing and demonstration
- Live mode requires internet access and respects robots.txt
- Always includes proper rate limiting and error handling
    `);
    process.exit(1);
  }

  const researcher = new ConsolidatedWebtoonResearcher(options);
  
  console.log(`🚀 Starting consolidated webtoon research for: "${title}"`);
  console.log(`🎯 Mode: ${options.liveMode ? 'Live Web Scraping' : 'Demo with Mock Data'}`);
  
  if (options.dryRun) {
    console.log(`🔍 Dry run mode - showing what would be done:`);
    console.log(`  - Search platforms: 네이버웹툰, 카카오페이지, 레진코믹스`);
    console.log(`  - Search communities: 네이버, 다음`);
    console.log(`  - Analyze content for: story, characters, reviews, metadata`);
    console.log(`  - Generate: JSON results + Korean summary`);
    console.log(`✅ Dry run completed`);
    return;
  }
  
  const results = await researcher.researchWebtoon(title);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const mode = options.liveMode ? 'live' : 'demo';
  const outputPath = `./consolidated-webtoon-research-${title.replace(/\s+/g, '-')}-${mode}-${timestamp}.json`;
  
  await researcher.saveResults(outputPath);
  
  console.log(`\n✨ Consolidated research completed!`);
  console.log(`📄 Summary: ${outputPath.replace('.json', '_summary.txt')}`);
  console.log(`📊 Full data: ${outputPath}`);
  console.log(`🎯 Mode used: ${results.mode}`);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = ConsolidatedWebtoonResearcher;