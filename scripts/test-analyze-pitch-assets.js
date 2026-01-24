/**
 * Test Script: analyze-pitch-for-assets Edge Function
 * Feature: Creative Asset Generation System
 * Purpose: Test GPT-4 analysis and asset idea generation
 *
 * Usage:
 *   node scripts/test-analyze-pitch-assets.js
 *
 * Requirements:
 *   - OPENAI_API_KEY secret set in Supabase
 *   - title_marketing_assets table created
 *   - Edge function deployed
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_TITLE = {
  title_id: 'test-' + Date.now(),
  title_name: '환생했더니 슬라임이었던 건에 대하여 (Reincarnated as a Slime)',
  pitch_deck_url: 'https://example.com/pitch.pdf', // Mock URL for testing
  admin_email: 'sungho@kstorybridge.com',
  pitch_analysis: {
    characters: {
      main_characters: [
        {
          name: '김민준 (Kim Min-jun)',
          role: 'Protagonist',
          archetype: 'Reluctant Hero / Underdog',
          description: 'A 25-year-old Korean office worker who dies and is reincarnated as a slime in a fantasy world. Despite his weak appearance, he gains unique abilities and builds a found family.'
        },
        {
          name: '이하늘 (Lee Ha-neul)',
          role: 'Mentor / Love Interest',
          archetype: 'Wise Mentor',
          description: 'A powerful dragon who takes interest in Min-jun and becomes his guide in the fantasy world. She is both mysterious and protective.'
        },
        {
          name: '박강호 (Park Kang-ho)',
          role: 'Antagonist',
          archetype: 'Power-Hungry Villain',
          description: 'A human summoner who seeks to control Min-jun for his own gain. Represents the threat of exploitation.'
        }
      ],
      relationships: [
        'Min-jun and Ha-neul: Master-servant dynamic evolving into mutual respect',
        'Min-jun and monster allies: Found family bond',
        'Min-jun vs Kang-ho: Ideological conflict (freedom vs control)'
      ]
    },
    story: {
      logline: 'After dying in a traffic accident, a Korean office worker is reborn as a slime in a fantasy world, where he must build a new life and protect his found family from those who would exploit him.',
      premise: 'A modern Korean salaryman gets a second chance at life in a fantasy world, but as the weakest creature imaginable—a slime. Using his human knowledge and unexpected slime abilities, he forms bonds with monsters and challenges the established power structures.',
      themes: [
        'Reincarnation and second chances',
        'Found family and belonging',
        'Power fantasy with underdog narrative',
        'Korean work culture critique (burnout, exploitation)',
        'Cross-cultural fusion (Korean protagonist in fantasy setting)'
      ],
      conflicts: [
        'Survival in a hostile world as a weak creature',
        'Building trust across species (human reborn as monster)',
        'Protecting found family from human exploitation',
        'Identity crisis (human mind in monster body)',
        'Power struggles in the fantasy realm'
      ],
      narrative_structure: 'Progressive power-up narrative with episodic arcs building to a larger conflict about monster-human coexistence',
      setting: 'A fantasy world inspired by Korean mythology, featuring modern Korean sensibilities in character interactions and humor'
    },
    market: {
      target_audience: 'Male 18-35, isekai/fantasy fans, manhwa readers, anime viewers',
      comparable_titles: [
        'Solo Leveling (similar Korean protagonist empowerment)',
        'That Time I Got Reincarnated as a Slime (same premise, Japanese)',
        'The Beginning After The End (Korean-style power fantasy)',
        'Omniscient Reader\'s Viewpoint (Korean meta-fantasy)'
      ],
      unique_selling_points: [
        'Korean cultural elements in isekai genre (usually Japanese)',
        'Slime protagonist is unique and merchandisable',
        'Found family dynamics appeal to wider audience',
        'Critique of Korean work culture adds depth',
        'Strong visual potential (slime transformations, fantasy battles)'
      ],
      genre_blend: ['Isekai', 'Fantasy', 'Action', 'Comedy', 'Drama', 'Power Fantasy']
    },
    source_material: {
      platform: 'KakaoPage',
      views: 25000000,
      chapters: 120,
      rating: 9.2,
      completion_status: 'Ongoing (Weekly updates)'
    },
    cultural_elements: {
      korean_cultural_themes: [
        'Korean work culture and burnout',
        'Korean humor and pop culture references',
        'Korean food as comfort element',
        'Korean mythology integration (dokkaebi, gumiho references)',
        'Han (한) - sense of collective grief and perseverance'
      ],
      cultural_authenticity_score: 8.5
    }
  }
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Test 1: Valid request with full pitch analysis
 */
