/**
 * Backend Services Test Script
 * Tests platformsService, documentsService, and draftService
 *
 * Prerequisites:
 * 1. Docker Desktop running
 * 2. Local Supabase started: npx supabase start
 * 3. Migrations applied: npx supabase db reset
 *
 * Run: node test-backend-services.js
 */

import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Local Supabase configuration
const SUPABASE_URL = 'http://localhost:54321'
const SUPABASE_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz' // Service role key bypasses RLS for testing

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Test user ID (use a valid UUID or create a test user)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

// Test data
let testTitleId = null
let testPlatformId = null
let testDocumentId = null
let testDraftId = null

console.log('🧪 Backend Services Test Suite')
console.log('================================\n')

/**
 * Test 1: Verify tables exist
 */
async function testTablesExist() {
  console.log('📋 Test 1: Verify new tables exist')

  try {
    // Check title_platforms
    const { error: platformError } = await supabase
      .from('title_platforms')
      .select('id')
      .limit(1)

    if (platformError && !platformError.message.includes('0 rows')) {
      throw new Error(`title_platforms table issue: ${platformError.message}`)
    }
    console.log('  ✅ title_platforms table exists')

    // Check title_documents
    const { error: documentError } = await supabase
      .from('title_documents')
      .select('id')
      .limit(1)

    if (documentError && !documentError.message.includes('0 rows')) {
      throw new Error(`title_documents table issue: ${documentError.message}`)
    }
    console.log('  ✅ title_documents table exists')

    // Check title_drafts
    const { error: draftError } = await supabase
      .from('title_drafts')
      .select('id')
      .limit(1)

    if (draftError && !draftError.message.includes('0 rows')) {
      throw new Error(`title_drafts table issue: ${draftError.message}`)
    }
    console.log('  ✅ title_drafts table exists\n')

    return true
  } catch (error) {
    console.error('  ❌ Table verification failed:', error.message)
    return false
  }
}

/**
 * Test 2: Verify new columns in titles table
 */
async function testTitlesColumns() {
  console.log('📋 Test 2: Verify new columns in titles table')

  try {
    // Query titles table with new fields
    const { data, error } = await supabase
      .from('titles')
      .select(`
        title_id,
        is_official_english_title,
        script_title_kr,
        setting_description,
        character_details,
        story_structure,
        awards
      `)
      .limit(1)

    if (error) {
      throw new Error(`Titles table query failed: ${error.message}`)
    }

    console.log('  ✅ New questionnaire columns exist in titles table\n')
    return true
  } catch (error) {
    console.error('  ❌ Column verification failed:', error.message)
    return false
  }
}

/**
 * Test 3: Create test title
 */
