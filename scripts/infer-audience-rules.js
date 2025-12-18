/**
 * Rules-Based Audience Inference Script
 *
 * Infers target audience from genre, tone, and age_rating using deterministic rules.
 * This is faster and doesn't require OpenAI API.
 *
 * Standard audience values:
 * - KIDS 3-8
 * - KIDS 8-12
 * - TEENS 12-18
 * - ADULTS 18-34
 * - ADULTS 35+
 * - ALL AGES
 *
 * Usage:
 *   node scripts/infer-audience-rules.js [--dry-run] [--limit N]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Rules-based audience inference
 *
 * Priority:
 * 1. Age rating (strongest signal)
 * 2. Genre patterns
 * 3. Tone patterns
 * 4. Default to ADULTS 18-34 (most common for Korean webtoons)
 */
function inferAudience(title) {
  const { genre, tone, age_rating } = title;
  const genreArray = Array.isArray(genre) ? genre.map(g => g.toLowerCase()) : [];
  const toneLower = (tone || '').toLowerCase();
  const ageRating = (age_rating || '').toUpperCase();

  // Helper to check if any genre matches
  const hasGenre = (...terms) => genreArray.some(g =>
    terms.some(t => g.includes(t.toLowerCase()))
  );

  // ==========================================
  // RULE 1: Age Rating (Strongest Signal)
  // ==========================================

  // 19+ content is always for adults
  if (ageRating === '19+') {
    return { audience: 'ADULTS 18-34', rule: 'age_rating_19plus' };
  }

  // 15+ content is for teens or adults
  if (ageRating === '15+') {
    // Romance 15+ usually targets adults
    if (hasGenre('romance', '로맨스', 'romantic')) {
      return { audience: 'ADULTS 18-34', rule: 'age_15plus_romance' };
    }
    // Action/thriller 15+ could be teens
    if (hasGenre('action', 'thriller', 'school', 'boy')) {
      return { audience: 'TEENS 12-18', rule: 'age_15plus_action' };
    }
    return { audience: 'ADULTS 18-34', rule: 'age_15plus_default' };
  }

  // ALL rating could be any age
  if (ageRating === 'ALL') {
    // Check for kid-specific content
    if (hasGenre('kids', 'children', 'educational', '아동')) {
      return { audience: 'KIDS 8-12', rule: 'age_all_kids_genre' };
    }
    // Comedy/gag for all ages
    if (hasGenre('gag', 'comedy', 'review')) {
      return { audience: 'ALL AGES', rule: 'age_all_comedy' };
    }
  }

  // ==========================================
  // RULE 2: Genre Patterns
  // ==========================================

  // Kids content
  if (hasGenre('kids', 'children', '아동', 'educational')) {
    return { audience: 'KIDS 8-12', rule: 'genre_kids' };
  }

  // Romance (most common for Korean webtoons)
  if (hasGenre('romance', '로맨스', 'romantic', 'bl', 'gl', 'love')) {
    // School romance might be for younger audience
    if (hasGenre('school', 'high school', '학원')) {
      // But most Korean school romance is still for adults
      return { audience: 'ADULTS 18-34', rule: 'genre_school_romance' };
    }
    return { audience: 'ADULTS 18-34', rule: 'genre_romance' };
  }

  // Fantasy/Action typically for adults
  if (hasGenre('fantasy', 'action', 'martial arts', 'murim', '무협')) {
    return { audience: 'ADULTS 18-34', rule: 'genre_fantasy_action' };
  }

  // Thriller/Horror for adults
  if (hasGenre('thriller', 'horror', 'mystery', 'crime', 'suspense')) {
    return { audience: 'ADULTS 18-34', rule: 'genre_thriller' };
  }

  // Drama typically for adults
  if (hasGenre('drama', 'melodrama', 'slice of life', 'daily')) {
    // Family drama might be for older adults
    if (hasGenre('family', 'historical', 'period')) {
      return { audience: 'ADULTS 35+', rule: 'genre_family_drama' };
    }
    return { audience: 'ADULTS 18-34', rule: 'genre_drama' };
  }

  // School/Teen content
  if (hasGenre('school', 'teen', 'youth', 'coming of age', 'boy', 'girl')) {
    // Without romance, might be for teens
    if (!hasGenre('romance', '로맨스')) {
      return { audience: 'TEENS 12-18', rule: 'genre_school_no_romance' };
    }
    return { audience: 'ADULTS 18-34', rule: 'genre_school_with_romance' };
  }

  // Sports
  if (hasGenre('sports', 'esports', 'gaming')) {
    return { audience: 'TEENS 12-18', rule: 'genre_sports' };
  }

  // Comedy/Gag
  if (hasGenre('gag', 'comedy', 'humor', 'parody')) {
    return { audience: 'ALL AGES', rule: 'genre_comedy' };
  }

  // ==========================================
  // RULE 3: Tone Patterns
  // ==========================================

  if (toneLower.includes('romantic') || toneLower.includes('rom-com')) {
    return { audience: 'ADULTS 18-34', rule: 'tone_romantic' };
  }

  if (toneLower.includes('exciting') || toneLower.includes('thrilling')) {
    return { audience: 'ADULTS 18-34', rule: 'tone_exciting' };
  }

  if (toneLower.includes('heartwarming') || toneLower.includes('sweet')) {
    return { audience: 'ADULTS 18-34', rule: 'tone_heartwarming' };
  }

  if (toneLower.includes('funny') || toneLower.includes('quirky')) {
    // Could be any age, default to adults for webtoons
    return { audience: 'ADULTS 18-34', rule: 'tone_funny' };
  }

  if (toneLower.includes('intense') || toneLower.includes('suspense')) {
    return { audience: 'ADULTS 18-34', rule: 'tone_intense' };
  }

  // ==========================================
  // RULE 4: Default
  // ==========================================

  // Most Korean webtoons target ADULTS 18-34
  return { audience: 'ADULTS 18-34', rule: 'default' };
}

