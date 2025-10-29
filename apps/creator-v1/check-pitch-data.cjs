const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dlrnrgcoguxlkkcitlpd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'
);

async function checkPitchData() {
  console.log('🔍 Checking for titles with pitch data...');

  // Get a sample of all titles to see what's there
  const { data: allTitles, error } = await supabase
    .from('titles')
    .select('title_id, title_name_en, title_name_kr, pitch')
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Total titles in sample: ${allTitles.length}`);

  const titlesWithPitch = allTitles.filter(title => title.pitch && title.pitch.trim() !== '');
  console.log(`📋 Titles with pitch data in sample: ${titlesWithPitch.length}`);

  if (titlesWithPitch.length > 0) {
    console.log('\n✅ Examples of titles with pitch data:');
    titlesWithPitch.forEach((title, index) => {
      console.log(`${index + 1}. ${title.title_name_en || title.title_name_kr}`);
      console.log(`   ID: ${title.title_id}`);
      console.log(`   Pitch URL: ${title.pitch}`);
      console.log('');
    });
  } else {
    console.log('\n❌ No titles found with pitch data in sample');
    console.log('\nSample of pitch field values:');
    allTitles.slice(0, 5).forEach((title, index) => {
      console.log(`${index + 1}. ${title.title_name_en || title.title_name_kr}`);
      console.log(`   Pitch field: "${title.pitch}"`);
      console.log(`   Is empty/null: ${!title.pitch || title.pitch.trim() === ''}`);
      console.log('');
    });
  }

  // Now check all titles with non-empty pitch
  const { data: allTitlesWithPitch, error: countError } = await supabase
    .from('titles')
    .select('title_id, title_name_en, pitch')
    .not('pitch', 'is', null)
    .neq('pitch', '');

  if (!countError) {
    console.log(`\n📊 Total titles with non-empty pitch field: ${allTitlesWithPitch.length}`);
    if (allTitlesWithPitch.length > 0) {
      console.log('\nFirst few titles with pitch data:');
      allTitlesWithPitch.slice(0, 3).forEach((title, index) => {
        console.log(`${index + 1}. ${title.title_name_en}`);
        console.log(`   Pitch: ${title.pitch}`);
      });
    }
  } else {
    console.error('❌ Error getting count:', countError);
  }
}

checkPitchData().catch(console.error);