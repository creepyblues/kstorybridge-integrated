#!/usr/bin/env node

/**
 * Debug OAuth Creator Redirect Issue
 * This script simulates the AuthCallbackPage logic to debug redirect behavior
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'apps/dashboard/.env.local' });
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 DEBUG: OAuth Creator Redirect Issue Analysis');
console.log('==========================================\n');

// Simulate the account type detection function
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
    
    if (metadataAccountType === 'buyer' || metadataAccountType === 'ip_owner') {
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
      
      if (urlAccountType === 'buyer' || urlAccountType === 'ip_owner') {
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
          accountType: 'ip_owner',
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
    case 'ip_owner':
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

// Simulate the user data from your debug output
const simulatedUser = {
  id: 'simulated-user-id',
  email: 'sungho101@gmail.com',
  user_metadata: {
    account_type: 'ip_owner',
    email: 'sungho101@gmail.com',
    full_name: 'Sungho Lee',
    ip_owner_company: 'dadble',
    ip_owner_role: 'author',
    provider_id: '85c3-40ac-8e0c-224e48709e95'
  }
};

async function debugAuthCallbackLogic() {
  console.log('👤 Simulated User Data:');
  console.log(JSON.stringify(simulatedUser, null, 2));
  console.log('\n');

  // Simulate the AuthCallbackPage logic
  const urlParams = new URLSearchParams(''); // Empty for OAuth callback
  
  console.log('🔄 Running account type detection...');
  const accountTypeResult = await determineAccountType(simulatedUser, {
    urlParams,
    includeDatabaseLookup: true,
    debug: true
  });

  console.log('\n📊 Account Type Detection Result:');
  console.log(JSON.stringify(accountTypeResult, null, 2));

  const { accountType, profileExists, source, confidence } = accountTypeResult;
  
  console.log('\n🚦 AuthCallbackPage Decision Logic:');
  console.log(`profileExists: ${profileExists}`);
  console.log(`accountType: ${accountType}`);
  
  if (profileExists && accountType) {
    // User has a profile, redirect to appropriate dashboard
    const displayInfo = getAccountTypeDisplayInfo(accountType);
    console.log('✅ Should redirect to DASHBOARD:', displayInfo.dashboardPath);
    console.log('   Dashboard path:', displayInfo.dashboardPath);
  } else {
    // No profile found, need to complete signup
    console.log('📝 Should redirect to SIGNUP');
    
    const finalAccountType = accountType || 'buyer';
    const displayInfo = getAccountTypeDisplayInfo(finalAccountType);
    
    console.log('   Signup path:', displayInfo.signupPath);
  }

  console.log('\n🎯 Expected vs Actual:');
  console.log('Expected: Should go to /creators/home/ (dashboard)');
  console.log('Actual: User reports going to /signup/buyer');
  
  console.log('\n🔍 Possible Issues:');
  console.log('1. Profile detection might be failing in real scenario');
  console.log('2. Route protection might be redirecting after initial navigation');
  console.log('3. There might be another redirect happening after AuthCallback');
  console.log('4. The debug info might be from a different request/session');
}

// Run the debug
debugAuthCallbackLogic().catch(console.error);