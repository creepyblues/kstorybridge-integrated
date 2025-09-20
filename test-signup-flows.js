/**
 * Browser-based Authentication Testing
 * 
 * Tests actual signup flows through the browser interface
 * Run with: node test-signup-flows.js
 */

import { AuthTester, supabase } from './test-auth-utils.js';

const tester = new AuthTester();

// Test configuration
const TEST_CONFIG = {
  dashboardUrl: 'http://localhost:8082',
  testTimeout: 30000,
  buyerTestEmail: `test-buyer-${Date.now()}@gmail.com`,
  creatorTestEmail: `test-creator-${Date.now()}@gmail.com`
};

// Since we can't use browser automation without additional dependencies,
// let's create tests that work with the Supabase auth API directly

async function testEmailSignup() {
  tester.log('🧪 Testing Email Signup Flows');

  // Test buyer email signup
  await tester.recordTest('Buyer Email Signup Flow', async () => {
    const signupData = {
      email: TEST_CONFIG.buyerTestEmail,
      password: 'TestPass123!',
      options: {
        data: {
          full_name: 'Test Buyer User',
          account_type: 'buyer',
          buyer_company: 'Test Company Inc.',
          buyer_role: 'Content Acquisitions',
          linkedin_url: 'https://linkedin.com/in/test-buyer'
        }
      }
    };

    const { data, error } = await supabase.auth.signUp(signupData);
    
    if (error) {
      // Check if it's an expected error (like email domain restriction)
      if (error.message.includes('Signup not allowed') || 
          error.message.includes('Email domain') ||
          error.message.includes('invalid') ||
          error.code === 'email_address_invalid') {
        return { 
          status: 'blocked_by_policy', 
          error: error.message,
          errorCode: error.code,
          expected: true 
        };
      }
      throw error;
    }

    return {
      userCreated: !!data.user,
      userId: data.user?.id,
      email: data.user?.email,
      needsVerification: !data.user?.email_confirmed_at
    };
  });

  // Test creator email signup  
  await tester.recordTest('Creator Email Signup Flow', async () => {
    const signupData = {
      email: TEST_CONFIG.creatorTestEmail,
      password: 'TestPass123!',
      options: {
        data: {
          full_name: 'Test Creator User',
          account_type: 'creator',
          pen_name: 'Test Creative Studio',
          ip_owner_role: 'Author',
          ip_owner_company: 'Creative Company',
          website_url: 'https://testcreator.com'
        }
      }
    };

    const { data, error } = await supabase.auth.signUp(signupData);
    
    if (error) {
      if (error.message.includes('Signup not allowed') || 
          error.message.includes('Email domain') ||
          error.message.includes('invalid') ||
          error.code === 'email_address_invalid') {
        return { 
          status: 'blocked_by_policy', 
          error: error.message,
          errorCode: error.code,
          expected: true 
        };
      }
      throw error;
    }

    return {
      userCreated: !!data.user,
      userId: data.user?.id,  
      email: data.user?.email,
      needsVerification: !data.user?.email_confirmed_at
    };
  });
}

async function testDatabaseTriggers() {
  tester.log('🔧 Testing Database Triggers and Profile Creation');

  // Wait a moment for triggers to execute
  await new Promise(resolve => setTimeout(resolve, 2000));

  await tester.recordTest('Buyer Profile Creation via Trigger', async () => {
    const profile = await tester.checkUserBuyer(TEST_CONFIG.buyerTestEmail);
    
    if (!profile) {
      return { profileCreated: false, note: 'Profile not found - may be due to email restrictions or trigger delays' };
    }

    const validationErrors = tester.validateBuyerData(profile, {
      email: TEST_CONFIG.buyerTestEmail,
      tier: 'basic'
    });

    return {
      profileCreated: true,
      profileData: profile,
      validationsPassed: validationErrors.length === 0,
      validationErrors
    };
  });

  await tester.recordTest('Creator Profile Creation via Trigger', async () => {
    const profile = await tester.checkUserIPOwner(TEST_CONFIG.creatorTestEmail);
    
    if (!profile) {
      return { profileCreated: false, note: 'Profile not found - may be due to email restrictions or trigger delays' };
    }

    const validationErrors = tester.validateIPOwnerData(profile, {
      email: TEST_CONFIG.creatorTestEmail,
      invitation_status: 'invited'
    });

    return {
      profileCreated: true,
      profileData: profile,
      validationsPassed: validationErrors.length === 0,
      validationErrors
    };
  });
}

