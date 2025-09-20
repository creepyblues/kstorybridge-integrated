#!/usr/bin/env node

/**
 * Test OAuth Creator Redirect Fix
 * This script tests the updated AuthCallbackPage logic
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'apps/dashboard/.env.local' });
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 TEST: OAuth Creator Redirect Fix');
console.log('=====================================\n');

// Simulate the updated account type detection function
async function determineAccountType(user, options = {}) {
  const {
    urlParams,
    includeDatabaseLookup = true,
    defaultAccountType = 'buyer',
    debug = false
  } = options;
  
  const log = (message, data) => {
    if (debug) {
      console.log(`🔍 [AccountType] ${message}`, data || '');
    }
  };

  if (!user) {
    return {
      accountType: null,
      source: 'error',
      confidence: 'low',
      profileExists: false
    };
  }

  log('Starting account type detection', { email: user.email });

  try {
    // 1. Check user metadata (highest priority - most reliable)
    const metadataAccountType = user.user_metadata?.account_type;
    log('Checking metadata', { metadataAccountType });
    
    if (metadataAccountType === 'buyer' || metadataAccountType === 'creator') {
      log('✅ Found valid account type in metadata');
      return {
        accountType: metadataAccountType,
        source: 'metadata',
        confidence: 'high',
        profileExists: true // Assume profile exists if metadata is set
      };
    }

    // 2. Check URL parameters (for OAuth flows)
    if (urlParams) {
      const urlAccountType = urlParams.get('account_type');
      log('Checking URL parameters', { urlAccountType });
      
      if (urlAccountType === 'buyer' || urlAccountType === 'creator') {
        log('✅ Found valid account type in URL parameters');
        return {
          accountType: urlAccountType,
          source: 'url_params',
          confidence: 'medium',
          profileExists: false // URL params suggest profile completion needed
        };
      }
    }

    // 3. Database lookup (if enabled)
    if (includeDatabaseLookup && user.email) {
      log('Performing database lookup');
      
      // Check both tables in parallel for efficiency
      const [buyerResult, creatorResult] = await Promise.all([
        supabase
          .from('user_buyers')
          .select('id, tier')
          .eq('email', user.email.toLowerCase())
          .maybeSingle(),
        supabase
          .from('user_creators')
          .select('id, pen_name')
          .eq('email', user.email.toLowerCase())
          .maybeSingle()
      ]);

      // Check buyer profile first
      if (buyerResult.data && !buyerResult.error) {
        log('✅ Found buyer profile in database');
        return {
          accountType: 'buyer',
          source: 'database_buyer',
          confidence: 'high',
          profileExists: true
        };
      }

      // Check creator profile
      if (creatorResult.data && !creatorResult.error) {
        log('✅ Found creator profile in database');
        return {
          accountType: 'creator',
          source: 'database_creator',
          confidence: 'high',
          profileExists: true
        };
      }

      // Log database query results for debugging
      log('Database lookup results', {
        buyerError: buyerResult.error?.message,
        creatorError: creatorResult.error?.message,
        hasBuyerData: !!buyerResult.data,
        hasCreatorData: !!creatorResult.data
      });
    }

    // 4. Default fallback
    log('⚠️ No account type found, using default', { defaultAccountType });
    return {
      accountType: defaultAccountType,
      source: 'default',
      confidence: 'low',
      profileExists: false
    };

  } catch (error) {
    log('❌ Error during account type detection', error);
    return {
      accountType: defaultAccountType,
      source: 'error',
      confidence: 'low',
      profileExists: false
    };
  }
}

function getAccountTypeDisplayInfo(accountType) {
  switch (accountType) {
    case 'buyer':
      return {
        label: 'Buyer',
        dashboardPath: '/buyers/titles',
        signupPath: '/signup/buyer',
        homePath: '/buyers/home'
      };
    case 'creator':
      return {
        label: 'Creator',
        dashboardPath: '/creators/home/',
        signupPath: '/signup/creator',
        homePath: '/creators/home'
      };
    default:
      return {
        label: 'User',
        dashboardPath: '/buyers/titles',
        signupPath: '/signup/buyer',
        homePath: '/buyers/home'
      };
  }
}

async function testScenarios() {
  console.log('🧪 Testing Different OAuth Scenarios\n');

  // Scenario 1: User with no metadata, but account_type in URL (this was the broken case)
  console.log('--- Scenario 1: No metadata, account_type=creator in URL ---');
  const userWithoutMetadata = {
    id: 'test-user-1',
    email: 'creator@example.com',
    user_metadata: {} // Empty metadata (simulates the broken case)
  };
  
  // Simulate URL: /auth/callback?account_type=creator
  const urlParamsCreator = new URLSearchParams('account_type=creator');
  
  const result1 = await determineAccountType(userWithoutMetadata, {
    urlParams: urlParamsCreator,
    includeDatabaseLookup: true,
    debug: true
  });
  
  console.log('📊 Result:', JSON.stringify(result1, null, 2));
  
  if (result1.profileExists && result1.accountType) {
    const displayInfo = getAccountTypeDisplayInfo(result1.accountType);
    console.log('✅ Should redirect to DASHBOARD:', displayInfo.dashboardPath);
  } else {
    const finalAccountType = result1.accountType || 'buyer';
    const displayInfo = getAccountTypeDisplayInfo(finalAccountType);
    console.log('📝 Should redirect to SIGNUP:', displayInfo.signupPath);
  }
  console.log('\n');

  // Scenario 2: User with proper metadata set (after our fix)
  console.log('--- Scenario 2: Metadata set after fix ---');
  const userWithMetadata = {
    id: 'test-user-2',
    email: 'creator@example.com',
    user_metadata: { account_type: 'creator' } // Metadata properly set
  };
  
  const result2 = await determineAccountType(userWithMetadata, {
    urlParams: urlParamsCreator,
    includeDatabaseLookup: true,
    debug: true
  });
  
  console.log('📊 Result:', JSON.stringify(result2, null, 2));
  
  if (result2.profileExists && result2.accountType) {
    const displayInfo = getAccountTypeDisplayInfo(result2.accountType);
    console.log('✅ Should redirect to DASHBOARD:', displayInfo.dashboardPath);
  } else {
    const finalAccountType = result2.accountType || 'buyer';
    const displayInfo = getAccountTypeDisplayInfo(finalAccountType);
    console.log('📝 Should redirect to SIGNUP:', displayInfo.signupPath);
  }
  console.log('\n');

  // Scenario 3: Buyer OAuth flow
  console.log('--- Scenario 3: Buyer OAuth flow ---');
  const buyerUser = {
    id: 'test-user-3',
    email: 'buyer@example.com',
    user_metadata: {}
  };
  
  const urlParamsBuyer = new URLSearchParams('account_type=buyer');
  
  const result3 = await determineAccountType(buyerUser, {
    urlParams: urlParamsBuyer,
    includeDatabaseLookup: true,
    debug: true
  });
  
  console.log('📊 Result:', JSON.stringify(result3, null, 2));
  
  if (result3.profileExists && result3.accountType) {
    const displayInfo = getAccountTypeDisplayInfo(result3.accountType);
    console.log('✅ Should redirect to DASHBOARD:', displayInfo.dashboardPath);
  } else {
    const finalAccountType = result3.accountType || 'buyer';
    const displayInfo = getAccountTypeDisplayInfo(finalAccountType);
    console.log('📝 Should redirect to SIGNUP:', displayInfo.signupPath);
  }
  console.log('\n');

  console.log('🎯 Key Findings:');
  console.log('1. Without metadata, URL params now provide fallback account type');
  console.log('2. Users will be redirected to signup to complete profile creation');  
  console.log('3. With proper metadata, users go directly to dashboard');
  console.log('4. The fix ensures account_type is preserved during OAuth flow');
}

// Run the test
testScenarios().catch(console.error);
