import { supabase } from '@/integrations/supabase/client';

// Check if a user has admin access - only call this for authenticated users
export async function checkAdminAccess(email: string) {
  try {
    console.log('Checking admin access for authenticated user:', email);
    
    const { data, error } = await supabase
      .from('admin')
      .select('*')
      .eq('email', email)
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No admin record found
        return { hasAccess: false, profile: null, error: 'Not an admin user' };
      } else {
        // Database error
        console.error('Admin check failed:', error);
        return { hasAccess: false, profile: null, error: error.message };
      }
    }

    return { hasAccess: true, profile: data, error: null };
  } catch (error) {
    console.error('Admin check exception:', error);
    return { hasAccess: false, profile: null, error: String(error) };
  }
}

// Simple check to see if admin table is accessible (for authenticated users only)
export async function testAdminTableAccess() {
  try {
    const { error } = await supabase
      .from('admin')
      .select('email')
      .limit(1);
      
    return { accessible: !error, error: error?.message || null };
  } catch (error) {
    return { accessible: false, error: String(error) };
  }
}