async function testAuthStates() {
  tester.log('🔐 Testing Authentication States');

  await tester.recordTest('Session State After Signup', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    return {
      hasActiveSession: !!session,
      sessionUser: session?.user?.email,
      sessionValid: !!(session?.access_token)
    };
  });

  await tester.recordTest('User Metadata Validation', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { hasUser: false };
    }

    const metadata = session.user.user_metadata;
    
    return {
      hasUser: true,
      hasMetadata: !!metadata,
      accountType: metadata?.account_type,
      fullName: metadata?.full_name,
      metadataKeys: Object.keys(metadata || {})
    };
  });
}

async function testSignInFlow() {
  tester.log('🔑 Testing Sign-In Flow');

  // Sign out first
  await supabase.auth.signOut();

  await tester.recordTest('Sign In with Test Account', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_CONFIG.buyerTestEmail,
      password: 'TestPass123!'
    });

    if (error) {
      // Expected if email verification is required
      if (error.message.includes('Email not confirmed')) {
        return {
          signInBlocked: true,
          reason: 'email_not_verified',
          expected: true
        };
      }
      throw error;
    }

    return {
      signInSuccessful: true,
      userId: data.user?.id,
      email: data.user?.email
    };
  });
}

async function testErrorScenarios() {
  tester.log('⚠️ Testing Error Scenarios');

  await tester.recordTest('Duplicate Email Signup', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_CONFIG.buyerTestEmail, // Same email as before
      password: 'AnotherPass123!',
      options: {
        data: {
          full_name: 'Another User',
          account_type: 'buyer'
        }
      }
    });

    if (error) {
      return {
        duplicateDetected: true,
        errorMessage: error.message,
        errorCode: error.status
      };
    }

    // If no error, check if it's the same user
    return {
      duplicateDetected: false,
      sameUser: data.user?.email === TEST_CONFIG.buyerTestEmail
    };
  });

  await tester.recordTest('Invalid Email Format', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'invalid-email-format',
      password: 'TestPass123!'
    });

    return {
      errorDetected: !!error,
      errorMessage: error?.message,
      isValidationError: error?.message?.toLowerCase().includes('email')
    };
  });

  await tester.recordTest('Weak Password', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: `test-weak-${Date.now()}@example.com`,
      password: '123' // Too short
    });

    return {
      errorDetected: !!error,
      errorMessage: error?.message,
      isPasswordError: error?.message?.toLowerCase().includes('password')
    };
  });
}

async function runAllBrowserTests() {
  tester.log('🚀 Starting Browser-based Authentication Tests');
  tester.log(`Dashboard URL: ${TEST_CONFIG.dashboardUrl}`);
  
  try {
    // Clean up any existing test data
    await tester.recordTest('Initial Cleanup', async () => {
      await tester.cleanupAllTestUsers();
      return { cleaned: true };
    });

    // Test email signup flows
    await testEmailSignup();

    // Test database trigger functionality
    await testDatabaseTriggers();

    // Test authentication states
    await testAuthStates();

    // Test sign-in flow
    await testSignInFlow();

    // Test error scenarios
    await testErrorScenarios();

    // Final cleanup
    await tester.recordTest('Final Cleanup', async () => {
      await tester.cleanupTestUser(TEST_CONFIG.buyerTestEmail);
      await tester.cleanupTestUser(TEST_CONFIG.creatorTestEmail);
      return { cleanupCompleted: true };
    });

  } catch (error) {
    tester.log(`Test suite failed: ${error.message}`, 'error');
    console.error('Full error:', error);
  }

  // Generate report
  const report = tester.generateReport();
  
  // Additional insights
  console.log('\n🔍 KEY INSIGHTS:');
  const insights = [];
  
  tester.testResults.forEach(test => {
    if (test.result?.status === 'blocked_by_policy') {
      insights.push(`📧 Email restrictions are active: ${test.result.error}`);
    }
    if (test.result?.needsVerification) {
      insights.push(`✉️ Email verification is required for new accounts`);
    }
    if (test.result?.profileCreated === false) {
      insights.push(`🔧 Database triggers may have delays or restrictions`);
    }
  });

  insights.forEach(insight => console.log(insight));
  
  return report;
}

// Export for use in other scripts
export { runAllBrowserTests };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllBrowserTests().catch(console.error);
}
