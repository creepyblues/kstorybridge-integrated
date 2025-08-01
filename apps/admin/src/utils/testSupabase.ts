import { supabase } from '@/integrations/supabase/client';

// Test function to verify Supabase connection with retry logic
export async function testSupabaseConnection(retryCount = 0) {
  try {
    console.log('Testing Supabase connection...', 'attempt:', retryCount + 1);
    
    // Test 1: Use the dedicated test function if available
    try {
      const { data: testResult, error: testError } = await supabase
        .rpc('test_admin_connectivity');
      
      if (!testError && testResult) {
        console.log('Connectivity test result:', testResult);
        return { 
          success: testResult.admin_table_accessible && testResult.titles_table_accessible,
          details: testResult
        };
      }
    } catch (rpcError) {
      console.log('RPC test function not available, falling back to direct queries');
    }
    
    // Test 2: Fallback to direct table queries
    const { data: titleData, error: titleError } = await supabase
      .from('titles')
      .select('title_id')
      .limit(1);
    console.log('Titles table test:', { data: titleData, error: titleError });
    
    // Test 3: Check if admin table exists and is accessible
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('email')
      .limit(1);
    console.log('Admin table test:', { data: adminData, error: adminError });
    
    // Retry on 401 errors
    if ((titleError?.message?.includes('401') || adminError?.message?.includes('401')) && retryCount < 2) {
      console.log('Received 401 error, retrying connection test...', retryCount + 1);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return testSupabaseConnection(retryCount + 1);
    }
    
    const success = !titleError && !adminError;
    
    return { 
      success,
      details: {
        titles_accessible: !titleError,
        admin_accessible: !adminError,
        title_error: titleError,
        admin_error: adminError
      }
    };
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    if (retryCount < 2) {
      console.log('Retrying connection test due to error, attempt:', retryCount + 1);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return testSupabaseConnection(retryCount + 1);
    }
    return { success: false, error: err };
  }
}

// Test function to check if a specific email exists in admin table with retry logic
export async function testAdminEmailExists(email: string, retryCount = 0) {
  try {
    console.log(`Testing if admin email exists: ${email}`, 'attempt:', retryCount + 1);
    
    const { data, error } = await supabase
      .from('admin')
      .select('*')
      .eq('email', email);
    
    console.log('Admin email test result:', { data, error });
    
    // Retry on 401 errors
    if (error?.message?.includes('401') && retryCount < 2) {
      console.log('Received 401 error, retrying admin email check...', retryCount + 1);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return testAdminEmailExists(email, retryCount + 1);
    }
    
    return { exists: data && data.length > 0, data, error };
  } catch (err) {
    console.error('Admin email test failed:', err);
    if (retryCount < 2) {
      console.log('Retrying admin email check due to error, attempt:', retryCount + 1);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return testAdminEmailExists(email, retryCount + 1);
    }
    return { exists: false, error: err };
  }
}