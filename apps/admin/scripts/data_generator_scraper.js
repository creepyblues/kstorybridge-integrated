/**
 * Data Generator Scraper Script
 * 
 * This script finds titles missing key data fields (views, likes, audience, age_rating)
 * and uses the scraper system to populate them, generating SQL update queries.
 * 
 * Usage: node scripts/data_generator_scraper.js [--dry-run] [--limit=N] [--field=views,likes,audience,age_rating]
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';
const SCRAPER_API_URL = process.env.VITE_SCRAPER_API_URL || 'http://localhost:3001/api/scraper';

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitMatch = args.find(arg => arg.startsWith('--limit='));
const limit = limitMatch ? parseInt(limitMatch.split('=')[1]) : null;
const fieldMatch = args.find(arg => arg.startsWith('--field='));
const targetFields = fieldMatch ? fieldMatch.split('=')[1].split(',') : ['views', 'likes', 'audience', 'age_rating'];

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Scraper API Interface
 */
class ScraperApiClient {
  constructor() {
    this.baseUrl = SCRAPER_API_URL;
  }

  async scrapeTitle(url) {
    try {
      console.log('📡 Calling scraper API for:', url);
      
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`,
          confidence: 0,
          extractedFields: []
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error.message}`,
        confidence: 0,
        extractedFields: []
      };
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

const scraperClient = new ScraperApiClient();

/**
 * Check if a field is considered "missing" or needs updating
 */
function isFieldMissing(value, fieldName) {
  if (value === null || value === undefined) return true;
  
  switch (fieldName) {
    case 'views':
    case 'likes':
      return value === 0 || value === null || value === undefined;
    case 'audience':
    case 'age_rating':
      return !value || value.trim() === '';
    default:
      return !value;
  }
}

/**
 * Find titles missing target data fields
 */
async function findTitlesWithMissingData() {
  console.log('🔍 Finding titles with missing data...');
  console.log(`Target fields: ${targetFields.join(', ')}`);
  
  try {
    let query = supabase
      .from('titles')
      .select(`
        title_id,
        title_name_kr,
        title_name_en,
        title_url,
        views,
        likes,
        audience,
        age_rating,
        genre,
        content_format,
        created_at
      `)
      .not('title_url', 'is', null)
      .neq('title_url', '')
      .or('title_url.ilike.%naver.com%,title_url.ilike.%kakao.com%');

    if (limit) {
      query = query.limit(limit * 2); // Get more to filter
    }

    const { data: titles, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Filter titles that have missing data in target fields
    const titlesWithMissingData = titles.filter(title => {
      return targetFields.some(field => isFieldMissing(title[field], field));
    });

    // Apply limit after filtering
    const finalTitles = limit ? titlesWithMissingData.slice(0, limit) : titlesWithMissingData;

    console.log(`✅ Found ${titlesWithMissingData.length} titles with missing data`);
    if (limit) {
      console.log(`📊 Processing ${finalTitles.length} titles (limit applied)`);
    }

    return finalTitles;
  } catch (error) {
    console.error('❌ Error finding titles:', error.message);
    return [];
  }
}

/**
 * Check if URL is supported by our scrapers
 */
function isSupportedUrl(url) {
  const supportedDomains = [
    'series.naver.com',
    'comic.naver.com', 
    'page.kakao.com',
    'webtoon.kakao.com'
  ];
  
  return supportedDomains.some(domain => url.includes(domain));
}

/**
 * Scrape missing data for a single title
 */
async function scrapeTitle(title, index, total) {
  const titleName = title.title_name_en || title.title_name_kr;
  console.log(`\n📝 Processing (${index + 1}/${total}): ${titleName}`);
  console.log(`🔗 URL: ${title.title_url}`);

  // Check if URL is supported
  if (!isSupportedUrl(title.title_url)) {
    console.log('⚠️  URL not supported by scrapers, skipping');
    return { success: false, reason: 'unsupported_url' };
  }

  // Identify missing fields
  const missingFields = targetFields.filter(field => 
    isFieldMissing(title[field], field)
  );
  
  console.log(`📋 Missing fields: ${missingFields.join(', ')}`);

  try {
    // Call scraper API
    const scrapingResult = await scraperClient.scrapeTitle(title.title_url);
    
    if (!scrapingResult.success) {
      console.log(`❌ Scraping failed: ${scrapingResult.error}`);
      return { success: false, reason: 'scraping_failed', error: scrapingResult.error };
    }

    console.log(`✅ Scraping successful (confidence: ${Math.round(scrapingResult.confidence * 100)}%)`);
    console.log(`📊 Extracted fields: ${scrapingResult.extractedFields.join(', ')}`);

    // Check what missing data we found
    const foundData = {};
    missingFields.forEach(field => {
      if (scrapingResult.data && scrapingResult.data[field] !== null && scrapingResult.data[field] !== undefined) {
        foundData[field] = scrapingResult.data[field];
        console.log(`✨ Found ${field}: ${foundData[field]}`);
      }
    });

    if (Object.keys(foundData).length === 0) {
      console.log('⚠️  No missing data found in scraped result');
      return { success: false, reason: 'no_useful_data' };
    }

    return {
      success: true,
      titleId: title.title_id,
      titleName,
      foundData,
      scrapingResult
    };

  } catch (error) {
    console.log(`❌ Processing error: ${error.message}`);
    return { success: false, reason: 'processing_error', error: error.message };
  }
}

/**
 * Generate SQL UPDATE statement for a title
 */
function generateSqlUpdate(titleId, foundData, titleName) {
  const updates = [];
  const values = [];

  Object.entries(foundData).forEach(([field, value]) => {
    if (value !== null && value !== undefined) {
      if (typeof value === 'string') {
        updates.push(`${field} = $${updates.length + 1}`);
        values.push(value.replace(/'/g, "''"));  // Escape quotes
      } else if (typeof value === 'number') {
        updates.push(`${field} = $${updates.length + 1}`);
        values.push(value);
      } else if (typeof value === 'boolean') {
        updates.push(`${field} = $${updates.length + 1}`);
        values.push(value);
      }
    }
  });

  if (updates.length === 0) return null;

  // Add updated_at timestamp
  updates.push(`updated_at = $${updates.length + 1}`);
  values.push(new Date().toISOString());

  const sql = `-- Update ${titleName} (${titleId})
UPDATE titles 
SET ${updates.join(', ')}
WHERE title_id = '${titleId}';`;

  const parameterizedSql = `-- Update ${titleName} (${titleId})
UPDATE titles 
SET ${updates.join(', ')}
WHERE title_id = '${titleId}';`;

  // Also provide values for reference
  const valueComments = values.map((val, idx) => 
    `-- $${idx + 1} = ${typeof val === 'string' ? `'${val}'` : val}`
  ).join('\n');

  return {
    sql: sql,
    parameterizedSql,
    valueComments,
    values
  };
}

/**
 * Process all titles and generate results
 */
async function processAllTitles() {
  console.log('🚀 Starting Data Generator Scraper');
  console.log('===================================');
  
  if (isDryRun) {
    console.log('🧪 DRY RUN MODE - No database changes will be made');
  }
  
  if (targetFields.length < 4) {
    console.log(`🎯 Target fields: ${targetFields.join(', ')}`);
  }

  // Check scraper API health
  console.log('\n🏥 Checking scraper API health...');
  const apiHealthy = await scraperClient.healthCheck();
  if (!apiHealthy) {
    console.error('❌ Scraper API is not available at:', SCRAPER_API_URL);
    console.error('💡 Make sure the backend server is running:');
    console.error('   cd backend && npm start');
    process.exit(1);
  }
  console.log('✅ Scraper API is healthy');

  // Find titles with missing data
  const titles = await findTitlesWithMissingData();
  
  if (titles.length === 0) {
    console.log('✅ No titles found with missing data!');
    return;
  }

  console.log(`\n📋 Processing ${titles.length} titles...`);

  const results = {
    successful: [],
    failed: [],
    sqlQueries: [],
    summary: {
      total: titles.length,
      success: 0,
      failed: 0,
      fieldsUpdated: {},
      failureReasons: {}
    }
  };

  // Process each title
  for (let i = 0; i < titles.length; i++) {
    const result = await processTitle(titles[i], i, titles.length);
    
    if (result.success) {
      results.successful.push(result);
      results.summary.success++;
      
      // Count updated fields
      Object.keys(result.foundData).forEach(field => {
        results.summary.fieldsUpdated[field] = (results.summary.fieldsUpdated[field] || 0) + 1;
      });

      // Generate SQL
      const sqlResult = generateSqlUpdate(result.titleId, result.foundData, result.titleName);
      if (sqlResult) {
        results.sqlQueries.push(sqlResult);
      }
      
    } else {
      results.failed.push(result);
      results.summary.failed++;
      
      // Count failure reasons
      results.summary.failureReasons[result.reason] = 
        (results.summary.failureReasons[result.reason] || 0) + 1;
    }

    // Add delay to avoid overwhelming the scraper
    if (i < titles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }

  return results;
}

/**
 * Process a single title (wrapper for scrapeTitle)
 */
async function processTitle(title, index, total) {
  return await scrapeTitle(title, index, total);
}

/**
 * Display results summary
 */
function displayResults(results) {
  console.log('\n📊 PROCESSING SUMMARY');
  console.log('=====================');
  console.log(`✅ Successful: ${results.summary.success}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`📈 Success Rate: ${((results.summary.success / results.summary.total) * 100).toFixed(1)}%`);

  if (Object.keys(results.summary.fieldsUpdated).length > 0) {
    console.log('\n📋 Fields Updated:');
    Object.entries(results.summary.fieldsUpdated).forEach(([field, count]) => {
      console.log(`  • ${field}: ${count} titles`);
    });
  }

  if (Object.keys(results.summary.failureReasons).length > 0) {
    console.log('\n❌ Failure Reasons:');
    Object.entries(results.summary.failureReasons).forEach(([reason, count]) => {
      console.log(`  • ${reason}: ${count}`);
    });
  }

  if (results.sqlQueries.length > 0) {
    console.log(`\n💾 Generated ${results.sqlQueries.length} SQL update queries`);
    
    // Write SQL to file
    const sqlContent = results.sqlQueries.map(query => 
      `${query.valueComments}\n${query.sql}\n`
    ).join('\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `title_updates_${timestamp}.sql`;
    
    // For Node.js environment
    import('fs').then(fs => {
      fs.writeFileSync(filename, sqlContent);
      console.log(`📄 SQL queries saved to: ${filename}`);
    }).catch(() => {
      console.log('\n📋 SQL QUERIES TO EXECUTE:');
      console.log('=========================');
      console.log(sqlContent);
    });
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    const results = await processAllTitles();
    
    if (results) {
      displayResults(results);
      
      console.log('\n🎉 Data generation complete!');
      
      if (results.sqlQueries.length > 0) {
        console.log('\n📝 Next Steps:');
        console.log('1. Review the generated SQL queries');
        console.log('2. Test on a staging database first');
        console.log('3. Execute the queries in Supabase SQL Editor');
        console.log('4. Verify the updated data');
      }
    }

  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { main, findTitlesWithMissingData, scrapeTitle, generateSqlUpdate };