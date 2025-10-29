import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createFeedbackTable() {
  console.log('Creating feedback_buyer table...');
  
  const { data, error } = await supabase.rpc('sql', {
    query: `
      -- Create feedback_buyer table for user feedback messages
      CREATE TABLE IF NOT EXISTS public.feedback_buyer (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create index for faster queries by user_id
      CREATE INDEX IF NOT EXISTS idx_feedback_buyer_user_id ON public.feedback_buyer(user_id);

      -- Create index for faster queries by created_at
      CREATE INDEX IF NOT EXISTS idx_feedback_buyer_created_at ON public.feedback_buyer(created_at DESC);

      -- Enable RLS (Row Level Security)
      ALTER TABLE public.feedback_buyer ENABLE ROW LEVEL SECURITY;

      -- Create policy to allow users to insert their own feedback
      DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback_buyer;
      CREATE POLICY "Users can insert their own feedback"
      ON public.feedback_buyer
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

      -- Create policy to allow users to view their own feedback
      DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback_buyer;
      CREATE POLICY "Users can view their own feedback"
      ON public.feedback_buyer
      FOR SELECT
      USING (auth.uid() = user_id);

      -- Grant permissions
      GRANT SELECT, INSERT ON public.feedback_buyer TO authenticated;
    `
  });

  if (error) {
    console.error('Error creating table:', error);
  } else {
    console.log('✅ Table created successfully:', data);
  }
}

// Test inserting a sample record
async function testInsert() {
  console.log('Testing table insert...');
  
  const { data, error } = await supabase
    .from('feedback_buyer')
    .insert({
      user_id: '12345678-1234-1234-1234-123456789012', // This will fail since user doesn't exist, but shows if table exists
      text: 'Test message'
    });

  if (error) {
    console.log('Expected error (user doesn\'t exist):', error.message);
    if (error.message.includes('relation "public.feedback_buyer" does not exist')) {
      console.log('❌ Table does not exist');
    } else {
      console.log('✅ Table exists but insert failed as expected');
    }
  } else {
    console.log('✅ Insert successful:', data);
  }
}

createFeedbackTable().then(() => testInsert());