async function testValidRequestWithPitchAnalysis() {
  console.log('\n🧪 Test 1: Valid request with pitch analysis');
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();

    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: TEST_TITLE
    });

    const duration = Date.now() - startTime;

    if (error) {
      console.error('❌ FAILED:', error.message);
      return { success: false, error };
    }

    if (!data.success) {
      console.error('❌ FAILED:', data.error.message);
      return { success: false, error: data.error };
    }

    console.log(`✅ PASSED (${duration}ms)`);
    console.log(`\n📊 Results:`);
    console.log(`   - Assets created: ${data.data.assets_created}`);
    console.log(`   - Total cost: $${data.data.analysis_metadata.total_cost.toFixed(4)}`);
    console.log(`   - GPT-4 cost: $${data.data.analysis_metadata.gpt4_cost.toFixed(4)}`);
    console.log(`   - Analysis duration: ${data.data.analysis_metadata.analysis_duration_ms}ms`);
    console.log(`   - Model: ${data.data.analysis_metadata.model_used}`);
    console.log(`   - Tokens: ${data.data.analysis_metadata.tokens_used.total} (prompt: ${data.data.analysis_metadata.tokens_used.prompt}, completion: ${data.data.analysis_metadata.tokens_used.completion})`);
    console.log(`   - Pitch analysis used: ${data.data.analysis_metadata.pitch_analysis_used ? 'Yes' : 'No'}`);

    console.log(`\n📝 Asset Ideas Generated:`);
    const categoryCounts = {
      social_media: 0,
      ad_creative: 0,
      pitch_material: 0
    };

    data.data.asset_ideas.forEach((idea, index) => {
      categoryCounts[idea.asset_category]++;
      console.log(`   ${index + 1}. [${idea.asset_category}] ${idea.asset_type} (${idea.asset_format})`);
      console.log(`      ${idea.description.substring(0, 80)}...`);
      console.log(`      Priority: ${idea.priority || 'N/A'}, Est. cost: $${idea.estimated_cost?.toFixed(2) || 'N/A'}`);
    });

    console.log(`\n📊 Category Breakdown:`);
    console.log(`   - Social Media: ${categoryCounts.social_media} ideas`);
    console.log(`   - Ad Creatives: ${categoryCounts.ad_creative} ideas`);
    console.log(`   - Pitch Materials: ${categoryCounts.pitch_material} ideas`);

    // Verify database insertion
    const dbCheck = await verifyDatabaseInsertion(TEST_TITLE.title_id, data.data.assets_created);
    if (!dbCheck.success) {
      console.error(`❌ Database verification failed: ${dbCheck.error}`);
      return { success: false, error: dbCheck.error };
    }

    console.log(`\n✅ Database verification: ${dbCheck.count} records found`);

    return { success: true, data: data.data };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Valid request without pitch analysis (fallback mode)
 */
