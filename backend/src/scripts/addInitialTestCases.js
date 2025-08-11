/**
 * Add Initial Test Cases
 * Seeds the testing system with known good examples
 */

import ScraperTestSuite from '../tests/scraperTestSuite.js';

const testSuite = new ScraperTestSuite();

async function addInitialTestCases() {
  await testSuite.init();
  
  console.log('🌱 Adding initial test cases based on previous validation...');

  // Test Case 1: Naver Series - "마녀의 하인과 마왕의 뿔"
  await testSuite.addTestCase(
    'https://series.naver.com/comic/detail.series?productNo=3293134',
    {
      title_name_kr: '마녀의 하인과 마왕의 뿔',
      views: 137000,
      author: '모치',
      story_author_kr: '모치',
      art_author_kr: '모치',
      genre: '소년',
      audience: '15세 이용가',
      cp: '시프트코믹스',
      completed: true,
      content_format: 'webtoon'
    },
    {
      source: 'validated_manual',
      difficulty: 'medium',
      notes: 'Well-structured Naver series page with all major fields'
    }
  );

  // Test Case 2: Naver Series - "악녀로 돌아갔더니 아들이 생겼다"
  await testSuite.addTestCase(
    'https://series.naver.com/comic/detail.series?productNo=12293771',
    {
      title_name_kr: '악녀로 돌아갔더니 아들이 생겼다',
      views: 7200,
      story_author_kr: 'Eon Comics',
      art_author_kr: 'Eon Comics', 
      genre: '순정',
      audience: '15세 이용가',
      cp: 'Eon Comics',
      completed: true,
      content_format: 'webtoon'
    },
    {
      source: 'validated_manual',
      difficulty: 'medium',
      notes: 'Eon Comics publisher, 순정 genre, 천 unit conversion'
    }
  );

  // Test Case 3: Naver Series - "반에 꼭 있는 애"
  await testSuite.addTestCase(
    'https://series.naver.com/comic/detail.series?productNo=12981120',
    {
      title_name_kr: '반에 꼭 있는 애',
      views: 24000,
      genre: '소년',
      audience: '15세 이용가',
      cp: '네이버웹툰',
      completed: false,
      content_format: 'webtoon'
    },
    {
      source: 'validated_manual',
      difficulty: 'easy',
      notes: 'Ongoing series (연재), standard Naver format'
    }
  );

  // Test Case 4: KakaoPage example (URL-based)
  await testSuite.addTestCase(
    'https://page.kakao.com/content/61614855',
    {
      title_name_kr: 'Expected Title Here',
      content_format: 'webtoon',
      genre: 'romance'
    },
    {
      source: 'template',
      difficulty: 'hard',
      notes: 'KakaoPage content page - needs validation'
    }
  );

  // Test Case 5: Naver Comic (different from Series)
  await testSuite.addTestCase(
    'https://comic.naver.com/webtoon/list?titleId=841324',
    {
      title_name_kr: 'Expected Comic Title',
      content_format: 'webtoon',
      tags: ['keyword1', 'keyword2'] // Comic has keywords unlike Series
    },
    {
      source: 'template',
      difficulty: 'medium',
      notes: 'Comic.naver.com should have tags/keywords'
    }
  );

  console.log('✅ Initial test cases added successfully!');
  console.log('🧪 Run npm run test-scraper to execute the test suite');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addInitialTestCases().catch(console.error);
}

export default addInitialTestCases;