// Simple Supabase test using the existing client to avoid session conflicts
import { supabase } from '@/integrations/supabase/client';

export async function testSimpleQuery() {
  console.log('🧪 SIMPLE TEST: Starting ultra-simple query test...');

  try {
    // Skip session check for now and just try a direct query
    console.log('🧪 SIMPLE TEST: Making direct titles query...');

    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr')
      .limit(5);

    console.log('🧪 SIMPLE TEST: Titles query result:', {
      success: !titlesError,
      titleCount: titles?.length || 0,
      error: titlesError?.message || 'none',
      errorCode: titlesError?.code || 'none'
    });

    if (titlesError) {
      console.error('🧪 SIMPLE TEST: Titles query failed:', titlesError);
      return { titles: [], featured: [], titlesError, featuredError: null };
    }

    if (titles && titles.length > 0) {
      console.log('✅ SIMPLE TEST: Titles query worked! Found', titles.length, 'titles');
      // Don't bother with featured for now, just return titles
      return { titles, featured: [], titlesError: null, featuredError: null };
    }

    console.log('⚠️ SIMPLE TEST: No titles found');
    return { titles: [], featured: [], titlesError: new Error('No titles found'), featuredError: null };

  } catch (error) {
    console.error('🧪 SIMPLE TEST: Unexpected error:', error);
    return { error };
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testSimpleQuery = testSimpleQuery;
}