async function testValidRequestWithoutPitchAnalysis() {
  console.log('\n🧪 Test 2: Valid request without pitch analysis (fallback mode)');
  console.log('='.repeat(60));

  try {
    const testData = {
      title_id: 'test-no-analysis-' + Date.now(),
      title_name: 'Test Title Without Analysis',
      pitch_deck_url: 'https://example.com/pitch2.pdf',
      admin_email: 'sungho@kstorybridge.com'
      // No pitch_analysis field
    };

    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: testData
    });

    if (error) {
      console.error('❌ FAILED:', error.message);
      return { success: false, error };
    }

    if (!data.success) {
      console.error('❌ FAILED:', data.error.message);
      return { success: false, error: data.error };
    }

    console.log('✅ PASSED');
    console.log(`   - Assets created: ${data.data.assets_created}`);
    console.log(`   - Pitch analysis used: ${data.data.analysis_metadata.pitch_analysis_used ? 'Yes' : 'No (fallback mode)'}`);

    return { success: true, data: data.data };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Invalid admin email (unauthorized)
 */
async function testUnauthorizedAdmin() {
  console.log('\n🧪 Test 3: Unauthorized admin email');
  console.log('='.repeat(60));

  try {
    const testData = {
      ...TEST_TITLE,
      title_id: 'test-unauthorized-' + Date.now(),
      admin_email: 'unauthorized@example.com'
    };

    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: testData
    });

    // Should fail with unauthorized error
    if (data && !data.success && data.error.code === 'UNAUTHORIZED') {
      console.log('✅ PASSED - Correctly rejected unauthorized admin');
      return { success: true };
    }

    console.error('❌ FAILED - Should have rejected unauthorized admin');
    return { success: false, error: 'Expected UNAUTHORIZED error' };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Missing required fields
 */
async function testMissingRequiredFields() {
  console.log('\n🧪 Test 4: Missing required fields');
  console.log('='.repeat(60));

  try {
    const testData = {
      title_name: 'Test Title',
      admin_email: 'sungho@kstorybridge.com'
      // Missing title_id and pitch_deck_url
    };

    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: testData
    });

    // Should fail with invalid input error
    if (data && !data.success && data.error.code === 'INVALID_INPUT') {
      console.log('✅ PASSED - Correctly rejected invalid input');
      return { success: true };
    }

    console.error('❌ FAILED - Should have rejected invalid input');
    return { success: false, error: 'Expected INVALID_INPUT error' };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verify database insertion
 */
async function verifyDatabaseInsertion(titleId, expectedCount) {
  try {
    const { data, error } = await supabase
      .from('title_marketing_assets')
      .select('*')
      .eq('title_id', titleId);

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.length !== expectedCount) {
      return {
        success: false,
        error: `Expected ${expectedCount} records, found ${data.length}`
      };
    }

    // Verify all records have required fields
    for (const record of data) {
      if (!record.title_name || !record.asset_category || !record.prompt_template) {
        return {
          success: false,
          error: 'Record missing required fields'
        };
      }

      if (record.status !== 'pending') {
        return {
          success: false,
          error: `Expected status='pending', got '${record.status}'`
        };
      }
    }

    return { success: true, count: data.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    const { error } = await supabase
      .from('title_marketing_assets')
      .delete()
      .like('title_id', 'test-%');

    if (error) {
      console.error('⚠️  Cleanup failed:', error.message);
    } else {
      console.log('✅ Cleanup complete');
    }
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing: analyze-pitch-for-assets Edge Function');
  console.log('='.repeat(60));

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Run tests
  const tests = [
    { name: 'Valid request with pitch analysis', fn: testValidRequestWithPitchAnalysis },
    { name: 'Valid request without pitch analysis', fn: testValidRequestWithoutPitchAnalysis },
    { name: 'Unauthorized admin email', fn: testUnauthorizedAdmin },
    { name: 'Missing required fields', fn: testMissingRequiredFields }
  ];

  for (const test of tests) {
    results.total++;
    const result = await test.fn();
    results.tests.push({ name: test.name, ...result });

    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Cleanup
  await cleanupTestData();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => !t.success).forEach(t => {
      console.log(`   - ${t.name}`);
      if (t.error) {
        console.log(`     Error: ${typeof t.error === 'object' ? JSON.stringify(t.error) : t.error}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