async function main() {
  console.log('================================================');
  console.log('  RULES-BASED AUDIENCE INFERENCE');
  console.log('================================================');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '✏️ LIVE (will update database)'}`);
  console.log('');

  // Fetch titles with NULL audience
  let query = supabase
    .from('titles')
    .select('title_id, title_name_en, synopsis, genre, tone, age_rating')
    .is('audience', null)
    .order('title_name_en');

  if (LIMIT) {
    query = query.limit(LIMIT);
  }

  const { data: titles, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch titles:', error.message);
    process.exit(1);
  }

  console.log(`📊 Found ${titles.length} titles with NULL audience`);
  if (LIMIT) console.log(`   (Limited to ${LIMIT})`);
  console.log('');

  const results = {
    success: [],
    distribution: {},
    ruleUsage: {}
  };

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const { audience, rule } = inferAudience(title);

    // Track distribution
    results.distribution[audience] = (results.distribution[audience] || 0) + 1;
    results.ruleUsage[rule] = (results.ruleUsage[rule] || 0) + 1;

    results.success.push({ ...title, audience, rule });

    // Print progress
    const shortName = title.title_name_en.substring(0, 35).padEnd(35);
    console.log(`[${String(i + 1).padStart(3)}/${titles.length}] ${shortName} → ${audience.padEnd(15)} (${rule})`);

    // Update database if not dry run
    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('titles')
        .update({ audience })
        .eq('title_id', title.title_id);

      if (updateError) {
        console.log(`   ⚠️ Update failed: ${updateError.message}`);
      }
    }
  }

  // Print summary
  console.log('\n================================================');
  console.log('                    SUMMARY');
  console.log('================================================');
  console.log(`✅ Processed: ${results.success.length}/${titles.length}`);
  console.log('');

  console.log('📊 Audience Distribution:');
  Object.entries(results.distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([audience, count]) => {
      const pct = ((count / titles.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.ceil(count / 3));
      console.log(`   ${audience.padEnd(15)} ${count.toString().padStart(3)} (${pct.padStart(5)}%) ${bar}`);
    });

  console.log('\n📋 Rules Used:');
  Object.entries(results.ruleUsage)
    .sort((a, b) => b[1] - a[1])
    .forEach(([rule, count]) => {
      console.log(`   ${rule.padEnd(25)} ${count.toString().padStart(3)}`);
    });

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN complete. No changes were made.');
    console.log('   Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Database updated successfully.');
  }

  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
