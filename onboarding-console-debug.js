// 🔧 IMMEDIATE ONBOARDING DEBUG SCRIPT
// Copy and paste this into your browser console on dashboard.kstorybridge.com
// This will help us identify why onboarding isn't triggering

console.log('🚀 ONBOARDING DEBUG: Starting comprehensive diagnosis...');

// 1. Check if enhanced onboarding code is loaded
const checkEnhancedCode = () => {
  console.log('\n🔍 Step 1: Checking if enhanced onboarding code is deployed...');

  // Check for debug utilities
  const hasDebugUtils = typeof window.debugOnboarding !== 'undefined';
  const hasManualTrigger = typeof window.forceOnboarding !== 'undefined';

  console.log('📦 Enhanced code status:', {
    debugUtilities: hasDebugUtils,
    manualTrigger: hasManualTrigger,
    verdict: hasDebugUtils || hasManualTrigger ? '✅ Enhanced code is deployed' : '❌ Enhanced code NOT deployed'
  });

  return hasDebugUtils || hasManualTrigger;
};

// 2. Check localStorage for onboarding flags
const checkLocalStorage = () => {
  console.log('\n💾 Step 2: Checking localStorage for onboarding flags...');

  // Get current user ID from auth context
  let userId = null;
  try {
    // Try to get user from various sources
    if (window.supabase && window.supabase.auth) {
      // This is async, so we'll check what we can
      console.log('🔑 Checking auth state...');
    }

    // Check all localStorage keys for onboarding
    const allKeys = Object.keys(localStorage);
    const onboardingKeys = allKeys.filter(key => key.includes('onboarding'));

    console.log('🗄️ LocalStorage analysis:', {
      allOnboardingKeys: onboardingKeys,
      totalKeys: allKeys.length
    });

    onboardingKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`   📝 ${key}: ${value}`);
    });

    return onboardingKeys;

  } catch (error) {
    console.error('❌ Error checking localStorage:', error);
    return [];
  }
};

// 3. Check user account age
const checkAccountAge = async () => {
  console.log('\n📅 Step 3: Checking user account age...');

  try {
    // Try to get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ No authenticated user found');
      return null;
    }

    console.log('👤 Current user:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });

    if (user.created_at) {
      const accountAge = Date.now() - new Date(user.created_at).getTime();
      const ageHours = Math.round(accountAge / (1000 * 60 * 60) * 10) / 10;
      const isNewUser = accountAge < 24 * 60 * 60 * 1000;

      console.log('⏰ Account age analysis:', {
        created: user.created_at,
        ageMilliseconds: accountAge,
        ageHours: ageHours,
        isNewUser: isNewUser,
        threshold: '24 hours'
      });

      return { user, accountAge, isNewUser };
    }

    return { user, accountAge: null, isNewUser: false };

  } catch (error) {
    console.error('❌ Error checking account age:', error);
    return null;
  }
};

// 4. Test manual onboarding triggers
const testManualTriggers = () => {
  console.log('\n🧪 Step 4: Testing manual onboarding triggers...');

  // Check for available trigger functions
  const triggers = {
    forceOnboarding: typeof window.forceOnboarding === 'function',
    resetOnboardingFlag: typeof window.resetOnboardingFlag === 'function',
    debugOnboarding: typeof window.debugOnboarding === 'object'
  };

  console.log('🎛️ Available triggers:', triggers);

  if (triggers.debugOnboarding) {
    console.log('🛠️ Debug utilities available:');
    console.log('   - debugOnboarding.testOnboardingCheck()');
    console.log('   - debugOnboarding.forceShowOnboarding()');
    console.log('   - debugOnboarding.resetOnboarding()');
    console.log('   - debugOnboarding.checkDatabaseConnection()');
  }

  if (triggers.forceOnboarding) {
    console.log('⚡ Manual trigger available: forceOnboarding()');
  }

  if (triggers.resetOnboardingFlag) {
    console.log('🔄 Reset function available: resetOnboardingFlag()');
  }

  return triggers;
};