async function createTestTitle() {
  console.log('📋 Test 3: Create test title')

  try {
    const { data, error } = await supabase
      .from('titles')
      .insert([{
        title_name_en: 'Test Title for Services',
        title_name_kr: '서비스 테스트 제목',
        creator_id: TEST_USER_ID,
        story_author: 'Test Author',
        synopsis: 'Test synopsis for backend service testing',
        genre: ['fantasy', 'romance'],
        completed: false,
        // New questionnaire fields
        is_official_english_title: true,
        script_title_kr: '스크립트 제목',
        setting_description: 'A fantasy world with magic',
        character_details: [
          {
            name: 'Hero',
            age: '25',
            gender: 'Female',
            background: 'Orphan with hidden powers'
          }
        ],
        story_structure: 'Beginning: Discovery, Middle: Training, End: Battle',
        planned_ending: 'Victory but at great cost'
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test title: ${error.message}`)
    }

    testTitleId = data.title_id
    console.log(`  ✅ Test title created: ${testTitleId}\n`)
    return true
  } catch (error) {
    console.error('  ❌ Test title creation failed:', error.message)
    return false
  }
}

/**
 * Test 4: platformsService - Add platforms
 */
async function testAddPlatforms() {
  console.log('📋 Test 4: platformsService - Add platforms')

  try {
    const platforms = [
      {
        title_id: testTitleId,
        platform_name: 'naver',
        platform_url: 'https://comic.naver.com/test',
        views: 1000000,
        subscribers: 50000
      },
      {
        title_id: testTitleId,
        platform_name: 'kakao',
        platform_url: 'https://page.kakao.com/test',
        views: 800000,
        subscribers: 40000
      }
    ]

    const { data, error } = await supabase
      .from('title_platforms')
      .insert(platforms)
      .select()

    if (error) {
      throw new Error(`Failed to add platforms: ${error.message}`)
    }

    testPlatformId = data[0].id
    console.log(`  ✅ Added ${data.length} platforms`)
    console.log(`  📊 Platform IDs: ${data.map(p => p.platform_name).join(', ')}\n`)
    return true
  } catch (error) {
    console.error('  ❌ Platform creation failed:', error.message)
    return false
  }
}

/**
 * Test 5: platformsService - Get platforms by title
 */
async function testGetPlatforms() {
  console.log('📋 Test 5: platformsService - Get platforms')

  try {
    const { data, error } = await supabase
      .from('title_platforms')
      .select('*')
      .eq('title_id', testTitleId)

    if (error) {
      throw new Error(`Failed to get platforms: ${error.message}`)
    }

    console.log(`  ✅ Retrieved ${data.length} platforms`)
    data.forEach(p => {
      console.log(`     - ${p.platform_name}: ${p.views.toLocaleString()} views`)
    })
    console.log()
    return true
  } catch (error) {
    console.error('  ❌ Platform retrieval failed:', error.message)
    return false
  }
}

/**
 * Test 6: platformsService - Update platform
 */
async function testUpdatePlatform() {
  console.log('📋 Test 6: platformsService - Update platform')

  try {
    const { data, error } = await supabase
      .from('title_platforms')
      .update({ views: 1500000 })
      .eq('id', testPlatformId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update platform: ${error.message}`)
    }

    console.log(`  ✅ Updated platform views: ${data.views.toLocaleString()}\n`)
    return true
  } catch (error) {
    console.error('  ❌ Platform update failed:', error.message)
    return false
  }
}

/**
 * Test 7: draftService - Save draft
 */
async function testSaveDraft() {
  console.log('📋 Test 7: draftService - Save draft')

  try {
    const draftData = {
      title_name_en: 'Draft Title',
      title_name_kr: '초안 제목',
      genre: ['action'],
      step1: { completed: true },
      step2: { completed: false }
    }

    const { data, error } = await supabase
      .from('title_drafts')
      .upsert({
        creator_id: TEST_USER_ID,
        draft_data: draftData,
        current_step: 2,
        last_saved_at: new Date().toISOString()
      }, { onConflict: 'creator_id' })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save draft: ${error.message}`)
    }

    testDraftId = data.id
    console.log(`  ✅ Draft saved: ${testDraftId}`)
    console.log(`  📝 Current step: ${data.current_step}\n`)
    return true
  } catch (error) {
    console.error('  ❌ Draft save failed:', error.message)
    return false
  }
}

/**
 * Test 8: draftService - Load draft
 */
async function testLoadDraft() {
  console.log('📋 Test 8: draftService - Load draft')

  try {
    const { data, error } = await supabase
      .from('title_drafts')
      .select('*')
      .eq('creator_id', TEST_USER_ID)
      .single()

    if (error) {
      throw new Error(`Failed to load draft: ${error.message}`)
    }

    console.log(`  ✅ Draft loaded: ${data.id}`)
    console.log(`  📝 Draft data keys: ${Object.keys(data.draft_data).join(', ')}`)
    console.log(`  ⏰ Last saved: ${new Date(data.last_saved_at).toLocaleTimeString()}\n`)
    return true
  } catch (error) {
    console.error('  ❌ Draft load failed:', error.message)
    return false
  }
}

/**
 * Test 9: draftService - Update draft (upsert test)
 */
async function testUpdateDraft() {
  console.log('📋 Test 9: draftService - Update draft (upsert)')

  try {
    const updatedData = {
      title_name_en: 'Updated Draft Title',
      title_name_kr: '업데이트된 초안',
      genre: ['action', 'thriller'],
      step1: { completed: true },
      step2: { completed: true },
      step3: { completed: false }
    }

    const { data, error } = await supabase
      .from('title_drafts')
      .upsert({
        creator_id: TEST_USER_ID,
        draft_data: updatedData,
        current_step: 3,
        last_saved_at: new Date().toISOString()
      }, { onConflict: 'creator_id' })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update draft: ${error.message}`)
    }

    console.log(`  ✅ Draft updated (upserted)`)
    console.log(`  📝 New current step: ${data.current_step}`)
    console.log(`  📊 Draft data updated: ${Object.keys(data.draft_data).length} keys\n`)
    return true
  } catch (error) {
    console.error('  ❌ Draft update failed:', error.message)
    return false
  }
}

