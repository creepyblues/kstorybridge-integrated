/**
 * Tier Performance Test Script
 * 
 * This script helps test and compare the performance of the original
 * vs optimized tier access system.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Simulate original tier check (individual database query)
 */
async function simulateOriginalTierCheck(userEmail) {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('user_buyers')
      .select('tier, email')
      .eq('email', userEmail)
      .single();

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      return { success: false, duration, error: error.message };
    }

    return { 
      success: true, 
      duration, 
      tier: data.tier || 'invited',
      data 
    };
  } catch (error) {
    const endTime = Date.now();
    return { 
      success: false, 
      duration: endTime - startTime, 
      error: error.message 
    };
  }
}

/**
 * Simulate multiple tier checks (like in original implementation)
 */
async function simulateMultipleTierChecks(userEmail, numberOfChecks) {
  console.log(`🔄 Testing ${numberOfChecks} individual tier checks (original approach)...`);
  
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < numberOfChecks; i++) {
    promises.push(simulateOriginalTierCheck(userEmail));
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgIndividualTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  return {
    totalDuration,
    avgIndividualTime,
    successful,
    failed,
    results
  };
}

/**
 * Simulate optimized tier check (single database query shared)
 */
async function simulateOptimizedTierCheck(userEmail, numberOfChecks) {
  console.log(`⚡ Testing 1 shared tier check for ${numberOfChecks} components (optimized approach)...`);
  
  const startTime = Date.now();
  
  // Single database query
  const tierResult = await simulateOriginalTierCheck(userEmail);
  
  // Simulate multiple components using the shared result
  const componentResults = [];
  for (let i = 0; i < numberOfChecks; i++) {
    const componentStart = Date.now();
    // Simulate component processing (no database query)
    const hasMinimumTier = (userTier, requiredTier) => {
      const hierarchy = { invited: 0, basic: 1, pro: 2, suite: 3 };
      return hierarchy[userTier] >= hierarchy[requiredTier];
    };
    
    const canAccess = hasMinimumTier(tierResult.tier || 'invited', 'pro');
    const componentEnd = Date.now();
    
    componentResults.push({
      success: true,
      duration: componentEnd - componentStart,
      canAccess
    });
  }
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  return {
    totalDuration,
    dbQueryTime: tierResult.duration,
    componentProcessingTime: componentResults.reduce((sum, r) => sum + r.duration, 0),
    successful: tierResult.success ? numberOfChecks : 0,
    failed: tierResult.success ? 0 : numberOfChecks,
    tier: tierResult.tier
  };
}

/**
 * Run performance comparison test
 */
async function runPerformanceTest() {
  console.log('🚀 Tier Access Performance Test');
  console.log('================================\n');
  
  const testEmail = 'sungho@dadble.com';
  const scenarios = [
    { name: 'Single Title Detail Page', checks: 4 },
    { name: 'Titles Page (10 titles)', checks: 20 },  // 2 premium columns per title
    { name: 'Titles Page (50 titles)', checks: 100 }, // Typical full page load
    { name: 'Large Dataset (100 titles)', checks: 200 }
  ];

  for (const scenario of scenarios) {
    console.log(`📊 Testing: ${scenario.name}`);
    console.log('='.repeat(50));
    
    // Test original approach
    const originalResults = await simulateMultipleTierChecks(testEmail, scenario.checks);
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test optimized approach
    const optimizedResults = await simulateOptimizedTierCheck(testEmail, scenario.checks);
    
    // Calculate improvements
    const timeImprovement = ((originalResults.totalDuration - optimizedResults.totalDuration) / originalResults.totalDuration * 100);
    const dbQueryReduction = scenario.checks - 1; // From N queries to 1
    
    console.log(`\n📈 Results for ${scenario.name}:`);
    console.log(`   Components with premium content: ${scenario.checks}`);
    console.log(`   Original approach: ${originalResults.totalDuration}ms (${originalResults.successful} success, ${originalResults.failed} failed)`);
    console.log(`   Optimized approach: ${optimizedResults.totalDuration}ms (${optimizedResults.successful} success, ${optimizedResults.failed} failed)`);
    console.log(`   Time improvement: ${timeImprovement.toFixed(1)}% faster`);
    console.log(`   Database queries reduced: ${dbQueryReduction} fewer queries`);
    console.log(`   Network requests saved: ${dbQueryReduction}`);
    
    if (optimizedResults.tier) {
      console.log(`   User tier: ${optimizedResults.tier}`);
    }
    
    console.log('\n' + '─'.repeat(50) + '\n');
  }
}

/**
 * Provide optimization summary
 */
function showOptimizationSummary() {
  console.log('💡 Optimization Summary');
  console.log('=======================');
  console.log('');
  console.log('🔴 Original Implementation Issues:');
  console.log('   • Each TierGatedContent component calls useTierAccess()');
  console.log('   • Each useTierAccess() makes a database query');
  console.log('   • 50 titles × 2 premium fields = 100 database queries');
  console.log('   • Sequential loading causes visible delays');
  console.log('   • Poor user experience with loading states');
  console.log('');
  console.log('🟢 Optimized Implementation Benefits:');
  console.log('   • Single database query per page with TierProvider');
  console.log('   • All components share the same tier information');
  console.log('   • 100 queries reduced to 1 query (99% reduction)');
  console.log('   • Faster page loads and better user experience');
  console.log('   • No loading states for individual components');
  console.log('');
  console.log('📦 Implementation Details:');
  console.log('   • TierProvider wraps page components');
  console.log('   • TierContext shares tier state across components');
  console.log('   • OptimizedTierGatedContent uses context instead of hooks');
  console.log('   • useOptimizedTierAccess for conditional rendering');
  console.log('');
  console.log('🎯 Usage:');
  console.log('   1. Wrap pages with <TierProvider>');
  console.log('   2. Use <OptimizedTierGatedContent> instead of <TierGatedContent>');
  console.log('   3. Use useOptimizedTierAccess() for tier checks');
  console.log('   4. Enjoy faster loading times!');
}

/**
 * Main execution
 */
async function main() {
  try {
    await runPerformanceTest();
    showOptimizationSummary();
    
    console.log('\n✅ Performance test completed!');
    console.log('The optimized tier system should provide significant improvements,');
    console.log('especially on pages with many premium content sections.');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main, simulateMultipleTierChecks, simulateOptimizedTierCheck };