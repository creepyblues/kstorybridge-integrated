/**
 * Script to call the regenerate-embeddings edge function
 * Regenerates embeddings for top N most-viewed titles
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runRegeneration(limit = 50, startIndex = 0) {
  console.log(`🚀 Starting regeneration for ${limit} titles (starting at index ${startIndex})...\n`);

  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke('regenerate-embeddings', {
      body: {
        limit,
        start_index: startIndex
      },
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    const duration = Date.now() - startTime;

    if (error) {
      console.error('❌ Error:', error);
      console.error('Error context:', JSON.stringify(error.context, null, 2));

      // Try to read the response body
      if (error.context && error.context.body) {
        try {
          const text = await error.context.text();
          console.error('Response body:', text);
        } catch (e) {
          console.error('Could not read response body');
        }
      }
      return;
    }

    if (data && data.error) {
      console.error('❌ Edge function error:', data.error);
      return;
    }

    console.log('✅ Regeneration complete!\n');
    console.log('Results:');
    console.log(`  ✅ Success:  ${data.results.success} titles`);
    console.log(`  ❌ Failed:   ${data.results.failed} titles`);
    console.log(`  ⏭️  Skipped:  ${data.results.skipped} titles`);
    console.log(`  ⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`  💰 Cost:     $${data.estimated_cost.toFixed(4)}`);

    if (data.results.errors && data.results.errors.length > 0) {
      console.log('\nErrors:');
      data.results.errors.slice(0, 5).forEach(err => {
        console.log(`  - ${err}`);
      });
      if (data.results.errors.length > 5) {
        console.log(`  ... and ${data.results.errors.length - 5} more`);
      }
    }

  } catch (e) {
    console.error('❌ Exception:', e.message);
  }
}

// Get limit from command line args or default to 50
const limit = parseInt(process.argv[2]) || 50;
const startIndex = parseInt(process.argv[3]) || 0;

runRegeneration(limit, startIndex);
