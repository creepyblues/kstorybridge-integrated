#!/usr/bin/env node

/**
 * Extract Mock Data for Localhost Development
 * 
 * This script extracts real data from the Supabase database to create
 * mock data for localhost development, including:
 * - User data for sungho@kstorybridge.com from user_buyers table
 * - Top 6 featured titles from featured table with titles data
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function extractMockData() {
  console.log('🚀 Starting Mock Data Extraction');
  console.log('===================================');

  const mockData = {
    timestamp: new Date().toISOString(),
    user_buyers: null,
    featured_titles: [],
    titles: [],
    extraction_summary: {
      user_found: false,
      featured_count: 0,
      titles_count: 0
    }
  };

  try {
    // 1. Extract user data for sungho@kstorybridge.com
    console.log('👤 Extracting user data for sungho@kstorybridge.com...');
    
    const { data: userData, error: userError } = await supabase
      .from('user_buyers')
      .select('*')
      .eq('email', 'sungho@kstorybridge.com')
      .single();

    if (userError) {
      console.log('❌ User not found or error:', userError.message);
    } else {
      console.log('✅ User data extracted successfully');
      mockData.user_buyers = userData;
      mockData.extraction_summary.user_found = true;
      
      // Log user details
      console.log(`   • User ID: ${userData.id}`);
      console.log(`   • Name: ${userData.full_name}`);
      console.log(`   • Tier: ${userData.tier}`);
      console.log(`   • Company: ${userData.company || 'Not specified'}`);
    }

    // 2. Extract top 6 featured titles with title data
    console.log('\n🌟 Extracting top 6 featured titles...');
    
    const { data: featuredData, error: featuredError } = await supabase
      .from('featured')
      .select(`
        *,
        titles (*)
      `)
      .order('created_at', { ascending: false })
      .limit(6);

    if (featuredError) {
      console.log('❌ Featured titles extraction failed:', featuredError.message);
    } else {
      console.log(`✅ Featured titles extracted: ${featuredData.length} items`);
      mockData.featured_titles = featuredData;
      mockData.extraction_summary.featured_count = featuredData.length;
      
      // Log featured titles
      featuredData.forEach((featured, index) => {
        const title = featured.titles;
        console.log(`   ${index + 1}. ${title.title_name_en || title.title_name_kr}`);
        console.log(`      • Genre: ${title.genre || 'Not specified'}`);
        console.log(`      • Views: ${title.views?.toLocaleString() || 'Not specified'}`);
      });
    }

    // 3. Extract top 6 titles (general titles table)
    console.log('\n📚 Extracting top 6 titles from titles table...');
    
    const { data: titlesData, error: titlesError } = await supabase
      .from('titles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);

    if (titlesError) {
      console.log('❌ Titles extraction failed:', titlesError.message);
    } else {
      console.log(`✅ Titles extracted: ${titlesData.length} items`);
      mockData.titles = titlesData;
      mockData.extraction_summary.titles_count = titlesData.length;
      
      // Log titles
      titlesData.forEach((title, index) => {
        console.log(`   ${index + 1}. ${title.title_name_en || title.title_name_kr}`);
        console.log(`      • Views: ${title.views?.toLocaleString() || 'Not specified'}`);
        console.log(`      • Genre: ${title.genre || 'Not specified'}`);
      });
    }

    // 4. Save to file
    const outputPath = path.join(process.cwd(), 'localhost_mock_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(mockData, null, 2));
    
    console.log('\n📁 Mock data saved to localhost_mock_data.json');
    console.log('\n📊 EXTRACTION SUMMARY');
    console.log('=====================');
    console.log(`✅ User found: ${mockData.extraction_summary.user_found}`);
    console.log(`✅ Featured titles: ${mockData.extraction_summary.featured_count}`);
    console.log(`✅ Regular titles: ${mockData.extraction_summary.titles_count}`);

    // 5. Generate TypeScript interfaces
    console.log('\n🔧 Generating TypeScript interfaces...');
    
    const tsInterfaces = `
// Auto-generated TypeScript interfaces for localhost mock data
// Generated on: ${new Date().toISOString()}

export interface MockUserBuyer {
  id: string;
  email: string;
  full_name: string;
  tier: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

export interface MockTitle {
  title_id: string;
  title_name_en?: string;
  title_name_kr: string;
  title_image?: string;
  views?: number;
  likes?: number;
  genre?: string;
  content_format?: string;
  story_author?: string;
  art_author?: string;
  tagline?: string;
  description?: string;
  pitch?: string;
  created_at: string;
  updated_at: string;
}

export interface MockFeaturedTitle {
  id: string;
  title_id: string;
  note?: string;
  created_at: string;
  updated_at: string;
  titles: MockTitle;
}

export interface LocalhostMockData {
  timestamp: string;
  user_buyers: MockUserBuyer | null;
  featured_titles: MockFeaturedTitle[];
  titles: MockTitle[];
  extraction_summary: {
    user_found: boolean;
    featured_count: number;
    titles_count: number;
  };
}
`;

    const tsPath = path.join(process.cwd(), 'localhost_mock_data.types.ts');
    fs.writeFileSync(tsPath, tsInterfaces);
    console.log('✅ TypeScript interfaces saved to localhost_mock_data.types.ts');

    return mockData;

  } catch (error) {
    console.error('💥 Extraction failed:', error);
    throw error;
  }
}

// Run extraction
if (import.meta.url === `file://${process.argv[1]}`) {
  extractMockData()
    .then(() => {
      console.log('\n🎉 Mock data extraction completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Mock data extraction failed:', error);
      process.exit(1);
    });
}

export { extractMockData };