#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for buyer and creator routes
const ROUTES_CONFIG = {
  buyer: [
    { route: '/buyers/home', file: 'BuyerHome.tsx', name: 'Buyer Home' },
    { route: '/buyers/titles', file: 'TitleList.tsx', name: 'Browse Titles' },
    { route: '/buyers/titles/:id', file: 'TitleDetailNew.tsx', name: 'Title Detail' },
    { route: '/buyers/favorites', file: 'Favorites.tsx', name: 'My Favorites' },
    { route: '/buyers/requests', file: 'MyRequests.tsx', name: 'My Requests' },
    { route: '/buyers/deals', file: 'Deals.tsx', name: 'My Deals' },
    { route: '/buyers/browse', file: 'Browse.tsx', name: 'Browse Content' },
    { route: '/buyers/media', file: 'Media.tsx', name: 'Media Center' },
    { route: '/buyers/users', file: 'Users.tsx', name: 'User Management' },
    { route: '/buyers/settings', file: 'Settings.tsx', name: 'Settings' },
    { route: '/buyers/profile', file: 'Profile.tsx', name: 'Buyer Profile' },
    { route: '/buyers/plan', file: 'BuyersPricing.tsx', name: 'Subscription Plan' },
    { route: '/buyers/news', file: 'News.tsx', name: 'K-content News' },
    { route: '/buyers/send-message', file: 'SendMessage.tsx', name: 'Send Message' }
  ],
  creator: [
    { route: '/creators/home', file: 'CreatorHome.tsx', name: 'Creator Home' },
    { route: '/creators/titles', file: 'TitleList.tsx', name: 'Manage Titles' },
    { route: '/creators/titles/add', file: 'CreatorAddTitlePage.tsx', name: 'Add New Title' },
    { route: '/creators/titles/:id/edit', file: 'CreatorEditTitlePage.tsx', name: 'Edit Title' },
    { route: '/creators/titles/:id', file: 'CreatorTitleDetailNew.tsx', name: 'Title Detail' },
    { route: '/creators/requests', file: 'MyRequests.tsx', name: 'My Requests' },
    { route: '/creators/profile', file: 'Profile.tsx', name: 'Creator Profile' },
    { route: '/creators/news', file: 'News.tsx', name: 'K-content News' },
    { route: '/creators/send-message', file: 'SendMessage.tsx', name: 'Send Message' },
    { route: '/creators/chat', file: 'Chat.tsx', name: 'AI Chat' }
  ]
};

function extractMessagingFromFile(filePath, route, accountType) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Patterns to extract messaging
  const patterns = {
    // Main page titles (h1, h2 with font-bold)
    mainTitle: /<h[1-6][^>]*font[^>]*bold[^>]*>([^<]+)<\/h[1-6]>/gi,

    // Alternative title patterns
    titlePattern: /className="[^"]*text-(?:xl|2xl|3xl)[^"]*font[^"]*bold[^"]*"[^>]*>([^<]+)</g,

    // Description text following titles
    description: /<p[^>]*text[^>]*gray[^>]*>([^<]+)<\/p>/gi,

    // Button text
    buttonText: /<(?:Button|StandardButton)[^>]*>([^<]+)</g,

    // Empty state patterns
    emptyState: /(?:No [^<]+ (?:found|available)|Start [^<]+|Check back)/gi,

    // EmptyState component props
    emptyStateComponent: /<EmptyState[^>]*(?:title="([^"]*)")?[^>]*>/g,

    // Placeholder text
    placeholder: /placeholder="([^"]*)"/g
  };

  const extracted = {
    route,
    pageName: ROUTES_CONFIG[accountType].find(r => r.route === route)?.name || 'Unknown Page',
    accountType,
    title: '',
    subtitle: '',
    description: '',
    ctaText: '',
    emptyStateTitle: '',
    emptyStateDescription: ''
  };

  // Extract main titles
  let titleMatches = [];
  let match;

  // Try main title pattern first
  while ((match = patterns.mainTitle.exec(content)) !== null) {
    titleMatches.push(match[1].trim());
  }

  // Try alternative title pattern if no main titles found
  if (titleMatches.length === 0) {
    while ((match = patterns.titlePattern.exec(content)) !== null) {
      titleMatches.push(match[1].trim());
    }
  }

  // Set title (first found)
  if (titleMatches.length > 0) {
    extracted.title = titleMatches[0];
    // Set subtitle if there's a second title
    if (titleMatches.length > 1) {
      extracted.subtitle = titleMatches[1];
    }
  }

  // Extract descriptions
  const descriptions = [];
  while ((match = patterns.description.exec(content)) !== null) {
    descriptions.push(match[1].trim());
  }
  if (descriptions.length > 0) {
    extracted.description = descriptions[0];
  }

  // Extract button text for CTAs
  const buttons = [];
  while ((match = patterns.buttonText.exec(content)) !== null) {
    const buttonText = match[1].trim();
    if (!buttonText.includes('className') && buttonText.length < 50) {
      buttons.push(buttonText);
    }
  }
  if (buttons.length > 0) {
    extracted.ctaText = buttons[0];
  }

  // Extract empty state content
  const emptyStates = [];
  while ((match = patterns.emptyState.exec(content)) !== null) {
    emptyStates.push(match[0].trim());
  }
  if (emptyStates.length > 0) {
    extracted.emptyStateTitle = emptyStates[0];
  }

  // Extract EmptyState component props
  while ((match = patterns.emptyStateComponent.exec(content)) !== null) {
    if (match[1]) {
      extracted.emptyStateTitle = match[1];
    }
  }

  return extracted;
}

