/**
 * Tagline Generator Script
 * 
 * This script finds titles without taglines and generates concise, compelling taglines
 * from their descriptions using AI-powered text processing.
 * 
 * Usage: node scripts/data_generator_tagline.js [--dry-run] [--limit=N]
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitMatch = args.find(arg => arg.startsWith('--limit='));
const limit = limitMatch ? parseInt(limitMatch.split('=')[1]) : null;

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * Generate a tagline from description using OpenAI
 */
async function generateTaglineWithAI(description, title) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Create a compelling, concise tagline (maximum 10 words) for this Korean content:

Title: ${title}
Description: ${description}

The tagline should:
- Be punchy and memorable
- Capture the essence of the story
- Appeal to international audiences
- Be suitable for marketing purposes
- Avoid spoilers

Return only the tagline, nothing else.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim().replace(/['"]/g, '');
  } catch (error) {
    console.error(`Error generating tagline for ${title}:`, error.message);
    return null;
  }
}

/**
 * Fallback tagline generation using simple text processing
 */
function generateTaglineFallback(description, title) {
  if (!description || description.length < 10) {
    return null;
  }

  let tagline = '';
  
  // Clean up description - remove HTML tags, extra spaces
  let cleanDesc = description
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  // Try to extract key elements
  const sentences = cleanDesc.split(/[.!?]+/).filter(s => s.trim().length > 5);
  
  if (sentences.length > 0) {
    let firstSentence = sentences[0].trim();
    
    // If it starts with numbers (episode count, etc), try next sentence
    if (/^\d+[,\s]/.test(firstSentence) && sentences.length > 1) {
      firstSentence = sentences[1].trim();
    }
    
    // Extract meaningful part - look for story elements
    const storyPatterns = [
      // Character introduction patterns - capture more context
      /([A-Za-z가-힣-]+(?:'s|\s+(?:was|is|finds?|becomes?|meets?|discovers?))(?:[^,;.!?]{5,60}))/,
      // Story setup patterns  
      /((?:When|After|During)(?:[^,;.!?]{5,60}))/,
      // Conflict/premise patterns
      /((?:But|However|Although)(?:[^,;.!?]{5,60}))/,
      // General narrative patterns
      /([A-Za-z가-힣\s-]+(?:finds?|discovers?|meets?|becomes?|learns?|realizes?)(?:[^,;.!?]{5,50}))/
    ];
    
    for (const pattern of storyPatterns) {
      const match = firstSentence.match(pattern);
      if (match && match[1]) {
        tagline = match[1].trim();
        break;
      }
    }
    
    // If no pattern matched, use first meaningful chunk
    if (!tagline) {
      const chunks = firstSentence.split(/[,;]/);
      tagline = chunks[0].trim();
    }
    
    // Ensure reasonable length (8-60 characters)
    if (tagline.length > 60) {
      const truncated = tagline.substring(0, 57);
      const lastSpace = truncated.lastIndexOf(' ');
      tagline = (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + '...';
    }
    
    // Make sure it's substantial enough
    if (tagline.length < 15 && sentences.length > 0) {
      // Try to get a more complete phrase
      const words = firstSentence.split(/\s+/);
      if (words.length > 3) {
        // Take first 6-10 words for better context
        const wordCount = Math.min(words.length, 10);
        const betterTagline = words.slice(0, wordCount).join(' ');
        if (betterTagline.length >= 15 && betterTagline.length <= 60) {
          tagline = betterTagline;
        }
      }
    }
  }
  
  // Final cleanup
  tagline = tagline
    .replace(/^(The|A|An)\s+/i, '') // Remove leading articles for punchiness
    .replace(/\s+/g, ' ')
    .trim();
    
  // Ensure minimum quality
  if (!tagline || tagline.length < 10 || tagline.length > 80) {
    return null;
  }
  
  // Add ellipsis if it looks incomplete
  if (!tagline.match(/[.!?]$/) && tagline.length < 60) {
    tagline = tagline + '...';
  }
  
  return tagline;
}

/**
 * Find titles without taglines
 */
async function findTitlesWithoutTaglines() {
  console.log('🔍 Finding titles without taglines...');
  
  let query = supabase
    .from('titles')
    .select('title_id, title_name_kr, title_name_en, description, tagline')
    .or('tagline.is.null,tagline.eq.')
    .not('description', 'is', null)
    .neq('description', '');

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching titles: ${error.message}`);
  }

  return data || [];
}

/**
 * Update title with generated tagline
 */
async function updateTitleTagline(titleId, tagline) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would update title ${titleId} with tagline: "${tagline}"`);
    return;
  }

  const { error } = await supabase
    .from('titles')
    .update({ tagline })
    .eq('title_id', titleId);

  if (error) {
    throw new Error(`Error updating title ${titleId}: ${error.message}`);
  }
}

/**
 * Process a single title
 */
async function processTitle(title, index, total) {
  const titleName = title.title_name_en || title.title_name_kr;
  console.log(`\n📝 Processing (${index + 1}/${total}): ${titleName}`);
  
  if (!title.description) {
    console.log('⚠️  No description available, skipping');
    return { success: false, reason: 'no_description' };
  }

  console.log(`📖 Description: ${title.description.substring(0, 100)}...`);

  let tagline = null;

  // Try AI generation first
  if (openai) {
    console.log('🤖 Generating tagline with AI...');
    tagline = await generateTaglineWithAI(title.description, titleName);
    
    if (tagline) {
      console.log(`✨ AI Generated: "${tagline}"`);
    } else {
      console.log('❌ AI generation failed, trying fallback...');
    }
  }

  // Fallback to simple processing
  if (!tagline) {
    console.log('⚙️  Generating tagline with fallback method...');
    tagline = generateTaglineFallback(title.description, titleName);
    
    if (tagline) {
      console.log(`📝 Fallback Generated: "${tagline}"`);
    }
  }

  if (!tagline) {
    console.log('❌ Could not generate tagline');
    return { success: false, reason: 'generation_failed' };
  }

  // Update database
  try {
    await updateTitleTagline(title.title_id, tagline);
    console.log(`✅ ${isDryRun ? 'Would update' : 'Updated'} successfully`);
    return { success: true, tagline };
  } catch (error) {
    console.log(`❌ Update failed: ${error.message}`);
    return { success: false, reason: 'update_failed', error: error.message };
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Tagline Generator Script');
  console.log('=====================================');
  
  if (isDryRun) {
    console.log('🧪 DRY RUN MODE - No database changes will be made');
  }
  
  if (limit) {
    console.log(`📊 Processing limit: ${limit} titles`);
  }
  
  if (!openai) {
    console.log('⚠️  OpenAI API key not found, using fallback method only');
  }

  try {
    // Find titles without taglines
    const titles = await findTitlesWithoutTaglines();
    console.log(`\n📋 Found ${titles.length} titles without taglines`);

    if (titles.length === 0) {
      console.log('✅ All titles already have taglines!');
      return;
    }

    // Process each title
    const results = {
      success: 0,
      failed: 0,
      reasons: {}
    };

    for (let i = 0; i < titles.length; i++) {
      const result = await processTitle(titles[i], i, titles.length);
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.reasons[result.reason] = (results.reasons[result.reason] || 0) + 1;
      }

      // Add delay to avoid rate limiting
      if (openai && i < titles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('==========');
    console.log(`✅ Successful: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (Object.keys(results.reasons).length > 0) {
      console.log('\nFailure reasons:');
      Object.entries(results.reasons).forEach(([reason, count]) => {
        console.log(`  • ${reason}: ${count}`);
      });
    }

    console.log(`\n🎉 Script completed ${isDryRun ? '(dry run)' : 'successfully'}!`);

  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Handle script execution
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { main, findTitlesWithoutTaglines, generateTaglineWithAI, generateTaglineFallback };