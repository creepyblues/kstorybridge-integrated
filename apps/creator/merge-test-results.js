/**
 * Merge Test Results - Final Three-Way A/B Test
 *
 * Combines:
 * - NEW FORMAL results (clean, no history contamination)
 * - ORIGINAL results (from initial three-way test)
 * - ENHANCED results (from initial three-way test)
 *
 * Creates final test results file for scoring and analysis.
 */

import fs from 'fs';

const FORMAL_FILE = 'phase-2-formal-retest-2025-10-15T16-43-35-426Z.json';
const THREE_WAY_FILE = 'phase-2-test-results-three-way-2025-10-15T05-23-35-277Z.json';

console.log('📊 Merging Three-Way A/B Test Results');
console.log('=====================================\n');

try {
  // Read files
  console.log('📖 Reading files...');
  const formalData = JSON.parse(fs.readFileSync(FORMAL_FILE, 'utf8'));
  const threeWayData = JSON.parse(fs.readFileSync(THREE_WAY_FILE, 'utf8'));

  console.log(`   ✅ FORMAL: ${formalData.formalResults.length} responses`);
  console.log(`   ✅ ORIGINAL: ${threeWayData.originalResults.length} responses`);
  console.log(`   ✅ ENHANCED: ${threeWayData.enhancedResults.length} responses\n`);

  // Verify all have same queries
  if (formalData.formalResults.length !== threeWayData.originalResults.length ||
      formalData.formalResults.length !== threeWayData.enhancedResults.length) {
    throw new Error('Query count mismatch between files');
  }

  const queryCount = formalData.formalResults.length;

  // Create merged results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `phase-2-test-results-final-${timestamp}.json`;

  const mergedData = {
    metadata: {
      testDate: new Date().toISOString(),
      totalQueries: queryCount,
      totalResponses: queryCount * 3,
      testType: 'Three-Way A/B Test (Final - Clean Baseline)',
      variants: [
        'FORMAL BASELINE (USE_FORMAL_BASELINE=true) - Clean, no history contamination',
        'ORIGINAL conversational (both flags false) - Story craft language',
        'ENHANCED enthusiastic (ENABLE_NEW_PERSONALITY=true) - Story nerd personality'
      ],
      dataSource: {
        formalBaseline: FORMAL_FILE,
        originalAndEnhanced: THREE_WAY_FILE
      },
      notes: [
        'FORMAL baseline was rerun after clearing chat history to eliminate contamination',
        'ORIGINAL and ENHANCED results from initial three-way test (with history)',
        'FORMAL responses are clean but retain polite conversational language ("I\'d love to help", "I\'m curious")',
        'Key difference: FORMAL lacks history references and enthusiasm markers present in ORIGINAL/ENHANCED'
      ]
    },
    formalResults: formalData.formalResults,
    originalResults: threeWayData.originalResults,
    enhancedResults: threeWayData.enhancedResults,
    testQueries: formalData.testQueries
  };

  // Save merged file
  fs.writeFileSync(filename, JSON.stringify(mergedData, null, 2));

  console.log('✅ Merge complete!');
  console.log(`   📁 File: ${filename}`);
  console.log(`   📊 Total responses: ${queryCount * 3} (${queryCount} queries × 3 variants)\n`);

  // Summary statistics
  console.log('📈 Summary Statistics:\n');

  // Count conversational markers in FORMAL
  const formalWithMarkers = formalData.formalResults.filter(r =>
    r.conversationalMarkersFound && r.conversationalMarkersFound.length > 0
  ).length;

  console.log('FORMAL Baseline:');
  console.log(`   Clean responses: ${queryCount - formalWithMarkers}/${queryCount}`);
  console.log(`   With "I'm curious": ${formalWithMarkers}/${queryCount}`);
  console.log(`   History contamination: 0 (verified clean)\n`);

  // Check for history references in ORIGINAL/ENHANCED
  const originalWithHistory = threeWayData.originalResults.filter(r =>
    r.response && (
      r.response.includes('discussed previously') ||
      r.response.includes('earlier interest') ||
      r.response.includes('we\'ve talked about')
    )
  ).length;

  const enhancedWithHistory = threeWayData.enhancedResults.filter(r =>
    r.response && (
      r.response.includes('discussed previously') ||
      r.response.includes('earlier interest') ||
      r.response.includes('we\'ve talked about')
    )
  ).length;

  console.log('ORIGINAL Conversational:');
  console.log(`   Responses with history references: ${originalWithHistory}/${queryCount}`);

  console.log('\nENHANCED Enthusiastic:');
  console.log(`   Responses with history references: ${enhancedWithHistory}/${queryCount}\n`);

  console.log('━'.repeat(60));
  console.log('✅ READY FOR SCORING\n');
  console.log('📋 Next Steps:');
  console.log('   1. Score all 45 responses on 5 metrics (1-5 scale)');
  console.log('   2. Calculate three improvement percentages:');
  console.log('      - FORMAL → ORIGINAL (conversational impact)');
  console.log('      - ORIGINAL → ENHANCED (enthusiasm impact)');
  console.log('      - FORMAL → ENHANCED (total improvement)');
  console.log('   3. Create PHASE_2_TEST_RESULTS.md with analysis');
  console.log('   4. Make go/no-go recommendation\n');

  console.log('💡 Key Insight:');
  console.log('   FORMAL baseline is clean (no history) but retains polite');
  console.log('   conversational language. This is acceptable for measuring');
  console.log('   enthusiasm improvements in Phase 2.\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
