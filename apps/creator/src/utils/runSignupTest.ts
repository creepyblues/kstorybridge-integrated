/**
 * Signup Test Runner
 *
 * Run this in browser console to test signup flow
 */

import { debugSignupFlow, validateSignupData, printDebugResults, TEST_CONFIGS } from './signupDebugger';

// Test buyer signup
export async function testBuyerSignup() {
  console.log('🔍 Testing Buyer Signup Flow...');

  const config = {
    ...TEST_CONFIGS.buyerBasic,
    testEmail: `test-buyer-${Date.now()}@example.com`,
    profileData: {
      ...TEST_CONFIGS.buyerBasic.profileData,
      email: `test-buyer-${Date.now()}@example.com`
    }
  };

  // First validate the form data
  const validationResult = validateSignupData(config.accountType, config.profileData);
  console.log('📝 Form Validation:', validationResult);

  if (!validationResult.success) {
    console.error('❌ Form validation failed:', validationResult.error);
    return;
  }

  // Run the full signup flow test
  const results = await debugSignupFlow(config);
  printDebugResults(results);

  return results;
}

// Test creator signup
export async function testCreatorSignup() {
  console.log('🔍 Testing Creator Signup Flow...');

  const config = {
    ...TEST_CONFIGS.creatorBasic,
    testEmail: `test-creator-${Date.now()}@example.com`,
    profileData: {
      ...TEST_CONFIGS.creatorBasic.profileData,
      email: `test-creator-${Date.now()}@example.com`
    }
  };

  // First validate the form data
  const validationResult = validateSignupData(config.accountType, config.profileData);
  console.log('📝 Form Validation:', validationResult);

  if (!validationResult.success) {
    console.error('❌ Form validation failed:', validationResult.error);
    return;
  }

  // Run the full signup flow test
  const results = await debugSignupFlow(config);
  printDebugResults(results);

  return results;
}

// Test both signup flows
export async function testAllSignupFlows() {
  console.log('🚀 Testing All Signup Flows...\n');

  console.log('1️⃣ Testing Buyer Signup:');
  const buyerResults = await testBuyerSignup();

  console.log('\n2️⃣ Testing Creator Signup:');
  const creatorResults = await testCreatorSignup();

  // Summary
  console.log('\n📊 Overall Test Summary:');
  const allResults = [...(buyerResults || []), ...(creatorResults || [])];
  const successCount = allResults.filter(r => r.success).length;
  const totalCount = allResults.length;

  console.log(`Total Steps: ${totalCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${totalCount - successCount}`);
  console.log(`Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);

  return { buyerResults, creatorResults };
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testBuyerSignup = testBuyerSignup;
  (window as any).testCreatorSignup = testCreatorSignup;
  (window as any).testAllSignupFlows = testAllSignupFlows;

  console.log('🔧 Signup test functions available:');
  console.log('- testBuyerSignup()');
  console.log('- testCreatorSignup()');
  console.log('- testAllSignupFlows()');
}