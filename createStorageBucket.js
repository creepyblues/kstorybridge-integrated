import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET_NAME = 'title-images';

async function main() {
  console.log('📁 Creating storage bucket for title images...');

  try {
    // First check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error checking existing buckets:', listError.message);
      console.log('💡 You may need to create the bucket manually in Supabase Dashboard');
      return;
    }

    const existingBucket = buckets.find(bucket => bucket.name === BUCKET_NAME);
    if (existingBucket) {
      console.log('✅ Storage bucket already exists!');
      console.log(`📊 Bucket details:`, existingBucket);
      return;
    }

    // Create the bucket
    console.log(`📁 Creating bucket: ${BUCKET_NAME}`);
    const { data: bucketData, error: createError } = await supabase.storage
      .createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
        maxFileSizeBytes: 10 * 1024 * 1024 // 10MB
      });

    if (createError) {
      console.error('❌ Failed to create bucket:', createError.message);
      
      if (createError.message.includes('row-level security')) {
        console.log('\n💡 SOLUTION: Create bucket manually');
        console.log('The API doesn\'t have permission to create buckets due to RLS policies.');
        console.log('\n🔧 Manual steps:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Click on "Storage" in the sidebar');
        console.log('3. Click "New bucket"');
        console.log(`4. Bucket name: ${BUCKET_NAME}`);
        console.log('5. Public bucket: ✅ Yes');
        console.log('6. File size limit: 10 MB');
        console.log('7. Allowed MIME types: image/png, image/jpeg, image/jpg');
        console.log('8. Click "Create bucket"');
      }
      
      return;
    }

    console.log('🎉 Storage bucket created successfully!');
    console.log('📊 Bucket details:', bucketData);
    
    // Test bucket access
    console.log('\n🧪 Testing bucket access...');
    const { data: testFiles, error: testError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });
    
    if (testError) {
      console.error('❌ Error accessing bucket:', testError.message);
    } else {
      console.log('✅ Bucket is accessible and ready for uploads!');
      console.log('💡 You can now run the image upload script');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

main();