// 5. Clear onboarding flags for testing
const clearOnboardingFlags = () => {
  console.log('\n🧹 Step 5: Clearing onboarding flags for fresh testing...');

  try {
    const allKeys = Object.keys(localStorage);
    const onboardingKeys = allKeys.filter(key => key.includes('onboarding'));

    onboardingKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed: ${key}`);
    });

    console.log('✅ All onboarding flags cleared');
    console.log('💡 Refresh the page to test automatic onboarding detection');

    return true;
  } catch (error) {
    console.error('❌ Error clearing flags:', error);
    return false;
  }
};

// 6. Force trigger onboarding
const forceOnboarding = () => {
  console.log('\n✨ Step 6: Attempting to force trigger onboarding...');

  // Try various trigger methods
  if (typeof window.forceOnboarding === 'function') {
    console.log('🎯 Using forceOnboarding() function...');
    window.forceOnboarding();
    return true;
  }

  if (window.debugOnboarding && typeof window.debugOnboarding.forceShowOnboarding === 'function') {
    console.log('🎯 Using debugOnboarding.forceShowOnboarding()...');
    window.debugOnboarding.forceShowOnboarding();
    return true;
  }

  // Try dispatching custom event
  try {
    console.log('📡 Dispatching force-show-onboarding event...');
    const event = new CustomEvent('force-show-onboarding');
    window.dispatchEvent(event);
    return true;
  } catch (error) {
    console.error('❌ Error dispatching event:', error);
  }

  console.log('❌ No working trigger methods found');
  return false;
};

// Main diagnostic function
const runFullDiagnosis = async () => {
  console.log('🩺 ONBOARDING DIAGNOSIS: Running full system check...\n');

  const results = {
    enhancedCode: checkEnhancedCode(),
    localStorage: checkLocalStorage(),
    accountAge: await checkAccountAge(),
    manualTriggers: testManualTriggers()
  };

  console.log('\n📊 DIAGNOSIS SUMMARY:');
  console.log('='.repeat(50));

  // Provide recommendations
  if (!results.enhancedCode) {
    console.log('🚨 ISSUE: Enhanced onboarding code not deployed');
    console.log('💡 SOLUTION: Wait for deployment or contact developer');
  } else {
    console.log('✅ Enhanced onboarding code is deployed');
  }

  if (results.localStorage.length > 0) {
    console.log('⚠️ ISSUE: Onboarding flags found in localStorage');
    console.log('💡 SOLUTION: Run clearOnboardingFlags() and refresh page');
  }

  if (results.accountAge && !results.accountAge.isNewUser) {
    console.log('ℹ️ INFO: Account is older than 24 hours (not considered "new")');
    console.log('💡 SOLUTION: Use manual triggers for testing');
  }

  console.log('\n🛠️ QUICK FIXES:');
  console.log('1. clearOnboardingFlags() - Clear localStorage and refresh');
  console.log('2. forceOnboarding() - Force show onboarding modal');
  if (results.manualTriggers.debugOnboarding) {
    console.log('3. debugOnboarding.testOnboardingCheck() - Test full flow');
    console.log('4. debugOnboarding.resetOnboarding() - Reset and refresh');
  }

  return results;
};

// Make functions available globally
window.onboardingDebug = {
  runFullDiagnosis,
  checkEnhancedCode,
  checkLocalStorage,
  checkAccountAge,
  testManualTriggers,
  clearOnboardingFlags,
  forceOnboarding
};

console.log('🎉 ONBOARDING DEBUG LOADED!');
console.log('🚀 Run: onboardingDebug.runFullDiagnosis()');
console.log('⚡ Quick fix: onboardingDebug.clearOnboardingFlags() then refresh');
console.log('🎯 Force test: onboardingDebug.forceOnboarding()');

// Auto-run diagnosis
runFullDiagnosis();