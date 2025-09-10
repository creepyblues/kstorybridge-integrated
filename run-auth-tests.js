/**
 * Comprehensive Authentication Test Suite
 * 
 * This script runs all authentication tests systematically
 */

import { AuthTester, supabase } from './test-auth-utils.js';

const tester = new AuthTester();

// Test configuration
const TEST_CONFIG = {
  buyerEmail: `test-buyer-${Date.now()}@example.com`,
  creatorEmail: `test-creator-${Date.now()}@example.com`,
  dashboardUrl: 'http://localhost:8082',
  testTimeout: 30000 // 30 seconds
};

async function runAllTests() {
  tester.log('🚀 Starting Comprehensive Authentication Test Suite', 'info');
  tester.log(`Dashboard URL: ${TEST_CONFIG.dashboardUrl}`, 'info');
  tester.log(`Test emails: ${TEST_CONFIG.buyerEmail}, ${TEST_CONFIG.creatorEmail}`, 'info');
  
  try {
    // 1. Initial Database State Inspection
    await tester.recordTest('Initial Database State Inspection', async () => {
      const state = await tester.inspectDatabaseState();
      return { 
        buyerCount: state?.buyers?.length || 0,
        creatorCount: state?.ipOwners?.length || 0
      };
    });

    // 2. Cleanup any existing test data
    await tester.recordTest('Cleanup Existing Test Data', async () => {
      await tester.cleanupAllTestUsers();
      return { cleaned: true };
    });

    // 3. Test Database Schema Validation
    await tester.recordTest('Database Schema Validation', async () => {
      // Check if tables exist by trying to query them
      const { error: buyerError } = await supabase.from('user_buyers').select('id').limit(1);
      const { error: creatorError } = await supabase.from('user_creators').select('id').limit(1);
      
      return {
        buyerTableExists: !buyerError,
        creatorTableExists: !creatorError,
        buyerError: buyerError?.message,
        creatorError: creatorError?.message
      };
    });

    // 4. Test Buyer Profile Creation (Direct Database)
    await tester.recordTest('Direct Buyer Profile Creation', async () => {
      const testData = {
        id: crypto.randomUUID(),
        email: TEST_CONFIG.buyerEmail,
        full_name: 'Test Buyer User',
        buyer_company: 'Test Company Inc.',
        buyer_role: null, // Try with null first to see if it's nullable
        tier: 'basic',
        linkedin_url: 'https://linkedin.com/in/test-user'
      };

      const { data, error } = await supabase
        .from('user_buyers')
        .insert(testData)
        .select()
        .single();

      if (error) throw error;

      // Validate the inserted data
      const validationErrors = tester.validateBuyerData(data, {
        email: TEST_CONFIG.buyerEmail,
        tier: 'basic'
      });

      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      return { inserted: data, validationsPassed: true };
    });

    // 5. Test Creator Profile Creation (Direct Database)  
    await tester.recordTest('Direct Creator Profile Creation', async () => {
      const testData = {
        id: crypto.randomUUID(),
        email: TEST_CONFIG.creatorEmail,
        full_name: 'Test Creator User',
        pen_name: 'TestCreator Studio',
        ip_owner_role: 'Author',
        ip_owner_company: 'Creative Studio',
        website_url: 'https://testcreator.com',
        invitation_status: 'invited'
      };

      const { data, error } = await supabase
        .from('user_creators')
        .insert(testData)
        .select()
        .single();

      if (error) throw error;

      // Validate the inserted data
      const validationErrors = tester.validateIPOwnerData(data, {
        email: TEST_CONFIG.creatorEmail,
        invitation_status: 'invited'
      });

      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      return { inserted: data, validationsPassed: true };
    });

    // 6. Test Profile Retrieval
    await tester.recordTest('Profile Retrieval Test', async () => {
      const buyerProfile = await tester.checkUserBuyer(TEST_CONFIG.buyerEmail);
      const creatorProfile = await tester.checkUserIPOwner(TEST_CONFIG.creatorEmail);

      if (!buyerProfile) throw new Error('Buyer profile not found');
      if (!creatorProfile) throw new Error('Creator profile not found');

      return {
        buyerFound: !!buyerProfile,
        creatorFound: !!creatorProfile,
        buyerTier: buyerProfile.tier,
        creatorStatus: creatorProfile.invitation_status
      };
    });

    // 7. Test Data Integrity
    await tester.recordTest('Data Integrity Validation', async () => {
      const buyerProfile = await tester.checkUserBuyer(TEST_CONFIG.buyerEmail);
      const creatorProfile = await tester.checkUserIPOwner(TEST_CONFIG.creatorEmail);

      // Check required fields
      const buyerValidations = tester.validateBuyerData(buyerProfile);
      const creatorValidations = tester.validateIPOwnerData(creatorProfile);

      const allValidations = [...buyerValidations, ...creatorValidations];

      if (allValidations.length > 0) {
        throw new Error(`Data integrity issues: ${allValidations.join(', ')}`);
      }

      return {
        buyerIntegrity: buyerValidations.length === 0,
        creatorIntegrity: creatorValidations.length === 0,
        allValidationsPassed: true
      };
    });

    // 8. Test Enum Values
    await tester.recordTest('Enum Values Validation', async () => {
      const buyerProfile = await tester.checkUserBuyer(TEST_CONFIG.buyerEmail);
      const creatorProfile = await tester.checkUserIPOwner(TEST_CONFIG.creatorEmail);

      // Valid tier values: basic, invited, pro, suite
      const validTiers = ['basic', 'invited', 'pro', 'suite'];
      const validStatuses = ['invited', 'accepted', 'rejected'];

      if (!validTiers.includes(buyerProfile.tier)) {
        throw new Error(`Invalid tier: ${buyerProfile.tier}`);
      }

      if (!validStatuses.includes(creatorProfile.invitation_status)) {
        throw new Error(`Invalid invitation status: ${creatorProfile.invitation_status}`);
      }

      return {
        tierValid: validTiers.includes(buyerProfile.tier),
        statusValid: validStatuses.includes(creatorProfile.invitation_status)
      };
    });

    // 9. Test Edge Case Data
    await tester.recordTest('Edge Case Data Handling', async () => {
      const edgeCaseEmail = `edge-case-${Date.now()}@test.com`;
      
      // Test with minimal required data
      const minimalBuyerData = {
        id: crypto.randomUUID(),
        email: edgeCaseEmail,
        full_name: 'A', // Minimal name
        buyer_company: 'X', // Minimal company
        buyer_role: 'Other',
        tier: 'basic'
      };

      const { data, error } = await supabase
        .from('user_buyers')
        .insert(minimalBuyerData)
        .select()
        .single();

      if (error) throw error;

      // Cleanup edge case data
      await tester.cleanupTestUser(edgeCaseEmail);

      return { handledMinimalData: true };
    });

    // 10. Test Duplicate Email Handling
    await tester.recordTest('Duplicate Email Handling', async () => {
      const duplicateEmail = `duplicate-${Date.now()}@test.com`;
      
      const userData1 = {
        id: crypto.randomUUID(),
        email: duplicateEmail,
        full_name: 'First User',
        buyer_company: 'Company 1',
        buyer_role: 'Other',
        tier: 'basic'
      };

      const userData2 = {
        id: crypto.randomUUID(),
        email: duplicateEmail, // Same email
        full_name: 'Second User',
        buyer_company: 'Company 2',
        buyer_role: 'Director',
        tier: 'pro'
      };

      // Insert first user
      await supabase.from('user_buyers').insert(userData1);

      // Try to insert second user with same email
      const { error } = await supabase.from('user_buyers').insert(userData2);

      const duplicateDetected = error && error.code === '23505'; // Unique constraint violation

      // Cleanup
      await tester.cleanupTestUser(duplicateEmail);

      return { duplicateDetected };
    });

    // Final cleanup
    await tester.recordTest('Final Cleanup', async () => {
      await tester.cleanupTestUser(TEST_CONFIG.buyerEmail);
      await tester.cleanupTestUser(TEST_CONFIG.creatorEmail);
      return { cleanupCompleted: true };
    });

  } catch (error) {
    tester.log(`Test suite failed: ${error.message}`, 'error');
  }

  // Generate final report
  const report = tester.generateReport();
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    testConfig: TEST_CONFIG,
    summary: report,
    details: tester.testResults
  };

  console.log('\n📊 Detailed test data available in test results');
  
  return report;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };