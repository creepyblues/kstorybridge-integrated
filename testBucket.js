import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🧪 Testing storage bucket access...');

const { data: testFiles, error: testError } = await supabase.storage
  .from('title-images')
  .list('', { limit: 1 });

if (testError) {
  console.error('❌ Bucket not accessible:', testError.message);
  console.log('💡 Please create the bucket manually as instructed above');
} else {
  console.log('✅ Storage bucket is accessible!');
  console.log('🎉 Ready to upload images!');
  console.log('\n💡 Now run: node authenticatedImageUpload.js');
}