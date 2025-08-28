/**
 * Authentication Testing Utilities
 * 
 * This script provides utilities for testing authentication flows
 * Run with: node test-auth-utils.js [command] [options]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class AuthTester {
  constructor() {
    this.testResults = [];
    this.testCounter = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async recordTest(testName, testFunction) {
    this.testCounter++;
    const testId = `TEST_${this.testCounter.toString().padStart(3, '0')}`;
    
    this.log(`Starting ${testId}: ${testName}`, 'info');
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        id: testId,
        name: testName,
        status: 'PASS',
        duration,
        result
      });
      
      this.log(`${testId} PASSED (${duration}ms)`, 'success');
      return result;
    } catch (error) {
      this.testResults.push({
        id: testId,
        name: testName,
        status: 'FAIL',
        error: error.message
      });
      
      this.log(`${testId} FAILED: ${error.message}`, 'error');
      throw error;
    }
  }

  // Database query utilities
  async queryDatabase(query, params = []) {
    const { data, error } = await supabase.rpc('execute_sql', { 
      query, 
      params 
    }).catch(async () => {
      // Fallback to direct table queries if RPC doesn't exist
      if (query.includes('user_buyers')) {
        return await supabase.from('user_buyers').select('*');
      } else if (query.includes('user_ipowners')) {
        return await supabase.from('user_ipowners').select('*');
      }
      throw new Error('Query execution failed');
    });
    
    if (error) throw error;
    return data;
  }

  async checkUserBuyer(email) {
    const { data, error } = await supabase
      .from('user_buyers')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  async checkUserIPOwner(email) {
    const { data, error } = await supabase
      .from('user_ipowners')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  async checkAuthUser(email) {
    // Note: This requires admin access, may not work with anon key
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      this.log('Cannot access auth.users with anon key', 'warning');
      return null;
    }
    
    return data.users.find(user => user.email === email);
  }

  // Cleanup utilities
  async cleanupTestUser(email) {
    this.log(`Cleaning up test user: ${email}`);
    
    try {
      // Clean up user_buyers
      const { error: buyerError } = await supabase
        .from('user_buyers')
        .delete()
        .eq('email', email);
      
      if (buyerError && !buyerError.message.includes('No rows')) {
        this.log(`Buyer cleanup error: ${buyerError.message}`, 'warning');
      }

      // Clean up user_ipowners  
      const { error: ipOwnerError } = await supabase
        .from('user_ipowners')
        .delete()
        .eq('email', email);
      
      if (ipOwnerError && !ipOwnerError.message.includes('No rows')) {
        this.log(`IP Owner cleanup error: ${ipOwnerError.message}`, 'warning');
      }

      this.log(`Cleanup completed for ${email}`, 'success');
    } catch (error) {
      this.log(`Cleanup failed for ${email}: ${error.message}`, 'error');
    }
  }

  async cleanupAllTestUsers() {
    this.log('Cleaning up all test users...');
    
    const testPatterns = ['test%@example.com', 'test+%@%'];
    
    for (const pattern of testPatterns) {
      try {
        await supabase.from('user_buyers').delete().like('email', pattern);
        await supabase.from('user_ipowners').delete().like('email', pattern);
      } catch (error) {
        this.log(`Cleanup pattern ${pattern} failed: ${error.message}`, 'warning');
      }
    }
  }

  // Database state inspection
  async inspectDatabaseState() {
    this.log('Inspecting database state...');
    
    try {
      const { data: buyers } = await supabase.from('user_buyers').select('email, tier, created_at');
      const { data: ipOwners } = await supabase.from('user_ipowners').select('email, invitation_status, created_at');
      
      this.log(`Found ${buyers?.length || 0} buyers in database`);
      this.log(`Found ${ipOwners?.length || 0} IP owners in database`);
      
      return { buyers, ipOwners };
    } catch (error) {
      this.log(`Database inspection failed: ${error.message}`, 'error');
      return null;
    }
  }

  // Test data validation
  validateBuyerData(data, expected = {}) {
    const validations = [];
    
    if (expected.email && data.email !== expected.email) {
      validations.push(`Email mismatch: expected ${expected.email}, got ${data.email}`);
    }
    
    if (expected.tier && data.tier !== expected.tier) {
      validations.push(`Tier mismatch: expected ${expected.tier}, got ${data.tier}`);
    }
    
    if (!data.full_name || data.full_name.trim() === '') {
      validations.push('Full name is missing or empty');
    }
    
    if (!data.buyer_company || data.buyer_company.trim() === '') {
      validations.push('Buyer company is missing or empty');
    }
    
    if (!data.buyer_role || data.buyer_role.trim() === '') {
      validations.push('Buyer role is missing or empty');
    }
    
    if (!data.created_at) {
      validations.push('Created timestamp is missing');
    }
    
    return validations;
  }

  validateIPOwnerData(data, expected = {}) {
    const validations = [];
    
    if (expected.email && data.email !== expected.email) {
      validations.push(`Email mismatch: expected ${expected.email}, got ${data.email}`);
    }
    
    if (expected.invitation_status && data.invitation_status !== expected.invitation_status) {
      validations.push(`Status mismatch: expected ${expected.invitation_status}, got ${data.invitation_status}`);
    }
    
    if (!data.full_name || data.full_name.trim() === '') {
      validations.push('Full name is missing or empty');
    }
    
    if (!data.pen_name || data.pen_name.trim() === '') {
      validations.push('Pen name is missing or empty');
    }
    
    if (!data.created_at) {
      validations.push('Created timestamp is missing');
    }
    
    return validations;
  }

  // Generate test report
  generateReport() {
    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 AUTHENTICATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);
    console.log('='.repeat(60));
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(t => t.status === 'FAIL')
        .forEach(test => {
          console.log(`  ${test.id}: ${test.name}`);
          console.log(`    Error: ${test.error}`);
        });
    }
    
    return {
      total,
      passed,
      failed,
      successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      results: this.testResults
    };
  }
}

// Export for use in other scripts
export { AuthTester, supabase };

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthTester();
  const command = process.argv[2];
  
  switch (command) {
    case 'inspect':
      await tester.inspectDatabaseState();
      break;
      
    case 'cleanup':
      await tester.cleanupAllTestUsers();
      break;
      
    case 'check-buyer':
      if (process.argv[3]) {
        const data = await tester.checkUserBuyer(process.argv[3]);
        console.log('Buyer data:', JSON.stringify(data, null, 2));
      } else {
        console.log('Usage: node test-auth-utils.js check-buyer <email>');
      }
      break;
      
    case 'check-creator':
      if (process.argv[3]) {
        const data = await tester.checkUserIPOwner(process.argv[3]);
        console.log('IP Owner data:', JSON.stringify(data, null, 2));
      } else {
        console.log('Usage: node test-auth-utils.js check-creator <email>');
      }
      break;
      
    default:
      console.log('Available commands:');
      console.log('  inspect     - Inspect current database state');
      console.log('  cleanup     - Clean up all test users');
      console.log('  check-buyer <email>   - Check buyer profile');
      console.log('  check-creator <email> - Check creator profile');
  }
}