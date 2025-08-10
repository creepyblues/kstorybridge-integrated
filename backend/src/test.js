import scraperService from './services/scraperService.js';

console.log('🧪 Testing KStoryBridge Scraper Service\n');

const testUrl = 'https://series.naver.com/comic/detail.series?productNo=3293134';

console.log(`📋 Testing URL: ${testUrl}`);
console.log('Expected data:');
console.log('- Title: "마녀의 하인과 마왕의 뿔"');
console.log('- Views: "13.7만" → 137,000');
console.log('- Likes: 134');
console.log('- Author: "모치" (both story and art)');
console.log('- Age Rating: "15세 이용가"');
console.log('- CP: "시프트코믹스"\n');

try {
  const result = await scraperService.scrapeTitle(testUrl);
  
  console.log('📊 Scraping Results:');
  console.log('==================');
  console.log(`Success: ${result.success}`);
  console.log(`Confidence: ${Math.round(result.confidence * 100)}%`);
  console.log(`Fields Extracted: ${result.extractedFields.length}`);
  console.log(`Fields: [${result.extractedFields.join(', ')}]`);
  
  if (result.success && result.data) {
    console.log('\n📝 Extracted Data:');
    console.log('==================');
    Object.entries(result.data).forEach(([key, value]) => {
      if (value && value !== 'N/A' && !(Array.isArray(value) && value.length === 0)) {
        console.log(`${key}: ${Array.isArray(value) ? `[${value.join(', ')}]` : value}`);
      }
    });
  }
  
  if (result.error) {
    console.log(`\n❌ Error: ${result.error}`);
  }
  
  if (result.logs && result.logs.length > 0) {
    console.log('\n📄 Verbose Logs:');
    console.log('================');
    result.logs.forEach(log => console.log(log));
  }
  
} catch (error) {
  console.error('💥 Test failed:', error.message);
}

console.log('\n✅ Test completed!');