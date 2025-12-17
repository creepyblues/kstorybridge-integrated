/**
 * Batch Format Fit Analysis for Trending Titles
 *
 * Runs format fit analysis for all trending/featured titles that are missing data.
 * Each analysis takes ~15-20 seconds and costs ~$0.055 in OpenAI API usage.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const USER_EMAIL = process.env.ADMIN_EMAIL || 'admin@kstorybridge.com';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Retry failed titles from previous batch
const TITLES_TO_ANALYZE = [
  { id: '4364b5c6-4789-4c58-8d78-0cb639895d83', name: 'Shoot for the Stars' },
  { id: '6afd8eaf-569d-4227-9183-a9d39d0f3916', name: 'Reborn as the Enemy Prince' },
];

async function analyzeTitle(titleId, titleName, index, total) {
  console.log(`\n[${index + 1}/${total}] Analyzing: ${titleName}`);
  console.log(`    Title ID: ${titleId}`);

  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke('format-fit-engine', {
      body: {
        title_id: titleId,
        user_email: USER_EMAIL,
        mode: 'auto'
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (error) {
      console.log(`    FAILED (${duration}s): ${error.message}`);
      return { success: false, titleId, titleName, error: error.message };
    }

    if (data && data.best_format) {
      console.log(`    SUCCESS (${duration}s)`);
      console.log(`    Best Format: ${data.best_format.toUpperCase()} (${data.best_format_score}/100)`);
      console.log(`    Scores: Film ${data.scores.film} | TV ${data.scores.tv_series} | Animation ${data.scores.animation} | Microdrama ${data.scores.microdrama} | Audio ${data.scores.audio_drama}`);
      return { success: true, titleId, titleName, data };
    }

    console.log(`    FAILED (${duration}s): No data returned`);
    return { success: false, titleId, titleName, error: 'No data returned' };

  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`    ERROR (${duration}s): ${err.message}`);
    return { success: false, titleId, titleName, error: err.message };
  }
}

async function runBatchAnalysis() {
  console.log('================================================');
  console.log('  BATCH FORMAT FIT ANALYSIS FOR TRENDING TITLES');
  console.log('================================================');
  console.log(`\nTotal titles to analyze: ${TITLES_TO_ANALYZE.length}`);
  console.log(`Estimated time: ${(TITLES_TO_ANALYZE.length * 20 / 60).toFixed(1)} minutes`);
  console.log(`Estimated cost: $${(TITLES_TO_ANALYZE.length * 0.055).toFixed(2)}`);
  console.log('');

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < TITLES_TO_ANALYZE.length; i++) {
    const title = TITLES_TO_ANALYZE[i];
    const result = await analyzeTitle(title.id, title.name, i, TITLES_TO_ANALYZE.length);
    results.push(result);

    // Small delay between requests to avoid rate limiting
    if (i < TITLES_TO_ANALYZE.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log('\n================================================');
  console.log('                    SUMMARY');
  console.log('================================================');
  console.log(`Total Duration: ${totalDuration} minutes`);
  console.log(`Successful: ${successCount}/${TITLES_TO_ANALYZE.length}`);
  console.log(`Failed: ${failCount}/${TITLES_TO_ANALYZE.length}`);

  if (failCount > 0) {
    console.log('\nFailed titles:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.titleName}: ${r.error}`);
    });
  }

  console.log('\n');
  return results;
}

runBatchAnalysis()
  .then(results => {
    const allSuccess = results.every(r => r.success);
    process.exit(allSuccess ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