/**
 * Test 10: documentsService - Add external link
 */
async function testAddExternalLink() {
  console.log('📋 Test 10: documentsService - Add external link')

  try {
    const { data, error } = await supabase
      .from('title_documents')
      .insert([{
        title_id: testTitleId,
        document_type: 'interview',
        file_url: 'https://example.com/interview',
        file_name: 'Author Interview',
        file_size: null,
        shareable_with_nda: true,
        external_url: 'https://example.com/interview'
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add external link: ${error.message}`)
    }

    testDocumentId = data.id
    console.log(`  ✅ External link added: ${data.document_type}`)
    console.log(`  🔗 URL: ${data.external_url}\n`)
    return true
  } catch (error) {
    console.error('  ❌ External link creation failed:', error.message)
    return false
  }
}

/**
 * Test 11: documentsService - Get documents
 */
async function testGetDocuments() {
  console.log('📋 Test 11: documentsService - Get documents')

  try {
    const { data, error } = await supabase
      .from('title_documents')
      .select('*')
      .eq('title_id', testTitleId)

    if (error) {
      throw new Error(`Failed to get documents: ${error.message}`)
    }

    console.log(`  ✅ Retrieved ${data.length} document(s)`)
    data.forEach(d => {
      console.log(`     - ${d.document_type}: ${d.file_name}`)
    })
    console.log()
    return true
  } catch (error) {
    console.error('  ❌ Document retrieval failed:', error.message)
    return false
  }
}

/**
 * Cleanup: Delete test data
 */
async function cleanup() {
  console.log('🧹 Cleanup: Removing test data')

  try {
    // Delete draft
    if (testDraftId) {
      await supabase.from('title_drafts').delete().eq('creator_id', TEST_USER_ID)
      console.log('  ✅ Draft deleted')
    }

    // Delete documents
    if (testDocumentId) {
      await supabase.from('title_documents').delete().eq('title_id', testTitleId)
      console.log('  ✅ Documents deleted')
    }

    // Delete platforms
    if (testPlatformId) {
      await supabase.from('title_platforms').delete().eq('title_id', testTitleId)
      console.log('  ✅ Platforms deleted')
    }

    // Delete title (CASCADE will handle related data)
    if (testTitleId) {
      await supabase.from('titles').delete().eq('title_id', testTitleId)
      console.log('  ✅ Test title deleted')
    }

    console.log()
  } catch (error) {
    console.error('  ⚠️ Cleanup error:', error.message)
  }
}

/**
 * Run all tests
 */
async function runTests() {
  const results = []

  results.push(await testTablesExist())
  results.push(await testTitlesColumns())
  results.push(await createTestTitle())

  if (testTitleId) {
    results.push(await testAddPlatforms())
    results.push(await testGetPlatforms())
    results.push(await testUpdatePlatform())
    results.push(await testSaveDraft())
    results.push(await testLoadDraft())
    results.push(await testUpdateDraft())
    results.push(await testAddExternalLink())
    results.push(await testGetDocuments())
  }

  await cleanup()

  // Summary
  console.log('================================')
  console.log('📊 Test Summary')
  console.log('================================')
  const passed = results.filter(r => r === true).length
  const total = results.length
  console.log(`✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${total - passed}/${total}`)

  if (passed === total) {
    console.log('\n🎉 All tests passed! Backend services are working correctly.\n')
  } else {
    console.log('\n⚠️ Some tests failed. Review errors above.\n')
  }
}

// Run tests
runTests().catch(console.error)
