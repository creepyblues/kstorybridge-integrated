const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dlrnrgcoguxlkkcitlpd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'
);

async function testPitchFilter() {
  console.log('🧪 Testing pitch filter logic...\n');

  // 1. Get all titles and simulate the filter
  const { data: allTitles, error } = await supabase
    .from('titles')
    .select('title_id, title_name_en, title_name_kr, pitch')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching titles:', error);
    return;
  }

  console.log(`📊 Total titles: ${allTitles.length}`);

  // 2. Apply the same filter logic used in the frontend
  const titlesWithPitch = allTitles.filter(title => title.pitch && title.pitch.trim() !== '');

  console.log(`🎯 Titles with pitch (filter result): ${titlesWithPitch.length}`);

  if (titlesWithPitch.length > 0) {
    console.log('\n✅ Examples of titles that should pass the filter:');
    titlesWithPitch.slice(0, 5).forEach((title, index) => {
      console.log(`${index + 1}. ${title.title_name_en || title.title_name_kr}`);
      console.log(`   ID: ${title.title_id}`);
      console.log(`   Pitch: "${title.pitch}"`);
      console.log(`   Pitch length: ${title.pitch ? title.pitch.length : 0}`);
      console.log('');
    });
  }

  // 3. Check for potential data issues
  const titlesWithNullString = allTitles.filter(title => title.pitch === 'null');
  if (titlesWithNullString.length > 0) {
    console.log(`⚠️  Found ${titlesWithNullString.length} titles with pitch = "null" (string, not null)`);
  }

  const titlesWithEmptyString = allTitles.filter(title => title.pitch === '');
  if (titlesWithEmptyString.length > 0) {
    console.log(`⚠️  Found ${titlesWithEmptyString.length} titles with pitch = "" (empty string)`);
  }

  const titlesWithNull = allTitles.filter(title => title.pitch === null);
  console.log(`📋 Titles with pitch = null: ${titlesWithNull.length}`);

  // 4. Test the exact filter condition
  console.log('\n🔍 Testing filter conditions:');
  console.log(`Filter: title.pitch && title.pitch.trim() !== ''`);

  const testCases = [
    { pitch: null, description: 'null' },
    { pitch: '', description: 'empty string' },
    { pitch: '   ', description: 'whitespace only' },
    { pitch: 'null', description: 'string "null"' },
    { pitch: 'https://example.com/pitch.pdf', description: 'valid URL' }
  ];

  testCases.forEach(testCase => {
    const passes = testCase.pitch && testCase.pitch.trim() !== '';
    console.log(`  ${testCase.description}: ${passes ? '✅ PASS' : '❌ FAIL'}`);
  });
}

testPitchFilter().catch(console.error);