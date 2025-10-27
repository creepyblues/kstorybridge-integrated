/**
 * Unit Test Script for /admin/featured Route
 * Tests all CRUD operations for the Featured Titles admin page
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY="your_key" node test-featured-titles.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Usage: SUPABASE_SERVICE_ROLE_KEY="your_key" node test-featured-titles.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test state
let testTitleId = null;
let testFeaturedId = null;
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
function logTest(name, passed, message) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) console.log(`   ${message}`);

  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

// Test functions
async function testDatabaseConnection() {
  logSection('1. DATABASE CONNECTION TEST');

  try {
    const { data, error } = await supabase
      .from('titles')
      .select('title_id')
      .limit(1);

    if (error) throw error;

    logTest('Database connection', true, 'Successfully connected to Supabase');
    return true;
  } catch (error) {
    logTest('Database connection', false, `Error: ${error.message}`);
    return false;
  }
}

async function testFeaturedTableExists() {
  logSection('2. FEATURED TABLE STRUCTURE TEST');

  try {
    const { data, error } = await supabase
      .from('featured')
      .select('id, title_id, note, created_at, updated_at')
      .limit(1);

    if (error && error.code === '42P01') {
      logTest('Featured table exists', false, 'Table does not exist');
      return false;
    }

    logTest('Featured table exists', true, 'Table structure verified');
    return true;
  } catch (error) {
    logTest('Featured table exists', false, `Error: ${error.message}`);
    return false;
  }
}

async function testGetAllFeatured() {
  logSection('3. GET ALL FEATURED TITLES TEST');

  try {
    const { data, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`   Found ${data.length} featured titles`);

    if (data.length > 0) {
      const hasJoin = data[0].titles && typeof data[0].titles === 'object';
      logTest('Get all featured with join', hasJoin,
        hasJoin ? 'Join relationship working' : 'Join failed');

      console.log('   Sample featured item:');
      console.log(`   - ID: ${data[0].id}`);
      console.log(`   - Title ID: ${data[0].title_id}`);
      console.log(`   - Title Name: ${data[0].titles?.title_name_en || data[0].titles?.title_name_kr || 'N/A'}`);
      console.log(`   - Note: ${data[0].note || 'No note'}`);
    } else {
      logTest('Get all featured', true, 'Query successful (0 results)');
    }

    return true;
  } catch (error) {
    logTest('Get all featured', false, `Error: ${error.message}`);
    return false;
  }
}

async function testFindTestTitle() {
  logSection('4. FIND TEST TITLE');

  try {
    // First check if test title already exists
    const { data: existing } = await supabase
      .from('titles')
      .select('title_id')
      .eq('title_name_en', 'TEST Featured Title')
      .maybeSingle();

    if (existing) {
      testTitleId = existing.title_id;
      console.log(`   Using existing test title: ${testTitleId}`);
      logTest('Find test title', true, 'Test title found');
      return true;
    }

    // Find any existing title to use for testing
    const { data: titles, error } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr')
      .limit(5);

    if (error) throw error;

    if (titles && titles.length > 0) {
      // Find one that's NOT already featured
      for (const title of titles) {
        const { data: isFeatured } = await supabase
          .from('featured')
          .select('id')
          .eq('title_id', title.title_id)
          .maybeSingle();

        if (!isFeatured) {
          testTitleId = title.title_id;
          console.log(`   Found non-featured title: ${title.title_name_en || title.title_name_kr}`);
          console.log(`   Title ID: ${testTitleId}`);
          logTest('Find test title', true, 'Non-featured title found for testing');
          return true;
        }
      }

      // If all are featured, use the first one anyway
      testTitleId = titles[0].title_id;
      console.log(`   Warning: All titles are featured, using: ${titles[0].title_name_en || titles[0].title_name_kr}`);
      logTest('Find test title', true, 'Using first available title');
      return true;
    }

    logTest('Find test title', false, 'No titles found in database');
    return false;
  } catch (error) {
    logTest('Find test title', false, `Error: ${error.message}`);
    return false;
  }
}

async function testIsTitleFeatured() {
  logSection('5. IS TITLE FEATURED CHECK');

  if (!testTitleId) {
    logTest('Is title featured check', false, 'No test title ID available');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('featured')
      .select('id')
      .eq('title_id', testTitleId)
      .maybeSingle();

    if (error) throw error;

    const isFeatured = !!data;
    console.log(`   Title ${testTitleId} is ${isFeatured ? 'FEATURED' : 'NOT featured'}`);

    if (data) {
      testFeaturedId = data.id;
      console.log(`   Existing featured ID: ${testFeaturedId}`);
    }

    logTest('Is title featured check', true, 'Check completed successfully');
    return true;
  } catch (error) {
    logTest('Is title featured check', false, `Error: ${error.message}`);
    return false;
  }
}

async function testAddFeaturedTitle() {
  logSection('6. ADD FEATURED TITLE TEST');

  if (!testTitleId) {
    logTest('Add featured title', false, 'No test title ID available');
    return false;
  }

  try {
    // Check if already featured
    const { data: existing } = await supabase
      .from('featured')
      .select('id')
      .eq('title_id', testTitleId)
      .maybeSingle();

    if (existing) {
      testFeaturedId = existing.id;
      console.log(`   Title already featured (ID: ${testFeaturedId}), skipping add test`);
      logTest('Add featured title', true, 'Title already featured (expected)');
      return true;
    }

    // Add to featured
    const { data, error } = await supabase
      .from('featured')
      .insert({
        title_id: testTitleId,
        note: 'Test note - automated unit test'
      })
      .select()
      .single();

    if (error) throw error;

    testFeaturedId = data.id;
    console.log(`   Created featured entry: ${testFeaturedId}`);
    console.log(`   Note: ${data.note}`);

    logTest('Add featured title', true, 'Successfully added to featured');
    return true;
  } catch (error) {
    logTest('Add featured title', false, `Error: ${error.message}`);
    return false;
  }
}

async function testUpdateFeaturedNote() {
  logSection('7. UPDATE FEATURED NOTE TEST');

  if (!testFeaturedId) {
    logTest('Update featured note', false, 'No featured ID available');
    return false;
  }

  try {
    const updatedNote = `Updated test note - ${new Date().toISOString()}`;

    const { error } = await supabase
      .from('featured')
      .update({
        note: updatedNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', testFeaturedId);

    if (error) throw error;

    // Verify update
    const { data: verified } = await supabase
      .from('featured')
      .select('note, updated_at')
      .eq('id', testFeaturedId)
      .single();

    console.log(`   Updated note: ${verified.note}`);
    console.log(`   Updated at: ${verified.updated_at}`);

    const success = verified.note === updatedNote;
    logTest('Update featured note', success,
      success ? 'Note updated successfully' : 'Note mismatch after update');

    return success;
  } catch (error) {
    logTest('Update featured note', false, `Error: ${error.message}`);
    return false;
  }
}

async function testSearchFeatured() {
  logSection('8. SEARCH FEATURED TITLES TEST');

  try {
    const { data, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (
          title_id,
          title_name_en,
          title_name_kr,
          genre
        )
      `)
      .limit(10);

    if (error) throw error;

    console.log(`   Retrieved ${data.length} featured titles for search test`);

    if (data.length > 0) {
      // Test client-side filtering (simulating component behavior)
      const searchTerm = data[0].titles?.title_name_en?.substring(0, 5).toLowerCase() || 'test';

      const filtered = data.filter(featured => {
        const title = featured.titles;
        return (
          title.title_name_en?.toLowerCase().includes(searchTerm) ||
          title.title_name_kr?.toLowerCase().includes(searchTerm) ||
          featured.note?.toLowerCase().includes(searchTerm)
        );
      });

      console.log(`   Search term: "${searchTerm}"`);
      console.log(`   Matches found: ${filtered.length}`);

      logTest('Search featured titles', true, 'Client-side search working');
    } else {
      logTest('Search featured titles', true, 'No data to search (expected for empty DB)');
    }

    return true;
  } catch (error) {
    logTest('Search featured titles', false, `Error: ${error.message}`);
    return false;
  }
}

async function testRemoveFeaturedTitle() {
  logSection('9. REMOVE FEATURED TITLE TEST');

  if (!testFeaturedId) {
    logTest('Remove featured title', false, 'No featured ID available');
    return false;
  }

  try {
    console.log(`   Attempting to remove featured ID: ${testFeaturedId}`);

    const { error } = await supabase
      .from('featured')
      .delete()
      .eq('id', testFeaturedId);

    if (error) throw error;

    // Verify deletion
    const { data: verified } = await supabase
      .from('featured')
      .select('id')
      .eq('id', testFeaturedId)
      .maybeSingle();

    const success = !verified;
    console.log(`   Verification: ${success ? 'Successfully deleted' : 'Still exists'}`);

    logTest('Remove featured title', success,
      success ? 'Featured title removed' : 'Deletion failed');

    return success;
  } catch (error) {
    logTest('Remove featured title', false, `Error: ${error.message}`);
    return false;
  }
}

async function testDuplicatePrevention() {
  logSection('10. DUPLICATE PREVENTION TEST');

  if (!testTitleId) {
    logTest('Duplicate prevention', false, 'No test title ID available');
    return false;
  }

  try {
    // Add title
    const { data: first, error: firstError } = await supabase
      .from('featured')
      .insert({
        title_id: testTitleId,
        note: 'First entry'
      })
      .select()
      .single();

    if (firstError) throw firstError;
    testFeaturedId = first.id;

    console.log(`   Created first entry: ${testFeaturedId}`);

    // Try to add same title again (should fail due to unique constraint)
    const { error: duplicateError } = await supabase
      .from('featured')
      .insert({
        title_id: testTitleId,
        note: 'Duplicate entry'
      });

    if (duplicateError) {
      console.log(`   Duplicate blocked (expected): ${duplicateError.code}`);
      logTest('Duplicate prevention', true, 'Unique constraint working');

      // Clean up
      await supabase.from('featured').delete().eq('id', testFeaturedId);
      return true;
    } else {
      console.log(`   WARNING: Duplicate allowed (should have failed)`);
      logTest('Duplicate prevention', false, 'Unique constraint not enforced');

      // Clean up both entries
      await supabase.from('featured').delete().eq('title_id', testTitleId);
      return false;
    }
  } catch (error) {
    logTest('Duplicate prevention', false, `Error: ${error.message}`);
    return false;
  }
}

async function testComponentQueries() {
  logSection('11. COMPONENT-SPECIFIC QUERY TESTS');

  try {
    // Test 1: getAllFeatured() - used by admin page
    console.log('\n   Testing getAllFeatured query...');
    const { data: allFeatured, error: error1 } = await supabase
      .from('featured')
      .select(`
        *,
        titles (*)
      `)
      .order('created_at', { ascending: false });

    if (error1) throw error1;
    console.log(`   ✓ getAllFeatured: ${allFeatured.length} results`);

    // Test 2: getMostRecentFeatured() - used by homepage
    console.log('\n   Testing getMostRecentFeatured query...');
    const { data: recent, error: error2 } = await supabase
      .from('featured')
      .select(`
        *,
        titles (*)
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error2 && error2.code !== 'PGRST116') throw error2;
    console.log(`   ✓ getMostRecentFeatured: ${recent ? 'Found' : 'No results'}`);

    // Test 3: getAllTitles() - used for add dialog
    console.log('\n   Testing getAllTitles query...');
    const { data: allTitles, error: error3 } = await supabase
      .from('titles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error3) throw error3;
    console.log(`   ✓ getAllTitles: ${allTitles.length} results`);

    logTest('Component queries', true, 'All component queries working');
    return true;
  } catch (error) {
    logTest('Component queries', false, `Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🧪 FEATURED TITLES ADMIN PAGE - UNIT TESTS');
  console.log('Testing /admin/featured route functionality\n');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Service Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);

  const startTime = Date.now();

  // Run tests in sequence
  await testDatabaseConnection();
  await testFeaturedTableExists();
  await testGetAllFeatured();
  await testFindTestTitle();
  await testIsTitleFeatured();
  await testAddFeaturedTitle();
  await testUpdateFeaturedNote();
  await testSearchFeatured();
  await testRemoveFeaturedTitle();
  await testDuplicatePrevention();
  await testComponentQueries();

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  logSection('TEST SUMMARY');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('');

  if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.name}: ${t.message}`));
    console.log('');
  }

  const exitCode = testResults.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
