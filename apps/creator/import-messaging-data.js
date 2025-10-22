#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load cleaned messaging data and output it in a format
// that can be easily copied to the messaging management interface
function prepareMessagingForImport() {
  const cleanedPath = path.join(__dirname, 'cleaned-messaging.json');

  if (!fs.existsSync(cleanedPath)) {
    console.error('❌ No cleaned-messaging.json file found. Run clean-messaging.js first.');
    process.exit(1);
  }

  const cleanedData = JSON.parse(fs.readFileSync(cleanedPath, 'utf8'));
  console.log(`📊 Preparing ${cleanedData.length} messaging entries for import...`);

  // Create a summary of the messaging data for quick review
  console.log('\n📋 MESSAGING DATA SUMMARY:');
  console.log('='.repeat(80));

  const buyerPages = cleanedData.filter(item => item.accountType === 'buyer');
  const creatorPages = cleanedData.filter(item => item.accountType === 'creator');

  console.log(`\n🛒 BUYER PAGES (${buyerPages.length} pages):`);
  buyerPages.forEach(item => {
    console.log(`\n  📄 ${item.pageName} (${item.route})`);
    console.log(`      Title: "${item.title}"`);
    if (item.description) console.log(`      Description: "${item.description}"`);
    if (item.emptyStateTitle) console.log(`      Empty State: "${item.emptyStateTitle}"`);
    if (item.emptyStateDescription) console.log(`      Empty Desc: "${item.emptyStateDescription}"`);
  });

  console.log(`\n🎨 CREATOR PAGES (${creatorPages.length} pages):`);
  creatorPages.forEach(item => {
    console.log(`\n  📄 ${item.pageName} (${item.route})`);
    console.log(`      Title: "${item.title}"`);
    if (item.description) console.log(`      Description: "${item.description}"`);
    if (item.emptyStateTitle) console.log(`      Empty State: "${item.emptyStateTitle}"`);
    if (item.emptyStateDescription) console.log(`      Empty Desc: "${item.emptyStateDescription}"`);
  });

  // Create a mapping for easy lookup during manual updates
  console.log('\n🔍 ROUTE TO MESSAGING MAPPING:');
  console.log('='.repeat(80));
  console.log('Copy these values to update the messaging interface manually:\n');

  cleanedData.forEach(item => {
    console.log(`Route: ${item.route}`);
    console.log(`  Title: ${item.title}`);
    console.log(`  Description: ${item.description || 'NULL'}`);
    console.log(`  Empty State Title: ${item.emptyStateTitle || 'NULL'}`);
    console.log(`  Empty State Description: ${item.emptyStateDescription || 'NULL'}`);
    console.log('');
  });

  // Create JavaScript object format for easy copying
  const jsFormat = cleanedData.map(item => ({
    route: item.route,
    title: item.title,
    description: item.description || null,
    emptyStateTitle: item.emptyStateTitle || null,
    emptyStateDescription: item.emptyStateDescription || null
  }));

  const jsOutputPath = path.join(__dirname, 'messaging-for-import.json');
  fs.writeFileSync(jsOutputPath, JSON.stringify(jsFormat, null, 2));

  console.log('\n📊 SUMMARY:');
  console.log(`   Total pages processed: ${cleanedData.length}`);
  console.log(`   Buyer pages: ${buyerPages.length}`);
  console.log(`   Creator pages: ${creatorPages.length}`);
  console.log(`   JavaScript format saved to: ${jsOutputPath}`);

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Visit http://localhost:8084/docs/messaging in your browser');
  console.log('2. Use the inline editing interface to update page messaging');
  console.log('3. Copy the values from the mapping above to update each page');
  console.log('4. Click "Update" button for each row after making changes');

  return jsFormat;
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  prepareMessagingForImport();
}