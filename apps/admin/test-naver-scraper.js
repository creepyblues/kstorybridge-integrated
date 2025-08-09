// Since this is built with Vite, let's test via the running dev server instead
// The scraper service is bundled in the client build

async function testNaverUrl() {
  const testUrl = 'https://series.naver.com/comic/detail.series?productNo=3293134';
  console.log('🧪 Testing URL via the admin interface at http://localhost:8082');
  console.log('URL to test:', testUrl);
  console.log('\n📋 To test:');
  console.log('1. Go to http://localhost:8082/titles');  
  console.log('2. Click "Scraper Test" tab');
  console.log('3. Enter this URL:', testUrl);
  console.log('4. Click "Scrape URL"');
  console.log('5. Expected title: "마녀의 하인과 마왕의 뿔"');
  console.log('6. Should extract rating 8.9 and views 13.7만');
}

testNaverUrl();