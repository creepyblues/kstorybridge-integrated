# KStoryBridge Scraper Development Context

This file provides essential context for Claude Code when working on the KStoryBridge scraper system.

## Project Overview

KStoryBridge is a platform connecting Korean content creators with global media buyers. The scraper system extracts metadata from Korean content platforms to populate the content database.

## Architecture

### Backend API
- **Location**: `/backend/src/services/scraperService.js`
- **Port**: 3001
- **API Endpoint**: `POST /api/scraper/scrape`
- **Framework**: Express.js with Cheerio for HTML parsing
- **Enhanced with**: Puppeteer for dynamic content (JavaScript-loaded data)

### Frontend Testing Interface
- **Location**: `/apps/admin/src/pages/AdminScraperTest.tsx`
- **Port**: 8082 (admin interface)
- **Client**: `/apps/admin/src/services/scraperApiClient.ts`

## Supported Platforms & URLs

### 1. Naver Series (series.naver.com)
- **Status**: ✅ Working perfectly
- **Example**: `https://series.naver.com/comic/detail.series?productNo=3293134`
- **Features**: Views, likes, authors, age rating, publisher, genre, completion status

### 2. Naver Comics (comic.naver.com)
- **Status**: ✅ Working
- **Example**: `https://comic.naver.com/webtoon/list?titleId=841324`
- **Features**: Authors, keywords/tags, age rating

### 3. KakaoPage (page.kakao.com)
- **Status**: ✅ Working
- **Example**: `https://page.kakao.com/content/61614855`
- **Features**: Views, likes, story/art authors, writer, publisher

### 4. Kakao Webtoon (webtoon.kakao.com)
- **Status**: ⚠️ Partially working (Puppeteer working, variable scope issue in final steps)
- **Example**: `https://webtoon.kakao.com/content/후회물-악녀는-이혼해서-행복합니다/4049`
- **Challenge**: Dynamic content requires JavaScript rendering

## Key Data Fields

### Core Fields
- `title_name_kr`: Korean title
- `title_name_en`: English title (optional)
- `title_url`: Source URL
- `title_image`: Cover image URL
- `content_format`: "webtoon", "novel", etc.

### Author Fields (Korean-specific)
- `story_author_kr`: 글 (story author)
- `art_author_kr`: 그림 (art author)
- `writer`: 원작 (original writer)

### Metrics
- `views`: View count (converted from Korean numbers like "322.1만" → 3,221,000)
- `likes`: Like count (converted from Korean numbers)
- `age_rating`: "전체이용가", "15세 이용가", etc.

### Content Info
- `genre`: Genre classification
- `cp`: Content provider/publisher
- `completed`: Boolean completion status
- `tags`: Keywords array (for comic.naver.com only)

## Korean Number Conversion

The scraper handles Korean number formats:
- `만` = 10,000 (e.g., "13.7만" → 137,000)
- `억` = 100,000,000
- `천` = 1,000

## Common Extraction Patterns

### Views
Look for patterns near: `조회수`, `조회`, eye icons, view indicators

### Likes  
Look for patterns near: thumbs-up icons, `좋아요`, heart symbols, star ratings

### Authors
- `글` = Story author
- `그림` = Art author  
- `원작` = Original writer
- `작가` = General author

### Publishers
- `출판사` = Publisher
- `발행처` = Publisher
- `CP` = Content Provider

## Technical Implementation

### Puppeteer Integration
- **Purpose**: Handle JavaScript-loaded dynamic content
- **Implementation**: `fetchRenderedHtml()` method
- **Fallback**: Static HTML scraping if Puppeteer fails
- **Browser**: Headless Chrome with mobile user agent
- **Timeout**: 15 seconds with 3-second content load wait

### Platform Detection
Auto-detects platform from URL patterns:
- `series.naver.com` → Naver Series scraper
- `comic.naver.com` → Naver Comics scraper  
- `page.kakao.com` → KakaoPage scraper
- `webtoon.kakao.com` → Kakao Webtoon scraper

### Error Handling
- Comprehensive logging with emojis for easy debugging
- Graceful fallbacks for failed extractions
- Confidence scoring based on successful field extractions

## Development Commands

```bash
# Start backend server
cd backend && npm start

# Start admin interface  
npm run dev:admin

# Test scraper endpoint
curl -X POST http://localhost:3001/api/scraper/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://series.naver.com/comic/detail.series?productNo=3293134"}'
```

## Current Issues & Status

### ✅ Working Perfect
- Naver Series: Full extraction with all fields
- Naver Comics: Author and keyword extraction
- KakaoPage: Views, likes, authors, publisher
- Puppeteer integration: 80,000+ character dynamic HTML loading

### ⚠️ Known Issues
- Kakao Webtoon: Variable scope issue in final processing steps
  - Puppeteer loads content successfully (88,000+ chars)
  - Views and likes extract correctly
  - Error occurs at genre extraction step
  - Core functionality working, needs debugging

## Test-Driven Development

### User-Provided Test Cases
Always validate against user-specified expected values:

**Example for series.naver.com/comic/detail.series?productNo=9935335:**
- Story Author Kr = "yasuki"
- CP = "드래곤엠스튜디오" 
- Likes = 6
- Views = "1.2만"

**Example for webtoon.kakao.com/content/후회물-악녀는-이혼해서-행복합니다/4049:**
- Story Author Kr = "곰룡"
- Art Author Kr = "곰룡"  
- Writer = "모예리"
- CP = "kwbooks"
- Likes = "6.5만"
- Genre = "로맨스 판타지"

## Generic vs Hardcoded Logic

### ✅ Implemented: Generic Pattern Matching
- Scrapers work with any URL within their platform
- Removed hardcoded URL-specific extraction patterns
- Uses flexible regex patterns and contextual analysis

### Previous Issue: Hardcoded Values
- Early implementations only worked with specific test URLs
- Required upgrading to generic extraction logic
- Now works across entire platform domains

## Architecture Principles

1. **Platform-Specific Scrapers**: Each platform has dedicated extraction logic
2. **Fallback Architecture**: Puppeteer → Static HTML → Default values
3. **Test-Feedback Loops**: User corrections improve extraction accuracy
4. **Comprehensive Logging**: Detailed debugging information with emojis
5. **Korean-Aware Processing**: Handles Korean text patterns and number formats

## Future Enhancements

- Resolve Kakao Webtoon variable scope issue
- Add more Korean content platforms
- Implement machine learning for pattern recognition
- Enhanced structured data extraction from dynamic content boxes

---

*Last Updated: August 2025 - Puppeteer integration completed, generic pattern matching implemented*