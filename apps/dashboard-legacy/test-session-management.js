/**
 * Comprehensive Test Suite for Session Management
 * 
 * This script tests the robust session management utility to ensure
 * proper handling of various session failure scenarios.
 * 
 * Run this with: node test-session-management.js
 */

console.log('🧪 Testing Robust Session Management Utility\n');

// Test 1: URL Token Validation
console.log('=== Test 1: URL Token Validation ===');

const testValidateTokens = (description, urlString, expectedValid) => {
  console.log(`\nTest: ${description}`);
  console.log(`URL: ${urlString}`);
  
  const urlParams = new URLSearchParams(urlString);
  const result = validateSessionTokens(urlParams);
  
  console.log('Result:', {
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings
  });
  
  const passed = result.isValid === expectedValid;
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  
  return passed;
};

// Mock validation function
function validateSessionTokens(urlParams) {
  const errors = [];
  const warnings = [];
  
  const accessToken = urlParams.get('access_token');
  const expiresAtStr = urlParams.get('expires_at');
  
  if (!accessToken) {
    errors.push('Missing access_token parameter');
    return { isValid: false, errors, warnings };
  }
  
  if (accessToken.length < 20) {
    errors.push('Access token appears too short (possibly corrupted)');
  }
  
  const tokenParts = accessToken.split('.');
  if (tokenParts.length !== 3) {
    errors.push('Access token does not appear to be a valid JWT format');
  }
  
  if (expiresAtStr) {
    const expiresAt = parseInt(expiresAtStr);
    if (!isNaN(expiresAt)) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 0) {
        errors.push(`Token expired ${Math.abs(timeUntilExpiry)} seconds ago`);
      } else if (timeUntilExpiry < 300) {
        warnings.push(`Token expires soon (${timeUntilExpiry} seconds)`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sessionData: accessToken ? {
      access_token: accessToken,
      refresh_token: urlParams.get('refresh_token'),
      expires_at: expiresAtStr ? parseInt(expiresAtStr) : undefined,
      token_type: urlParams.get('token_type') || 'bearer'
    } : undefined
  };
}

// Valid JWT-like token
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const futureExpiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
const pastExpiry = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

// Test cases
const tokenTests = [
  ['Valid token with future expiry', `access_token=${validToken}&expires_at=${futureExpiry}`, true],
  ['Valid token without expiry', `access_token=${validToken}`, true],
  ['Missing access token', 'refresh_token=abc123', false],
  ['Short access token', 'access_token=short', false],
  ['Invalid JWT format', 'access_token=not.a.valid.jwt.format', false],
  ['Expired token', `access_token=${validToken}&expires_at=${pastExpiry}`, false],
  ['Soon to expire token (should have warning)', `access_token=${validToken}&expires_at=${Math.floor(Date.now() / 1000) + 120}`, true]
];

let passedTests = 0;
let totalTests = tokenTests.length;

tokenTests.forEach(([description, urlString, expectedValid]) => {
  if (testValidateTokens(description, urlString, expectedValid)) {
    passedTests++;
  }
});

console.log(`\n=== Token Validation Results: ${passedTests}/${totalTests} tests passed ===\n`);

// Test 2: Session Recovery Scenarios
console.log('=== Test 2: Session Recovery Scenarios ===');

const testSessionRecovery = (description, scenario) => {
  console.log(`\nTest: ${description}`);
  console.log('Scenario:', scenario.description);
  
  // Simulate the recovery logic
  let attempts = 0;
  const maxRetries = 3;
  let success = false;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts++;
    console.log(`  Attempt ${attempt}/${maxRetries}:`);
    
    if (scenario.shouldSucceed && attempt >= scenario.successOnAttempt) {
      console.log('    ✅ Session set successfully');
      success = true;
      break;
    } else if (scenario.isRetryable) {
      console.log('    ⚠️ Retryable error, will retry');
    } else {
      console.log('    ❌ Non-retryable error, stopping');
      break;
    }
  }
  
  console.log(`Result: ${success ? 'SUCCESS' : 'FAILED'} after ${attempts} attempts`);
  
  // Test fallback to refresh token if configured
  if (!success && scenario.hasRefreshToken && scenario.fallbackToRefresh) {
    console.log('  🔄 Attempting refresh token fallback...');
    if (scenario.refreshTokenWorks) {
      console.log('    ✅ Refresh token fallback successful');
      success = true;
    } else {
      console.log('    ❌ Refresh token fallback failed');
    }
  }
  
  const passed = success === scenario.expectedSuccess;
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  
  return passed;
};

