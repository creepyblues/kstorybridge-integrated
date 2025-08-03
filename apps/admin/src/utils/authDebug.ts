/**
 * Admin authentication debugging utilities
 * Use these functions in browser console to debug auth issues
 */

export const authDebugUtils = {
  // Check current authentication state
  checkAuthState: () => {
    const adminAuth = (window as any).adminAuth;
    if (!adminAuth) {
      console.log('❌ Admin auth context not found');
      return;
    }

    console.log('🔍 Admin Auth State:');
    console.log('   User:', adminAuth.user?.email || 'None');
    console.log('   Admin Profile:', adminAuth.adminProfile?.full_name || 'None');
    console.log('   Session:', adminAuth.session ? 'Active' : 'None');
    console.log('   Loading:', adminAuth.isLoading);
    console.log('   Error:', adminAuth.error || 'None');
  },

  // Check localStorage for conflicts
  checkStorageConflicts: () => {
    console.log('🔍 Storage Analysis:');
    
    const keys = Object.keys(localStorage);
    const supabaseKeys = keys.filter(key => key.includes('supabase') || key.startsWith('sb-'));
    const adminKeys = keys.filter(key => key.startsWith('admin-'));
    
    console.log('   Total localStorage keys:', keys.length);
    console.log('   Supabase-related keys:', supabaseKeys.length);
    console.log('   Admin-specific keys:', adminKeys.length);
    
    console.log('\n📦 Supabase Keys:');
    supabaseKeys.forEach(key => {
      const value = localStorage.getItem(key);
      const hasEmail = value?.includes('@');
      console.log(`   ${key}: ${hasEmail ? 'Contains session data' : 'Other data'}`);
    });
    
    console.log('\n🔐 Admin Keys:');
    adminKeys.forEach(key => {
      console.log(`   ${key}: Present`);
    });
    
    // Check for conflicts
    const regularSupabaseAuth = keys.find(key => 
      key.startsWith('sb-dlrnrgcoguxlkkcitlpd-auth-token') && !key.startsWith('admin-')
    );
    
    if (regularSupabaseAuth) {
      console.log('\n⚠️  POTENTIAL CONFLICT:');
      console.log('   Regular Supabase auth token found:', regularSupabaseAuth);
      console.log('   This may conflict with admin authentication');
    }
  },

  // Clear all conflicting storage
  clearConflictingStorage: () => {
    console.log('🧹 Clearing conflicting storage...');
    
    const keys = Object.keys(localStorage);
    let cleared = 0;
    
    // Clear non-admin Supabase keys
    keys.forEach(key => {
      if ((key.includes('supabase') || key.startsWith('sb-')) && !key.startsWith('admin-')) {
        localStorage.removeItem(key);
        cleared++;
        console.log(`   Removed: ${key}`);
      }
    });
    
    console.log(`✅ Cleared ${cleared} conflicting keys`);
    console.log('   Please refresh the page to test clean admin auth');
  },

  // Test admin auth functionality
  testAuth: async () => {
    const adminAuth = (window as any).adminAuth;
    if (!adminAuth) {
      console.log('❌ Admin auth not available');
      return;
    }

    console.log('🧪 Testing auth functionality...');
    
    try {
      await adminAuth.refreshAuth();
      console.log('✅ Auth refresh successful');
    } catch (error) {
      console.log('❌ Auth refresh failed:', error);
    }
  },

  // Monitor auth state changes
  monitorAuth: (duration = 60000) => {
    console.log(`📊 Monitoring auth state for ${duration / 1000} seconds...`);
    
    const adminAuth = (window as any).adminAuth;
    if (!adminAuth) {
      console.log('❌ Admin auth not available');
      return;
    }

    let lastState = JSON.stringify({
      user: adminAuth.user?.email,
      profile: adminAuth.adminProfile?.id,
      loading: adminAuth.isLoading,
      error: adminAuth.error
    });

    const interval = setInterval(() => {
      const currentState = JSON.stringify({
        user: adminAuth.user?.email,
        profile: adminAuth.adminProfile?.id,
        loading: adminAuth.isLoading,
        error: adminAuth.error
      });

      if (currentState !== lastState) {
        console.log('🔄 Auth state changed:');
        console.log('   User:', adminAuth.user?.email || 'None');
        console.log('   Profile:', adminAuth.adminProfile?.full_name || 'None');
        console.log('   Loading:', adminAuth.isLoading);
        console.log('   Error:', adminAuth.error || 'None');
        lastState = currentState;
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      console.log('📊 Monitoring complete');
    }, duration);

    return () => clearInterval(interval);
  }
};

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).authDebug = authDebugUtils;
  console.log('🛠️  Auth Debug Utils Available:');
  console.log('   authDebug.checkAuthState() - Check current auth state');
  console.log('   authDebug.checkStorageConflicts() - Analyze storage conflicts');
  console.log('   authDebug.clearConflictingStorage() - Clear conflicting data');
  console.log('   authDebug.testAuth() - Test auth functionality');
  console.log('   authDebug.monitorAuth() - Monitor state changes');
}