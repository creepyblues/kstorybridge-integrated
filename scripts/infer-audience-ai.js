/**
 * AI Inference Script: Audience Field
 *
 * Uses OpenAI GPT to infer target audience from synopsis, genre, tone, and age_rating.
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
 *   OPENAI_API_KEY=sk-... node scripts/infer-audience-ai.js [--dry-run] [--limit N]
 *
 * Options:
 *   --dry-run    Preview changes without updating database
 *   --limit N    Process only first N titles (default: all)
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Standard audience values
const VALID_AUDIENCES = [
  'KIDS 3-8',
  'KIDS 8-12',
  'TEENS 12-18',
  'ADULTS 18-34',
  'ADULTS 35+',
  'ALL AGES'
];

const SYSTEM_PROMPT = `You are a content classification expert specializing in Korean webtoons and web novels.

Your task is to determine the target audience for a story based on its synopsis, genre, tone, and age rating.

VALID AUDIENCE VALUES (you MUST use one of these exactly):
- KIDS 3-8: Simple stories for young children, educational content, cute animals
- KIDS 8-12: Adventure, friendship, school stories appropriate for tweens
- TEENS 12-18: Coming-of-age, high school romance, teen drama, mild action
- ADULTS 18-34: Mature themes, complex romance, action, fantasy, thriller (most common for webtoons)
- ADULTS 35+: Slice of life, family drama, historical, professional settings
- ALL AGES: Universal appeal, family-friendly content enjoyed by all

GUIDELINES:
1. Korean romance webtoons typically target ADULTS 18-34 (even "clean" ones)
2. Age rating 19+ always means ADULTS 18-34 or ADULTS 35+
3. Age rating 15+ typically means TEENS 12-18 or ADULTS 18-34
4. Fantasy/action with romance usually targets ADULTS 18-34
5. Pure comedy/gag content may be ALL AGES
6. School settings with romance = TEENS 12-18 or ADULTS 18-34

Respond with ONLY the audience value, nothing else.`;

async function inferAudience(title) {
  const { title_name_en, synopsis, genre, tone, age_rating } = title;

  const userPrompt = `Determine the target audience for this Korean webtoon/web novel:

TITLE: ${title_name_en}

SYNOPSIS: ${synopsis || 'Not available'}

GENRE: ${Array.isArray(genre) ? genre.join(', ') : genre || 'Not specified'}

TONE: ${tone || 'Not specified'}

AGE RATING: ${age_rating || 'Not specified'}

What is the target audience? (Reply with ONLY one of: KIDS 3-8, KIDS 8-12, TEENS 12-18, ADULTS 18-34, ADULTS 35+, ALL AGES)`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 20,
      temperature: 0.1 // Low temperature for consistent results
    });

    const result = response.choices[0].message.content.trim();

    // Validate the response
    if (VALID_AUDIENCES.includes(result)) {
      return { success: true, audience: result };
    }

    // Try to match partial responses
    const matched = VALID_AUDIENCES.find(v => result.toUpperCase().includes(v));
    if (matched) {
      return { success: true, audience: matched };
    }

    return { success: false, error: `Invalid response: ${result}` };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('================================================');
  console.log('  AI INFERENCE: AUDIENCE FIELD');
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

  // Estimate cost (GPT-4o-mini: ~$0.00015 per 1K input tokens, ~$0.0006 per 1K output tokens)
  const estimatedCost = titles.length * 0.0005; // ~$0.0005 per title
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
  console.log('');

  const results = {
    success: [],
    failed: [],
    distribution: {}
  };

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    process.stdout.write(`[${i + 1}/${titles.length}] ${title.title_name_en.substring(0, 40).padEnd(40)} `);

    const inference = await inferAudience(title);

    if (inference.success) {
      const audience = inference.audience;
      process.stdout.write(`→ ${audience}\n`);

      results.success.push({ ...title, audience });
      results.distribution[audience] = (results.distribution[audience] || 0) + 1;

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
    } else {
      process.stdout.write(`❌ ${inference.error}\n`);
      results.failed.push({ ...title, error: inference.error });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log('\n================================================');
  console.log('                    SUMMARY');
  console.log('================================================');
  console.log(`✅ Successful: ${results.success.length}/${titles.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${titles.length}`);
  console.log('');

  console.log('📊 Distribution:');
  Object.entries(results.distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([audience, count]) => {
      const bar = '█'.repeat(Math.ceil(count / 2));
      console.log(`   ${audience.padEnd(15)} ${count.toString().padStart(3)} ${bar}`);
    });

  if (results.failed.length > 0) {
    console.log('\n❌ Failed titles:');
    results.failed.forEach(t => {
      console.log(`   - ${t.title_name_en}: ${t.error}`);
    });
  }

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
