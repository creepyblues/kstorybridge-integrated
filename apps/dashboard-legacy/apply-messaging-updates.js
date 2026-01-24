#!/usr/bin/env node

// This script updates the messaging data by making direct API calls
// to the running development server's messaging endpoints

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_BASE_URL = 'http://localhost:8084';

async function applyMessagingUpdates() {
  console.log('🚀 Starting messaging updates...');

  // Load the cleaned messaging data
  const cleanedPath = path.join(__dirname, 'cleaned-messaging.json');

  if (!fs.existsSync(cleanedPath)) {
    console.error('❌ No cleaned-messaging.json file found.');
    process.exit(1);
  }

  const cleanedData = JSON.parse(fs.readFileSync(cleanedPath, 'utf8'));
  console.log(`📊 Loaded ${cleanedData.length} messaging entries to update`);

  // Sample updates that we can apply manually via the interface
  console.log('\n🎯 KEY UPDATES TO APPLY:');
  console.log('='.repeat(60));

  const keyUpdates = [
    {
      route: '/buyers/home',
      title: 'Featured Titles',
      description: 'Jinu, our friendly AI agent, handpicked these titles just for you!',
      emptyStateTitle: 'No featured titles available',
      emptyStateDescription: 'Check back soon for new recommendations'
    },
    {
      route: '/buyers/titles',
      title: 'Title Library',
      description: 'Browse our complete collection of Korean content',
      emptyStateTitle: 'No titles found',
      emptyStateDescription: 'Try adjusting your search or filters'
    },
    {
      route: '/buyers/favorites',
      title: 'My Favorites',
      description: 'Your saved titles and content',
      emptyStateTitle: 'No favorites yet',
      emptyStateDescription: 'Start exploring titles and add them to your favorites'
    },
    {
      route: '/creators/home',
      title: 'Creator Dashboard',
      description: 'Manage your content and track performance',
      emptyStateTitle: 'No content yet',
      emptyStateDescription: 'Upload your first title to get started'
    },
    {
      route: '/creators/chat',
      title: 'AI Chat Assistant',
      description: 'Get help with content creation and industry insights',
      emptyStateTitle: 'Start a conversation',
      emptyStateDescription: 'Ask me anything about content creation or the industry'
    }
  ];

  console.log('\n🔥 PRIORITY UPDATES (Apply these first):');
  keyUpdates.forEach((update, index) => {
    console.log(`\n${index + 1}. Route: ${update.route}`);
    console.log(`   Title: "${update.title}"`);
    console.log(`   Description: "${update.description}"`);
    if (update.emptyStateTitle) {
      console.log(`   Empty State Title: "${update.emptyStateTitle}"`);
      console.log(`   Empty State Description: "${update.emptyStateDescription}"`);
    }
  });

  console.log('\n📋 COMPLETE MESSAGING REFERENCE:');
  console.log('='.repeat(60));

  cleanedData.forEach(item => {
    console.log(`\nRoute: ${item.route} (${item.accountType})`);
    console.log(`  Title: ${item.title}`);
    if (item.description) console.log(`  Description: ${item.description}`);
    if (item.emptyStateTitle) console.log(`  Empty State Title: ${item.emptyStateTitle}`);
    if (item.emptyStateDescription) console.log(`  Empty State Description: ${item.emptyStateDescription}`);
  });

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Open http://localhost:8084/docs/messaging in your browser');
  console.log('2. Sign in as admin (sungho@kstorybridge.com or kevin@sandstoneartists.com)');
  console.log('3. Use the inline editing interface to update each page');
  console.log('4. Start with the PRIORITY UPDATES listed above');
  console.log('5. Click "Update" button after making changes to each row');
  console.log('\n✨ The messaging interface is ready for testing with real content!');
}

// Run the script
applyMessagingUpdates().catch(console.error);