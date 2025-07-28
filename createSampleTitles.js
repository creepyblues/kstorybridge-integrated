import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sample titles that might match some of your image files
const sampleTitles = [
  {
    title_name_en: "Under the Oak Tree",
    title_name_kr: "떡갈나무 아래",
    genre: "romance",
    content_format: "webtoon"
  },
  {
    title_name_en: "Cold-Blooded Beast", 
    title_name_kr: "냉혈한 야수",
    genre: "fantasy",
    content_format: "webtoon"
  },
  {
    title_name_en: "The Devil and His Sacrifice",
    title_name_kr: "악마와 그의 제물",
    genre: "fantasy", 
    content_format: "webtoon"
  },
  {
    title_name_en: "Betrayal of Dignity",
    title_name_kr: "존엄의 배신",
    genre: "drama",
    content_format: "webtoon"
  },
  {
    title_name_en: "4 Week Lovers",
    title_name_kr: "4주간의 연인들",
    genre: "romance",
    content_format: "webtoon"
  },
  {
    title_name_en: "Finding Camellia",
    title_name_kr: "동백꽃 찾기",
    genre: "romance",
    content_format: "webtoon"
  },
  {
    title_name_en: "Lady Devil",
    title_name_kr: "레이디 데빌",
    genre: "fantasy",
    content_format: "webtoon"
  },
  {
    title_name_en: "Trophy Husband",
    title_name_kr: "트로피 남편",
    genre: "romance",
    content_format: "webtoon"
  },
  {
    title_name_en: "Winter Wolf",
    title_name_kr: "겨울 늑대",
    genre: "fantasy",
    content_format: "webtoon"
  },
  {
    title_name_en: "The Secret of Umbra",
    title_name_kr: "움브라의 비밀",
    genre: "mystery",
    content_format: "webtoon"
  }
];

async function main() {
  console.log('📚 Creating sample titles for testing...');

  // Use a dummy creator ID - in real use this should be a valid user ID
  const creatorId = '00000000-0000-0000-0000-000000000001';
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sampleTitles.length; i++) {
    const titleData = sampleTitles[i];
    
    try {
      const fullTitleData = {
        title_id: uuidv4(),
        title_name_en: titleData.title_name_en,
        title_name_kr: titleData.title_name_kr,
        creator_id: creatorId,
        genre: titleData.genre,
        content_format: titleData.content_format,
        synopsis: `An exciting story about ${titleData.title_name_en}. This compelling narrative explores themes of adventure, friendship, and personal growth.`,
        rating: (Math.floor(Math.random() * 20) + 40) / 10, // 4.0-5.9
        likes: Math.floor(Math.random() * 5000) + 100,
        views: Math.floor(Math.random() * 50000) + 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log(`[${i + 1}/${sampleTitles.length}] Creating: ${titleData.title_name_en}`);

      const { data: insertedTitle, error: insertError } = await supabase
        .from('titles')
        .insert(fullTitleData)
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Failed to create "${titleData.title_name_en}":`, insertError.message);
        errorCount++;
      } else {
        console.log(`✅ Created: ${titleData.title_name_en}`);
        successCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error creating "${titleData.title_name_en}":`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log(`✅ Successfully created: ${successCount} titles`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Sample titles created! Now you can run the image upload script.');
    console.log('💡 Run: node smartImageUpload.js');
  } else {
    console.log('\n⚠️  No titles were created. This might be due to:');
    console.log('1. Row Level Security policies requiring authentication');
    console.log('2. Missing foreign key constraints (creator_id must exist in auth.users)');
    console.log('3. Other database constraints');
    console.log('\n💡 You may need to:');
    console.log('- Create titles manually in Supabase dashboard');
    console.log('- Or provide a service role key for bypassing RLS');
    console.log('- Or authenticate first and use a real user ID');
  }
}

main();