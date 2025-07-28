#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createSampleTitles() {
  try {
    console.log('🔄 Creating sample titles...');
    
    const sampleTitles = [
      {
        title_id: 'b8f1367c-94a7-41a2-baf6-a8ac974584ef',
        title_name_en: 'The Scholar Who Walks the Night',
        title_name_kr: '밤을 걷는 선비',
        creator_id: '11111111-1111-1111-1111-111111111111', // placeholder
        title_image: 'https://images.unsplash.com/photo-1524781289445-ddf8f5695861?w=400',
        tagline: 'A vampire scholar fights evil in Joseon Dynasty Korea',
        genre: 'fantasy',
        content_format: 'webtoon'
      },
      {
        title_id: 'ea2167ba-3d89-4c09-979c-1d5114bfcb19',
        title_name_en: 'Tower of God',
        title_name_kr: '신의 탑',
        creator_id: '11111111-1111-1111-1111-111111111111',
        title_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        tagline: 'Climb the tower to find your destiny',
        genre: 'action',
        content_format: 'webtoon'
      },
      {
        title_id: 'e388e37f-7a11-4ca4-8164-15339c6bfda4',
        title_name_en: 'True Beauty',
        title_name_kr: '여신강림',
        creator_id: '11111111-1111-1111-1111-111111111111',
        title_image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
        tagline: 'A girl transforms with makeup and finds love',
        genre: 'romance',
        content_format: 'webtoon'
      },
      {
        title_id: 'e87ca7b0-976c-44c8-84be-898611bd62ff',
        title_name_en: 'Solo Leveling',
        title_name_kr: '나 혼자만 레벨업',
        creator_id: '11111111-1111-1111-1111-111111111111',
        title_image: 'https://images.unsplash.com/photo-1542396601-dca920ea2807?w=400',
        tagline: 'The weakest hunter becomes the strongest',
        genre: 'action',
        content_format: 'web_novel'
      },
      {
        title_id: '38198638-610d-4eaa-a7f0-941cdd8b3d77',
        title_name_en: 'Cheese in the Trap',
        title_name_kr: '치즈인더트랩',
        creator_id: '11111111-1111-1111-1111-111111111111',
        title_image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400',
        tagline: 'College romance with dark secrets',
        genre: 'drama',
        content_format: 'webtoon'
      },
      {
        title_id: '234b05fd-1624-4fe6-9318-4baea38688e3',
        title_name_en: 'Sweet Home',
        title_name_kr: '스위트홈',
        creator_id: '11111111-1111-1111-1111-111111111111',
        title_image: 'https://images.unsplash.com/photo-1520637836862-4d197d17c60a?w=400',
        tagline: 'Survive the monster apocalypse',
        genre: 'horror',
        content_format: 'webtoon'
      }
    ];

    console.log('🔄 Inserting sample titles...');

    const { data, error } = await supabase
      .from('titles')
      .insert(sampleTitles)
      .select();

    if (error) {
      console.error('❌ Error inserting titles:', error);
      
      if (error.message.includes('creator_id')) {
        console.log('\n📝 You may need to adjust the creator_id values or check the schema');
        console.log('You can run this SQL in Supabase dashboard:');
        console.log(`
INSERT INTO public.titles (title_id, title_name_en, title_name_kr, creator_id, title_image, tagline, genre, content_format) VALUES
  ('b8f1367c-94a7-41a2-baf6-a8ac974584ef', 'The Scholar Who Walks the Night', '밤을 걷는 선비', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1524781289445-ddf8f5695861?w=400', 'A vampire scholar fights evil in Joseon Dynasty Korea', 'fantasy', 'webtoon'),
  ('ea2167ba-3d89-4c09-979c-1d5114bfcb19', 'Tower of God', '신의 탑', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', 'Climb the tower to find your destiny', 'action', 'webtoon'),
  ('e388e37f-7a11-4ca4-8164-15339c6bfda4', 'True Beauty', '여신강림', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400', 'A girl transforms with makeup and finds love', 'romance', 'webtoon'),
  ('e87ca7b0-976c-44c8-84be-898611bd62ff', 'Solo Leveling', '나 혼자만 레벨업', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1542396601-dca920ea2807?w=400', 'The weakest hunter becomes the strongest', 'action', 'web_novel'),
  ('38198638-610d-4eaa-a7f0-941cdd8b3d77', 'Cheese in the Trap', '치즈인더트랩', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400', 'College romance with dark secrets', 'drama', 'webtoon'),
  ('234b05fd-1624-4fe6-9318-4baea38688e3', 'Sweet Home', '스위트홈', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1520637836862-4d197d17c60a?w=400', 'Survive the monster apocalypse', 'horror', 'webtoon');
        `);
      }
      return;
    }

    console.log(`✅ Successfully created ${data.length} sample titles`);
    console.log('\n📋 Created titles:');
    data.forEach((title, index) => {
      console.log(`   ${index + 1}. ${title.title_name_en} (${title.title_name_kr})`);
      console.log(`      ID: ${title.title_id}`);
      console.log(`      Tagline: ${title.tagline}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createSampleTitles();