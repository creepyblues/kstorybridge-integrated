#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// You'll need to set the service role key to insert data
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Please set it with: export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sample titles with real webtoon URLs for testing
const sampleTitles = [
  {
    title_name_en: "Solo Leveling",
    title_name_kr: "나 혼자만 레벨업",
    title_url: "https://www.webtoons.com/en/action/solo-leveling/list?title_no=1968",
    author: "Chugong",
    illustrator: "DUBU (REDICE STUDIO)",
    genre: "action",
    content_format: "webtoon",
    creator_id: "sample-creator-1",
    synopsis: "10 years ago, after 'the Gate' that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate. They are known as 'Hunters'."
  },
  {
    title_name_en: "Tower of God",
    title_name_kr: "신의 탑",
    title_url: "https://www.webtoons.com/en/fantasy/tower-of-god/list?title_no=95",
    author: "SIU",
    genre: "fantasy",
    content_format: "webtoon",
    creator_id: "sample-creator-2",
    synopsis: "What do you desire? Money and wealth? Honor and pride? Authority and power? Revenge? Or something that transcends them all? Whatever you desire—it's here on the top floor."
  },
  {
    title_name_en: "The God of High School",
    title_name_kr: "갓 오브 하이스쿨",
    title_url: "https://www.webtoons.com/en/action/the-god-of-high-school/list?title_no=66",
    author: "Yongje Park",
    genre: "action",
    content_format: "webtoon",
    creator_id: "sample-creator-3",
    synopsis: "While an island half-disappearing from the face of the earth, a mysterious organization is sending out invitations for a tournament to every skilled fighter in the world."
  }
];

async function addSampleTitles() {
  console.log('📝 Adding sample titles to database...\n');

  try {
    for (let i = 0; i < sampleTitles.length; i++) {
      const title = sampleTitles[i];
      console.log(`[${i + 1}/${sampleTitles.length}] Adding: ${title.title_name_en}`);
      
      const { data, error } = await supabase
        .from('titles')
        .insert([title])
        .select();

      if (error) {
        console.log(`❌ Failed to add ${title.title_name_en}: ${error.message}`);
      } else {
        console.log(`✅ Added successfully with ID: ${data[0].title_id}`);
      }
    }

    console.log('\n🎉 Sample titles added successfully!');
    console.log('\nYou can now run the cover image extraction script:');
    console.log('node extractCoverImages.js');

  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

addSampleTitles();