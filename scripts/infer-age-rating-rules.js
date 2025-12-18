/**
 * Rules-Based Age Rating Inference Script
 *
 * Infers age rating from audience, genre, and tone using deterministic rules.
 *
 * Standard age_rating values:
 * - ALL (All Ages)
 * - 12+ (Teen)
 * - 15+ (Mature Teen)
 * - 19+ (Adults Only)
 *
 * Usage:
 *   node scripts/infer-age-rating-rules.js [--dry-run] [--limit N]
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
 * Rules-based age rating inference
 *
 * Priority:
 * 1. Audience (strongest signal - we have 100% coverage now)
 * 2. Genre patterns (mature themes)
 * 3. Tone patterns
 * 4. Default based on content type
 */
function inferAgeRating(title) {
  const { genre, tone, audience } = title;
  const genreArray = Array.isArray(genre) ? genre.map(g => g.toLowerCase()) : [];
  const toneLower = (tone || '').toLowerCase();
  const audienceValue = (audience || '').toUpperCase();

  // Helper to check if any genre matches
  const hasGenre = (...terms) => genreArray.some(g =>
    terms.some(t => g.includes(t.toLowerCase()))
  );

  // ==========================================
  // RULE 1: Audience-Based (Strongest Signal)
  // ==========================================

  // Kids content
  if (audienceValue.includes('KIDS 3-8')) {
    return { age_rating: 'ALL', rule: 'audience_kids_3_8' };
  }

  if (audienceValue.includes('KIDS 8-12') || audienceValue.includes('KIDS/TEENS')) {
    return { age_rating: 'ALL', rule: 'audience_kids_8_12' };
  }

  // Teen content
  if (audienceValue.includes('TEENS 12-18')) {
    // Check for mature teen themes
    if (hasGenre('thriller', 'horror', 'violence', 'crime')) {
      return { age_rating: '15+', rule: 'audience_teens_mature_genre' };
    }
    return { age_rating: '12+', rule: 'audience_teens' };
  }

  // All ages content
  if (audienceValue.includes('ALL AGES')) {
    return { age_rating: 'ALL', rule: 'audience_all_ages' };
  }

  // Adult content (18-34 or 35+)
  if (audienceValue.includes('ADULTS')) {
    // Check for explicit/mature content indicators
    if (hasGenre('mature', 'adult', 'smut', 'explicit', '19금')) {
      return { age_rating: '19+', rule: 'audience_adults_explicit' };
    }

    // ==========================================
    // RULE 2: Genre-Based (for Adult Audience)
    // ==========================================

    // Mature themes that warrant 15+
    if (hasGenre('thriller', 'horror', 'crime', 'psychological', 'violence', 'dark')) {
      return { age_rating: '15+', rule: 'genre_mature_thriller' };
    }

    // Romance with potential mature content
    if (hasGenre('romance', '로맨스', 'romantic', 'bl', 'gl', 'lgbtq')) {
      // Period/historical romance often has mature themes
      if (hasGenre('period', 'historical', 'mature', 'adult')) {
        return { age_rating: '15+', rule: 'genre_romance_historical' };
      }
      // Standard romance
      return { age_rating: '15+', rule: 'genre_romance_adult' };
    }

    // Fantasy/Action often has violence
    if (hasGenre('fantasy', 'action', 'martial arts', 'murim', '무협', 'war')) {
      return { age_rating: '15+', rule: 'genre_fantasy_action' };
    }

    // Drama can vary
    if (hasGenre('drama', 'melodrama', 'slice of life')) {
      // Check tone for intensity
      if (toneLower.includes('intense') || toneLower.includes('dark') || toneLower.includes('suspense')) {
        return { age_rating: '15+', rule: 'genre_drama_intense' };
      }
      return { age_rating: '12+', rule: 'genre_drama_mild' };
    }

    // Comedy/Gag for adults usually fine for all
    if (hasGenre('comedy', 'gag', 'humor', 'parody')) {
      return { age_rating: '12+', rule: 'genre_comedy_adult' };
    }

    // ==========================================
    // RULE 3: Tone-Based (for Adult Audience)
    // ==========================================

    if (toneLower.includes('intense') || toneLower.includes('suspense') || toneLower.includes('thrilling')) {
      return { age_rating: '15+', rule: 'tone_intense' };
    }

    if (toneLower.includes('dark') || toneLower.includes('eerie') || toneLower.includes('mysterious')) {
      return { age_rating: '15+', rule: 'tone_dark' };
    }

    if (toneLower.includes('romantic') || toneLower.includes('rom-com')) {
      return { age_rating: '15+', rule: 'tone_romantic' };
    }

    if (toneLower.includes('heartwarming') || toneLower.includes('sweet') || toneLower.includes('funny')) {
      return { age_rating: '12+', rule: 'tone_lighthearted' };
    }

    if (toneLower.includes('exciting') || toneLower.includes('epic') || toneLower.includes('adventurous')) {
      return { age_rating: '15+', rule: 'tone_action' };
    }

    // Default for adults without specific indicators
    return { age_rating: '15+', rule: 'audience_adults_default' };
  }

  // ==========================================
  // RULE 4: Fallback Defaults
  // ==========================================

  // If we reach here, use genre/tone fallbacks

  // Mature genres default to 15+
  if (hasGenre('romance', 'thriller', 'horror', 'action', 'fantasy', 'drama')) {
    return { age_rating: '15+', rule: 'fallback_mature_genre' };
  }

  // Light genres default to ALL
  if (hasGenre('comedy', 'gag', 'kids', 'family', 'educational')) {
    return { age_rating: 'ALL', rule: 'fallback_light_genre' };
  }

  // Ultimate default for Korean webtoons
  return { age_rating: '15+', rule: 'default' };
}

