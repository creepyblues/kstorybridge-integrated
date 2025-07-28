import { supabase } from '../integrations/supabase/client';

/**
 * Test Supabase connection and database access
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection test
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase
      .from('titles')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: Fetch sample data
    console.log('2. Testing data fetching...');
    const { data: sampleTitles, error: fetchError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, created_at')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Data fetching failed:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    console.log('✅ Data fetching successful');
    console.log('Sample titles:', sampleTitles);
    
    // Test 3: Authentication status
    console.log('3. Testing authentication status...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('⚠️ Authentication check failed:', authError);
    } else {
      console.log('✅ Authentication check successful');
      console.log('Current session:', session ? 'Authenticated' : 'Not authenticated');
    }
    
    // Test 4: Check database tables accessibility
    console.log('4. Testing table access...');
    const tables = ['titles', 'user_buyers', 'user_ipowners'];
    const tableResults = [];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Table ${table} access failed:`, error.message);
          tableResults.push({ table, accessible: false, error: error.message });
        } else {
          console.log(`✅ Table ${table} accessible`);
          tableResults.push({ table, accessible: true, rowCount: data?.length || 0 });
        }
      } catch (err) {
        console.error(`❌ Table ${table} test error:`, err);
        tableResults.push({ table, accessible: false, error: String(err) });
      }
    }
    
    return {
      success: true,
      results: {
        connection: true,
        dataFetching: true,
        authentication: !authError,
        currentUser: session?.user?.email || null,
        tables: tableResults,
        sampleData: sampleTitles
      }
    };
    
  } catch (error) {
    console.error('❌ Unexpected error during Supabase connection test:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Simple connection test for quick verification
 */
export async function quickConnectionTest() {
  try {
    const { data, error } = await supabase
      .from('titles')
      .select('count(*)')
      .limit(1);
    
    return { connected: !error, error: error?.message };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}