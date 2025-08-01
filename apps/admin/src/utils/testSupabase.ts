import { supabase } from '@/integrations/supabase/client';

// Test function to verify Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase.from('titles').select('count').limit(1);
    console.log('Supabase connection test:', { data, error });
    
    // Test 2: Check if admin table exists and is accessible
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('email')
      .limit(1);
    console.log('Admin table test:', { adminData, adminError });
    
    return { success: !error && !adminError };
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    return { success: false, error: err };
  }
}

// Test function to check if a specific email exists in admin table
export async function testAdminEmailExists(email: string) {
  try {
    console.log(`Testing if admin email exists: ${email}`);
    
    const { data, error } = await supabase
      .from('admin')
      .select('*')
      .eq('email', email);
    
    console.log('Admin email test result:', { data, error });
    
    return { exists: data && data.length > 0, data, error };
  } catch (err) {
    console.error('Admin email test failed:', err);
    return { exists: false, error: err };
  }
}