async function main() {
  console.log('================================================');
  console.log('  RULES-BASED AGE RATING INFERENCE');
  console.log('================================================');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '✏️ LIVE (will update database)'}`);
  console.log('');

  // Fetch titles with NULL age_rating
  let query = supabase
    .from('titles')
    .select('title_id, title_name_en, synopsis, genre, tone, audience')
    .is('age_rating', null)
    .order('title_name_en');

  if (LIMIT) {
    query = query.limit(LIMIT);
  }

  const { data: titles, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch titles:', error.message);
    process.exit(1);
  }

  console.log(`📊 Found ${titles.length} titles with NULL age_rating`);
  if (LIMIT) console.log(`   (Limited to ${LIMIT})`);
  console.log('');

  const results = {
    success: [],
    distribution: {},
    ruleUsage: {}
  };

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const { age_rating, rule } = inferAgeRating(title);

    // Track distribution
    results.distribution[age_rating] = (results.distribution[age_rating] || 0) + 1;
    results.ruleUsage[rule] = (results.ruleUsage[rule] || 0) + 1;

    results.success.push({ ...title, age_rating, rule });

    // Print progress
    const shortName = title.title_name_en.substring(0, 35).padEnd(35);
    console.log(`[${String(i + 1).padStart(3)}/${titles.length}] ${shortName} → ${age_rating.padEnd(4)} (${rule})`);

    // Update database if not dry run
    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('titles')
        .update({ age_rating })
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

  console.log('📊 Age Rating Distribution:');
  Object.entries(results.distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([age_rating, count]) => {
      const pct = ((count / titles.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.ceil(count / 5));
      console.log(`   ${age_rating.padEnd(4)} ${count.toString().padStart(3)} (${pct.padStart(5)}%) ${bar}`);
    });

  console.log('\n📋 Rules Used:');
  Object.entries(results.ruleUsage)
    .sort((a, b) => b[1] - a[1])
    .forEach(([rule, count]) => {
      console.log(`   ${rule.padEnd(30)} ${count.toString().padStart(3)}`);
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
