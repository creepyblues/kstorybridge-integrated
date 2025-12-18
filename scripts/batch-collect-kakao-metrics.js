/**
 * Batch Collect Kakao Webtoon Metrics
 *
 * Scrapes metrics from Kakao Webtoon and updates the titles table.
 *
 * Usage:
 *   node scripts/batch-collect-kakao-metrics.js [--dry-run]
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

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Headers that mimic a Korean browser
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};

// Titles to process (Kakao Webtoon URLs only)
const TITLES_TO_PROCESS = [
  {
    title_id: '8e9680ca-6e23-4b5e-9868-b30717bb8705',
    title_name_en: 'A good relationship',
    title_name_kr: '염라의 숨결',
    content_id: '3374'
  },
  {
    title_id: '211aa976-c2fa-4997-a8c3-c980f5501978',
    title_name_en: 'Betelgeuse',
    title_name_kr: '베텔게우스',
    content_id: '3639'
  },
  {
    title_id: 'e1cc2346-690b-42d0-a8cc-46626ca8901e',
    title_name_en: 'Jujak Academy',
    title_name_kr: '주작학원',
    content_id: '3492'
  },
  {
    title_id: 'bcfb591e-2b12-43ff-836d-c90acfba9976',
    title_name_en: 'Samgaksan Fairy Bath',
    title_name_kr: '삼각산 선녀탕',
    content_id: '3635'
  }
];

/**
 * Scrape Kakao Webtoon by content ID
 */
async function scrapeKakaoWebtoon(contentId) {
  console.log(`  [Scraping] Content ID: ${contentId}`);

  try {
    // Fetch with placeholder slug - it redirects to correct URL
    const url = `https://webtoon.kakao.com/content/_/${contentId}`;

    const response = await fetch(url, {
      headers: HEADERS,
      redirect: 'follow'
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();

    // Extract __NEXT_DATA__ JSON
    const startMarker = '<script id="__NEXT_DATA__" type="application/json">';
    const endMarker = '</script>';

    const startIndex = html.indexOf(startMarker);
    if (startIndex === -1) {
      return { success: false, error: '__NEXT_DATA__ not found' };
    }

    const jsonStart = startIndex + startMarker.length;
    const jsonEnd = html.indexOf(endMarker, jsonStart);
    if (jsonEnd === -1) {
      return { success: false, error: '__NEXT_DATA__ end marker not found' };
    }

    const jsonString = html.substring(jsonStart, jsonEnd);
    const nextData = JSON.parse(jsonString);

    // Extract content from initialState.content.contentMap
    const contentMap = nextData?.props?.initialState?.content?.contentMap;
    if (!contentMap) {
      return { success: false, error: 'contentMap not found' };
    }

    const content = contentMap[contentId] || contentMap[String(contentId)];
    if (!content) {
      return { success: false, error: `Content not found for ID: ${contentId}` };
    }

    // Extract metrics
    return {
      success: true,
      data: {
        title_ko: content.title || null,
        views: content.viewCount || null,
        likes: content.likeCount || null,
        synopsis_kr: content.synopsis || null,
        author: content.authors || null,
        genre: content.genre ? [content.genre] : null,
        completed: content.isStopContent || false,
        thumbnail: content.mainImg
          ? (content.mainImg.startsWith('//') ? `https:${content.mainImg}` : content.mainImg)
          : null
      }
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('================================================');
  console.log('  KAKAO WEBTOON METRICS COLLECTION');
  console.log('================================================');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '✏️ LIVE (will update database)'}`);
  console.log(`Titles to process: ${TITLES_TO_PROCESS.length}`);
  console.log('');

  const results = {
    success: [],
    failed: []
  };

  for (let i = 0; i < TITLES_TO_PROCESS.length; i++) {
    const title = TITLES_TO_PROCESS[i];
    console.log(`[${i + 1}/${TITLES_TO_PROCESS.length}] ${title.title_name_en} (${title.title_name_kr})`);

    const scrapeResult = await scrapeKakaoWebtoon(title.content_id);

    if (scrapeResult.success) {
      const data = scrapeResult.data;
      console.log(`  ✅ Found: views=${data.views}, likes=${data.likes}`);

      if (!DRY_RUN) {
        // Update titles table
        const updateData = {};
        if (data.views !== null) updateData.views = data.views;
        if (data.likes !== null) updateData.likes = data.likes;
        // Note: We only update metrics, not other fields to avoid overwriting existing data

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('titles')
            .update(updateData)
            .eq('title_id', title.title_id);

          if (updateError) {
            console.log(`  ⚠️ Update failed: ${updateError.message}`);
            results.failed.push({ ...title, error: updateError.message });
          } else {
            console.log(`  ✅ Updated: ${JSON.stringify(updateData)}`);
            results.success.push({ ...title, data: updateData });
          }
        } else {
          console.log(`  ⏭️ No data to update`);
        }
      } else {
        results.success.push({ ...title, data: scrapeResult.data });
      }
    } else {
      console.log(`  ❌ Failed: ${scrapeResult.error}`);
      results.failed.push({ ...title, error: scrapeResult.error });
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n================================================');
  console.log('                    SUMMARY');
  console.log('================================================');
  console.log(`✅ Successful: ${results.success.length}/${TITLES_TO_PROCESS.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${TITLES_TO_PROCESS.length}`);

  if (results.success.length > 0) {
    console.log('\n📊 Collected Data:');
    results.success.forEach(r => {
      console.log(`   ${r.title_name_en}: views=${r.data.views}, likes=${r.data.likes}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed titles:');
    results.failed.forEach(r => {
      console.log(`   ${r.title_name_en}: ${r.error}`);
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
