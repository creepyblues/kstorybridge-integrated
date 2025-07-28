#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Please set it with: export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createFeaturedTable() {
  try {
    console.log('🔄 Creating featured table...');
    
    // Create the featured table
    const createTableSQL = `
      -- Create featured table
      CREATE TABLE IF NOT EXISTS public.featured (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title_id UUID NOT NULL,
          note TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          CONSTRAINT featured_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id) ON DELETE CASCADE
      );

      -- Create index for better query performance
      CREATE INDEX IF NOT EXISTS idx_featured_title_id ON public.featured(title_id);

      -- Add tagline column to titles table if it doesn't exist
      ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS tagline TEXT;
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.log('Table creation SQL failed, trying direct approach...');
      
      // Try creating table directly with individual queries
      const { error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'featured')
        .single();
      
      if (tableError && tableError.code === 'PGRST116') {
        console.log('Featured table does not exist, you need to run this SQL manually in Supabase dashboard:');
        console.log(`
-- Create featured table
CREATE TABLE IF NOT EXISTS public.featured (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title_id UUID NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT featured_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_featured_title_id ON public.featured(title_id);

-- Add tagline column to titles table if it doesn't exist
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Add RLS policies
ALTER TABLE public.featured ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow read access to featured titles" ON public.featured
    FOR SELECT USING (true);

-- Allow insert/update/delete for authenticated users
CREATE POLICY "Allow full access to authenticated users" ON public.featured
    FOR ALL USING (auth.role() = 'authenticated');
        `);
        return;
      }
    }

    // Insert the featured titles
    const featuredTitles = [
      { title_id: 'b8f1367c-94a7-41a2-baf6-a8ac974584ef', note: 'Featured title 1' },
      { title_id: 'ea2167ba-3d89-4c09-979c-1d5114bfcb19', note: 'Featured title 2' },
      { title_id: 'e388e37f-7a11-4ca4-8164-15339c6bfda4', note: 'Featured title 3' },
      { title_id: 'e87ca7b0-976c-44c8-84be-898611bd62ff', note: 'Featured title 4' },
      { title_id: '38198638-610d-4eaa-a7f0-941cdd8b3d77', note: 'Featured title 5' },
      { title_id: '234b05fd-1624-4fe6-9318-4baea38688e3', note: 'Featured title 6' }
    ];

    console.log('🔄 Inserting featured titles...');

    const { data, error } = await supabase
      .from('featured')
      .insert(featuredTitles)
      .select();

    if (error) {
      console.error('❌ Error inserting featured titles:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('\n📝 Please run the SQL above in your Supabase dashboard first, then run this script again.');
      }
      return;
    }

    console.log(`✅ Successfully created featured table and inserted ${data.length} featured titles`);
    console.log('\n📋 Featured titles:');
    data.forEach((featured, index) => {
      console.log(`   ${index + 1}. Title ID: ${featured.title_id} - Note: ${featured.note}`);
    });

  } catch (error) {
    console.error('❌ Error creating featured table:', error.message);
    process.exit(1);
  }
}

// Run the script
createFeaturedTable();