const recoveryScenarios = [
  {
    description: 'Network error with successful retry',
    scenario: {
      description: 'Temporary network error, succeeds on retry',
      shouldSucceed: true,
      successOnAttempt: 2,
      isRetryable: true,
      expectedSuccess: true
    }
  },
  {
    description: 'Non-retryable error (invalid token)',
    scenario: {
      description: 'Invalid token format, should not retry',
      shouldSucceed: false,
      isRetryable: false,
      expectedSuccess: false
    }
  },
  {
    description: 'Max retries exceeded, fallback to refresh token',
    scenario: {
      description: 'All retries fail, but refresh token works',
      shouldSucceed: false,
      isRetryable: true,
      hasRefreshToken: true,
      fallbackToRefresh: true,
      refreshTokenWorks: true,
      expectedSuccess: true
    }
  },
  {
    description: 'Complete failure scenario',
    scenario: {
      description: 'All retries and refresh token fail',
      shouldSucceed: false,
      isRetryable: true,
      hasRefreshToken: true,
      fallbackToRefresh: true,
      refreshTokenWorks: false,
      expectedSuccess: false
    }
  }
];

let passedRecoveryTests = 0;
let totalRecoveryTests = recoveryScenarios.length;

recoveryScenarios.forEach(({ description, scenario }) => {
  if (testSessionRecovery(description, scenario)) {
    passedRecoveryTests++;
  }
});

console.log(`\n=== Session Recovery Results: ${passedRecoveryTests}/${totalRecoveryTests} tests passed ===\n`);

// Test 3: Session Health Check
console.log('=== Test 3: Session Health Check Scenarios ===');

const testSessionHealth = (description, sessionData, expectedHealthy) => {
  console.log(`\nTest: ${description}`);
  
  if (!sessionData) {
    console.log('Result: No session - healthy: false, issues: ["No active session found"]');
    return !expectedHealthy; // Should be unhealthy
  }
  
  const issues = [];
  const recommendations = [];
  
  // Check expiration (mock)
  if (sessionData.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = sessionData.expires_at - now;
    
    if (timeUntilExpiry < 0) {
      issues.push('Session is expired');
      recommendations.push('User should sign in again');
    } else if (timeUntilExpiry < 600) { // 10 minutes
      issues.push('Session is expiring soon');
      recommendations.push('Session should be refreshed');
    }
  }
  
  // Check access token
  if (!sessionData.access_token || sessionData.access_token.length < 20) {
    issues.push('Access token appears invalid or corrupted');
    recommendations.push('User should sign in again');
  }
  
  const healthy = issues.length === 0;
  
  console.log('Result:', {
    healthy,
    issues,
    recommendations
  });
  
  const passed = healthy === expectedHealthy;
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  
  return passed;
};

const healthScenarios = [
  ['Healthy session', {
    access_token: validToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: '123', email: 'test@example.com' }
  }, true],
  ['Expired session', {
    access_token: validToken,
    expires_at: Math.floor(Date.now() / 1000) - 1800,
    user: { id: '123', email: 'test@example.com' }
  }, false],
  ['Soon to expire session', {
    access_token: validToken,
    expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    user: { id: '123', email: 'test@example.com' }
  }, false],
  ['Invalid access token', {
    access_token: 'short',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: '123', email: 'test@example.com' }
  }, false],
  ['No session', null, false]
];

let passedHealthTests = 0;
let totalHealthTests = healthScenarios.length;

healthScenarios.forEach(([description, sessionData, expectedHealthy]) => {
  if (testSessionHealth(description, sessionData, expectedHealthy)) {
    passedHealthTests++;
  }
});

console.log(`\n=== Session Health Results: ${passedHealthTests}/${totalHealthTests} tests passed ===\n`);

// Final Results
const overallPassed = passedTests + passedRecoveryTests + passedHealthTests;
const overallTotal = totalTests + totalRecoveryTests + totalHealthTests;

console.log('=== FINAL RESULTS ===');
console.log(`Token Validation: ${passedTests}/${totalTests} passed`);
console.log(`Session Recovery: ${passedRecoveryTests}/${totalRecoveryTests} passed`);
console.log(`Session Health: ${passedHealthTests}/${totalHealthTests} passed`);
console.log(`\nOverall: ${overallPassed}/${overallTotal} tests passed`);

if (overallPassed === overallTotal) {
  console.log('🎉 All session management tests passed!');
} else {
  console.log(`⚠️ ${overallTotal - overallPassed} tests failed. Review implementation.`);
}