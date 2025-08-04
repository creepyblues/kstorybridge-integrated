import { supabase } from '@/integrations/supabase/client';

export const testRequestTable = async () => {
  console.log('=== Testing Request Table ===');
  
  try {
    // Test 1: Check if table exists by trying to select from it
    console.log('Test 1: Checking if request table exists...');
    const { data, error } = await supabase
      .from('request')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error accessing request table:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === '42P01') {
        console.log('❌ Request table does not exist - migration needs to be applied');
      } else {
        console.log('❌ Request table exists but has permission/access issues');
      }
      return false;
    } else {
      console.log('✅ Request table exists and is accessible');
      console.log('Sample data:', data);
      return true;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
};

export const testRequestInsert = async (userId: string, titleId: string, type: string) => {
  console.log('=== Testing Request Insert ===');
  console.log('Test data:', { userId, titleId, type });
  
  try {
    const { data, error } = await supabase
      .from('request')
      .insert({
        user_id: userId,
        title_id: titleId,
        type: type
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Insert failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return { success: false, error };
    } else {
      console.log('✅ Insert successful:', data);
      return { success: true, data };
    }
  } catch (error) {
    console.error('Unexpected error during insert:', error);
    return { success: false, error };
  }
};

export const debugAuthAndRLS = async () => {
  console.log('=== Testing Auth and RLS ===');
  
  try {
    // Check current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current user:', user);
    console.log('Auth error:', authError);
    
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }
    
    // Test with current user's ID
    console.log('Testing insert with current user ID:', user.id);
    
    // Try a simple insert with minimal data
    const { data, error } = await supabase
      .from('request')
      .insert({
        user_id: user.id,
        title_id: '123e4567-e89b-12d3-a456-426614174000', // Dummy UUID
        type: 'test'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('RLS Test failed:', error);
      
      if (error.code === '42501') {
        console.log('🚨 RLS Policy is blocking the insert');
        console.log('Possible solutions:');
        console.log('1. Check if auth.uid() returns the correct user ID');
        console.log('2. Apply the RLS fix migration');
        console.log('3. Temporarily disable RLS for testing');
      }
    } else {
      console.log('✅ RLS Test passed:', data);
      
      // Clean up test record
      await supabase
        .from('request')
        .delete()
        .eq('id', data.id);
      console.log('Test record cleaned up');
    }
    
  } catch (error) {
    console.error('Unexpected error in RLS test:', error);
  }
};

// Add this to window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testRequestTable = testRequestTable;
  (window as any).testRequestInsert = testRequestInsert;
  (window as any).debugAuthAndRLS = debugAuthAndRLS;
}