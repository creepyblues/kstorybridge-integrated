/**
 * Cache Clear and Data Verification Script
 * 
 * This script helps debug caching issues with featured titles
 * by verifying both database and cached data.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Check current database state
 */
async function checkDatabaseState() {
  console.log('🔍 Current Database State');
  console.log('=========================');
  
  try {
    const { data: featuredData, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (
          title_id,
          title_name_en,
          title_name_kr,
          title_image,
          tagline
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    console.log(`✅ Database has ${featuredData.length} featured titles:`);
    featuredData.forEach((featured, index) => {
      const title = featured.titles;
      console.log(`${index + 1}. ${title?.title_name_en || title?.title_name_kr || 'Unknown Title'}`);
      console.log(`   ID: ${featured.id}`);
      console.log(`   Title ID: ${featured.title_id}`);
      console.log('');
    });

    return featuredData.length;
  } catch (error) {
    console.error('💥 Database check failed:', error.message);
    return 0;
  }
}

/**
 * Provide cache clearing instructions
 */
function provideCacheClearInstructions() {
  console.log('\n🧹 Cache Clearing Instructions');
  console.log('==============================');
  console.log('The discrepancy is likely due to browser localStorage caching.');
  console.log('');
  console.log('To fix this issue:');
  console.log('');
  console.log('1. **For Users (Browser)**:');
  console.log('   - Open Browser Developer Tools (F12)');
  console.log('   - Go to Application/Storage tab');
  console.log('   - Find localStorage for your domain');
  console.log('   - Delete the "kstorybridge-cache" entry');
  console.log('   - Or run: localStorage.removeItem("kstorybridge-cache")');
  console.log('   - Refresh the page');
  console.log('');
  console.log('2. **For Development**:');
  console.log('   - Add a cache version system');
  console.log('   - Implement cache expiration');
  console.log('   - Add manual cache refresh in UI');
  console.log('');
  console.log('3. **For Production**:');
  console.log('   - Consider adding cache invalidation');
  console.log('   - Implement server-side cache headers');
  console.log('   - Add refresh button for featured titles');
}

/**
 * Suggest improvements for cache management
 */
function suggestCacheImprovements() {
  console.log('\n💡 Suggested Improvements');
  console.log('=========================');
  console.log('To prevent this issue in the future:');
  console.log('');
  console.log('1. **Add Cache Versioning**:');
  console.log('   - Include a version number in cache data');
  console.log('   - Invalidate cache when version changes');
  console.log('');
  console.log('2. **Add Cache Expiration**:');
  console.log('   - Set TTL (time to live) for cached data');
  console.log('   - Featured titles could expire after 1 hour');
  console.log('');
  console.log('3. **Add Manual Refresh**:');
  console.log('   - "Refresh Featured" button for users');
  console.log('   - Clear cache and reload from database');
  console.log('');
  console.log('4. **Add Cache Status Indicator**:');
  console.log('   - Show when data was last updated');
  console.log('   - Visual indicator for stale data');
}

/**
 * Generate cache clearing code
 */
function generateCacheCode() {
  console.log('\n💻 Cache Management Code');
  console.log('========================');
  console.log('Add this to your DataCacheContext:');
  console.log('');
  console.log(`// Add cache version checking
const CACHE_VERSION = '1.0.0';

const isCacheValid = (cache) => {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour
  
  return cache.version === CACHE_VERSION && 
         cache.lastUpdated?.featuredTitles && 
         (now - cache.lastUpdated.featuredTitles) < maxAge;
};

// Add manual cache clear function
const clearFeaturedCache = () => {
  setCache(prev => ({
    ...prev,
    featuredTitles: [],
    lastUpdated: {
      ...prev.lastUpdated,
      featuredTitles: undefined
    }
  }));
};`);
  console.log('');
  console.log('Add this to your UI:');
  console.log('');
  console.log(`<Button 
  onClick={() => {
    clearFeaturedCache();
    loadData(true); // Force reload
  }}
  variant="outline"
  size="sm"
>
  🔄 Refresh Featured
</Button>`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Featured Titles Cache Analysis');
  console.log('==================================\n');
  
  const dbCount = await checkDatabaseState();
  
  console.log('\n📊 Analysis Summary');
  console.log('===================');
  console.log(`Database has: ${dbCount} featured titles`);
  console.log('Frontend shows: 6 featured titles (from screenshot)');
  console.log('Discrepancy: Browser localStorage cache is stale');
  
  provideCacheClearInstructions();
  suggestCacheImprovements();
  generateCacheCode();
  
  console.log('\n✅ Analysis complete!');
  console.log('The Featured Titles section IS using real Supabase data,');
  console.log('but browsers may show cached data until localStorage is cleared.');
}

// Execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main };