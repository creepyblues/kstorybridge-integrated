// Debug script for admin authentication - run in browser console
// Navigate to http://localhost:8083/ and open browser console, then paste this script

async function debugAdminAuth() {
  console.log('🔍 Debugging Admin Authentication...');
  
  // Check if we're on the right page
  console.log('1. Current URL:', window.location.href);
  
  // Check if Supabase client is available
  if (typeof window !== 'undefined' && window.supabase) {
    console.log('2. ✅ Supabase client found');
  } else {
    console.log('2. ❌ Supabase client not found');
    console.log('   Try accessing the client through the React app context');
  }
  
  // Test authentication status
  try {
    // This will only work if we can access the Supabase client
    console.log('3. Checking current session...');
    
    // If admin auth context is available
    if (window.React && window.React.useContext) {
      console.log('   React context available - check admin auth state');
    }
    
    // Check localStorage for session
    const supabaseSession = localStorage.getItem('sb-dlrnrgcoguxlkkcitlpd-auth-token');
    if (supabaseSession) {
      console.log('   ✅ Session found in localStorage');
      try {
        const sessionData = JSON.parse(supabaseSession);
        console.log('   Session user email:', sessionData.user?.email);
        console.log('   Session expires at:', new Date(sessionData.expires_at * 1000));
      } catch (e) {
        console.log('   ❌ Error parsing session data:', e);
      }
    } else {
      console.log('   ❌ No session in localStorage');
    }
    
  } catch (error) {
    console.log('3. ❌ Error checking session:', error);
  }
  
  console.log('\n4. 💡 Debug Steps:');
  console.log('   a) Check if admin record exists for sungho@dadble.com');
  console.log('   b) Verify RLS policies on admin table');
  console.log('   c) Test authentication with valid credentials');
  console.log('   d) Check network connectivity to Supabase');
  
  console.log('\n5. 🛠️ Quick Fixes:');
  console.log('   • Run fix-admin-access.sql in Supabase SQL editor');
  console.log('   • Clear localStorage and try fresh login');
  console.log('   • Check Supabase project settings and API keys');
  
  // Test manual admin record check (if we can access supabase client)
  console.log('\n6. 🧪 Testing admin table access...');
  console.log('   (This requires valid authentication first)');
}

// Test localStorage session
function checkStoredSession() {
  const keys = Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth'));
  console.log('📦 Auth-related localStorage keys:', keys);
  
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value && value.includes('email')) {
        console.log(`${key}:`, JSON.parse(value));
      }
    } catch (e) {
      console.log(`${key}: (unable to parse)`);
    }
  });
}

// Clear all auth data
function clearAuthData() {
  console.log('🧹 Clearing authentication data...');
  const keys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('auth') || key.includes('sb-')
  );
  
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`   Removed: ${key}`);
  });
  
  console.log('✅ Auth data cleared. Refresh page and try login again.');
}

// Run the debug
debugAdminAuth();

// Make functions available globally
window.debugAdminAuth = debugAdminAuth;
window.checkStoredSession = checkStoredSession;
window.clearAuthData = clearAuthData;

console.log('\n🛠️ Functions available:');
console.log('   debugAdminAuth() - Run full debug');
console.log('   checkStoredSession() - Check localStorage');
console.log('   clearAuthData() - Clear auth and refresh');