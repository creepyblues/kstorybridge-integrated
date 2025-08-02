// Debug script for admin authentication issues
// Run this in the browser console while on the admin page

async function debugAdminAuth() {
  console.log('🔍 Debugging admin authentication...');
  
  // Check if supabase client is available
  if (typeof window.supabase === 'undefined') {
    console.log('❌ Supabase client not available in window');
    return;
  }
  
  const supabase = window.supabase;
  
  // 1. Check current session
  console.log('1. Checking current session...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Session:', session);
  console.log('Session error:', sessionError);
  
  if (!session) {
    console.log('❌ No active session found');
    return;
  }
  
  console.log('✅ User is authenticated:', session.user.email);
  
  // 2. Test admin table query directly
  console.log('2. Testing admin table query...');
  const { data: adminData, error: adminError } = await supabase
    .from('admin')
    .select('*')
    .eq('email', session.user.email)
    .eq('active', true);
    
  console.log('Admin query result:', { data: adminData, error: adminError });
  
  if (adminError) {
    console.log('❌ Admin query failed:', adminError);
    
    // Check specific error codes
    if (adminError.code === 'PGRST116') {
      console.log('📝 Error: No admin record found for this email');
      console.log('💡 Solution: Add admin record to database');
    } else if (adminError.code === '42501') {
      console.log('📝 Error: Permission denied (RLS policy issue)');
      console.log('💡 Solution: Fix RLS policies on admin table');
    } else {
      console.log('📝 Error: Unknown database error');
      console.log('💡 Solution: Check database connection and table existence');
    }
  } else if (!adminData || adminData.length === 0) {
    console.log('❌ No admin record found for email:', session.user.email);
    console.log('💡 Solution: Insert admin record in database:');
    console.log(`INSERT INTO public.admin (email, full_name, active) VALUES ('${session.user.email}', 'Admin User', true);`);
  } else {
    console.log('✅ Admin record found:', adminData[0]);
    console.log('🤔 Authentication should work. Check useAdminAuth hook logic.');
  }
  
  // 3. Test basic table access
  console.log('3. Testing basic table access...');
  const { data: testData, error: testError } = await supabase
    .from('admin')
    .select('count')
    .limit(1);
    
  console.log('Basic access test:', { data: testData, error: testError });
  
  // 4. Check RLS policies
  console.log('4. Checking RLS policies...');
  const { data: policyData, error: policyError } = await supabase
    .rpc('get_table_policies', { table_name: 'admin' })
    .catch(() => ({ data: null, error: 'Function not available' }));
    
  console.log('Policy check:', { data: policyData, error: policyError });
  
  console.log('🔍 Debug complete. Check the logs above for issues.');
}

// Auto-run the debug function
debugAdminAuth().catch(console.error);

// Also make it available globally for manual execution
window.debugAdminAuth = debugAdminAuth;
console.log('💡 Run debugAdminAuth() to debug admin authentication issues');