function generateDatabaseUpdates(messagingData) {
  console.log('\n📊 Generated Database Update SQL:');
  console.log('-- Update messaging with extracted real content');

  messagingData.forEach(item => {
    if (item) {
      const {
        route,
        pageName,
        accountType,
        title,
        subtitle,
        description,
        ctaText,
        emptyStateTitle,
        emptyStateDescription
      } = item;

      console.log(`
-- Update ${pageName} (${route})
UPDATE ux_messaging
SET
  title = '${title.replace(/'/g, "''")}',
  subtitle = ${subtitle ? `'${subtitle.replace(/'/g, "''")}'` : 'NULL'},
  description = ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'},
  cta_text = ${ctaText ? `'${ctaText.replace(/'/g, "''")}'` : 'NULL'},
  empty_state_title = ${emptyStateTitle ? `'${emptyStateTitle.replace(/'/g, "''")}'` : 'NULL'},
  empty_state_description = ${emptyStateDescription ? `'${emptyStateDescription.replace(/'/g, "''")}'` : 'NULL'}
WHERE page_route = '${route}';`);
    }
  });
}

function main() {
  console.log('🔍 Extracting messaging from buyer and creator pages...\n');

  const allExtracted = [];
  const pagesDir = path.join(__dirname, 'src', 'pages');

  // Process buyer pages
  console.log('📱 Scanning Buyer Pages:');
  ROUTES_CONFIG.buyer.forEach(pageConfig => {
    const filePath = path.join(pagesDir, pageConfig.file);
    console.log(`  Scanning ${pageConfig.route} (${pageConfig.file})`);

    const extracted = extractMessagingFromFile(filePath, pageConfig.route, 'buyer');
    if (extracted) {
      allExtracted.push(extracted);
      console.log(`    ✅ Title: "${extracted.title}"`);
      if (extracted.description) console.log(`       Desc: "${extracted.description}"`);
      if (extracted.emptyStateTitle) console.log(`       Empty: "${extracted.emptyStateTitle}"`);
    }
  });

  console.log('\n🎨 Scanning Creator Pages:');
  ROUTES_CONFIG.creator.forEach(pageConfig => {
    const filePath = path.join(pagesDir, pageConfig.file);
    console.log(`  Scanning ${pageConfig.route} (${pageConfig.file})`);

    const extracted = extractMessagingFromFile(filePath, pageConfig.route, 'creator');
    if (extracted) {
      allExtracted.push(extracted);
      console.log(`    ✅ Title: "${extracted.title}"`);
      if (extracted.description) console.log(`       Desc: "${extracted.description}"`);
      if (extracted.emptyStateTitle) console.log(`       Empty: "${extracted.emptyStateTitle}"`);
    }
  });

  console.log(`\n📊 Summary: Extracted messaging from ${allExtracted.length} pages`);

  // Generate database updates
  generateDatabaseUpdates(allExtracted);

  // Save extracted data to JSON for reference
  const outputPath = path.join(__dirname, 'extracted-messaging.json');
  fs.writeFileSync(outputPath, JSON.stringify(allExtracted, null, 2));
  console.log(`\n💾 Saved extracted data to: ${outputPath}`);
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}