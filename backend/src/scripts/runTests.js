/**
 * Test Runner Script
 * Executes the scraper test suite and displays results
 */

import ScraperTestSuite from '../tests/scraperTestSuite.js';

async function runTests() {
  console.log('🧪 KStoryBridge Scraper Test Runner');
  console.log('=====================================\n');
  
  const testSuite = new ScraperTestSuite();
  await testSuite.init();
  
  if (testSuite.testCases.size === 0) {
    console.log('⚠️  No test cases found!');
    console.log('💡 Run: npm run add-test-cases to add initial test cases\n');
    return;
  }
  
  console.log(`📋 Running ${testSuite.testCases.size} test cases...\n`);
  
  const report = await testSuite.runAllTests();
  
  // Display summary
  console.log('\n🎯 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`✅ Passed (≥80%): ${report.summary.passed}`);
  console.log(`⚠️  Warning (60-80%): ${report.summary.warning}`);
  console.log(`❌ Failed (<60%): ${report.summary.failed}`);
  console.log(`📊 Average Accuracy: ${(report.summary.avgAccuracy * 100).toFixed(1)}%`);
  console.log(`🎲 Average Confidence: ${(report.summary.avgConfidence * 100).toFixed(1)}%\n`);
  
  // Platform breakdown
  console.log('📱 By Platform:');
  for (const [platform, stats] of Object.entries(report.byPlatform)) {
    const accuracy = (stats.avgAccuracy * 100).toFixed(1);
    const status = stats.avgAccuracy >= 0.8 ? '✅' : stats.avgAccuracy >= 0.6 ? '⚠️' : '❌';
    console.log(`  ${status} ${platform}: ${accuracy}% (${stats.passed}/${stats.count} passed)`);
  }
  
  // Field analysis
  console.log('\n🏷️  Field Analysis (Top Issues):');
  const sortedFields = Object.entries(report.fieldAnalysis)
    .sort(([,a], [,b]) => a.accuracy - b.accuracy)
    .slice(0, 5);
    
  for (const [field, stats] of sortedFields) {
    const accuracy = (stats.accuracy * 100).toFixed(1);
    const status = stats.accuracy >= 0.8 ? '✅' : stats.accuracy >= 0.6 ? '⚠️' : '❌';
    console.log(`  ${status} ${field}: ${accuracy}% (${stats.correctCount}/${stats.totalTests})`);
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.slice(0, 5).forEach((rec, i) => {
      const priority = rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚠️' : 'ℹ️';
      console.log(`  ${i + 1}. ${priority} ${rec.suggestion}`);
    });
  }
  
  // Individual test results (only show failures for brevity)
  const failures = report.results.filter(r => r.accuracy.overall < 0.6);
  if (failures.length > 0) {
    console.log(`\n❌ Failed Tests (${failures.length}):`);
    failures.forEach(result => {
      console.log(`  • ${result.platform}: ${(result.accuracy.overall * 100).toFixed(1)}% - ${result.url}`);
    });
  }
  
  console.log('\n📁 Full report saved to:', 'test-results/');
  console.log('🔗 API available at: http://localhost:3001/api/testing/report');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export default runTests;