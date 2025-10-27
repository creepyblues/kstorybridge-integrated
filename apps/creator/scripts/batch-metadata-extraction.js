#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { metadataExtractionService } from '../src/services/metadataExtractionService.js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Batch process titles for metadata extraction
 * Usage: node batch-metadata-extraction.js [--dry-run] [--limit=50]
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;

  console.log('🚀 Starting batch metadata extraction...');
  console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE PROCESSING'}`);
  console.log(`📝 Limit: ${limit} titles`);
  console.log('');

  try {
    // Get titles without metadata analysis
    const { data: titles, error } = await supabase
      .from('titles')
      .select(`
        title_id,
        title_name_en,
        title_name_kr,
        synopsis,
        tagline,
        pitch,
        perfect_for,
        note,
        genre,
        tone,
        audience,
        comps,
        content_format
      `)
      .is('title_content_analysis', null) // Only titles without existing analysis
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    console.log(`📚 Found ${titles.length} titles to process`);
    
    if (isDryRun) {
      console.log('\n📋 Titles that would be processed:');
      titles.forEach((title, index) => {
        console.log(`${index + 1}. ${title.title_name_en || title.title_name_kr} (${title.title_id})`);
      });
      console.log('\n✅ Dry run complete. Use without --dry-run to process.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log('\n🔄 Processing titles...\n');

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const progress = `[${i + 1}/${titles.length}]`;
      
      try {
        console.log(`${progress} 🎯 Processing: ${title.title_name_en || title.title_name_kr}`);
        
        await metadataExtractionService.extractMetadata(title);
        
        console.log(`${progress} ✅ Success`);
        successCount++;
        
        // Rate limiting - wait between requests
        if (i < titles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.log(`${progress} ❌ Error: ${error.message}`);
        errorCount++;
        errors.push({
          title: title.title_name_en || title.title_name_kr,
          title_id: title.title_id,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n📊 PROCESSING SUMMARY:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Success Rate: ${((successCount / titles.length) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.title} (${error.title_id}): ${error.error}`);
      });
    }

    console.log('\n🎉 Batch processing complete!');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main().catch(console.error);