import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🔍 Checking database contents...');

  try {
    // Check titles table structure and content
    console.log('\n📋 Checking titles table...');
    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('*')
      .limit(5);

    if (titlesError) {
      console.error('Error fetching titles:', titlesError);
    } else {
      console.log(`Found ${titles.length} titles in the table`);
      if (titles.length > 0) {
        console.log('\nSample title:');
        console.log(JSON.stringify(titles[0], null, 2));
        
        console.log('\nAll titles (showing name fields only):');
        titles.forEach((title, i) => {
          console.log(`${i + 1}. EN: "${title.title_name_en}" | KR: "${title.title_name_kr}"`);
        });
      } else {
        console.log('The titles table is empty.');
      }
    }

    // Check user_buyers table
    console.log('\n👤 Checking user_buyers table...');
    const { data: buyers, error: buyersError } = await supabase
      .from('user_buyers')
      .select('id, email, full_name, tier')
      .limit(3);

    if (buyersError) {
      console.error('Error fetching buyers:', buyersError);
    } else {
      console.log(`Found ${buyers.length} buyer profiles`);
    }

    // Check user_creators table
    console.log('\n🎨 Checking user_creators table...');
    const { data: creators, error: creatorsError } = await supabase
      .from('user_creators')
      .select('id, email, full_name, pen_name')
      .limit(3);

    if (creatorsError) {
      console.error('Error fetching creators:', creatorsError);
    } else {
      console.log(`Found ${creators.length} creator profiles`);
    }

    // Try to list all tables (this might not work with RLS)
    console.log('\n📊 Attempting to get table info...');
    const { data: tablesInfo, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('Cannot access table schema (likely due to permissions)');
    } else {
      console.log('Available tables:', tablesInfo?.map(t => t.table_name));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();