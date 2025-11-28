#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clean messaging data by filtering out code artifacts
function cleanMessagingData() {
  const extractedPath = path.join(__dirname, 'extracted-messaging.json');

  if (!fs.existsSync(extractedPath)) {
    console.error('❌ No extracted-messaging.json file found. Run extract-messaging.js first.');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
  console.log(`🧹 Cleaning messaging data from ${rawData.length} pages...`);

  const cleanedData = rawData.map(item => {
    const cleaned = {
      ...item,
      title: cleanText(item.title),
      subtitle: cleanText(item.subtitle),
      description: cleanText(item.description),
      ctaText: cleanText(item.ctaText),
      emptyStateTitle: cleanText(item.emptyStateTitle),
      emptyStateDescription: cleanText(item.emptyStateDescription)
    };

    // Apply manual fixes for specific pages
    if (item.route === '/buyers/home') {
      cleaned.title = 'Featured Titles';
      cleaned.description = 'Jinu, our friendly AI agent, handpicked these titles just for you!';
      cleaned.emptyStateTitle = 'No featured titles available';
      cleaned.emptyStateDescription = 'Check back soon for new recommendations';
    }

    if (item.route === '/buyers/titles') {
      cleaned.title = 'Title Library';
      cleaned.subtitle = '';
      cleaned.description = 'Browse our complete collection of Korean content';
      cleaned.emptyStateTitle = 'No titles found';
      cleaned.emptyStateDescription = 'Try adjusting your search or filters';
    }

    if (item.route === '/buyers/titles/:id') {
      cleaned.title = 'Title Details';
      cleaned.subtitle = '';
      cleaned.description = 'View detailed information about this title';
      cleaned.emptyStateTitle = 'Title not found';
      cleaned.emptyStateDescription = 'This title may have been removed or is temporarily unavailable';
    }

    if (item.route === '/buyers/favorites') {
      cleaned.title = 'My Favorites';
      cleaned.subtitle = '';
      cleaned.description = 'Your saved titles and content';
      cleaned.emptyStateTitle = 'No favorites yet';
      cleaned.emptyStateDescription = 'Start exploring titles and add them to your favorites';
    }

    if (item.route === '/buyers/requests') {
      cleaned.title = 'My Requests';
      cleaned.subtitle = '';
      cleaned.description = 'Track your content requests and deals';
      cleaned.emptyStateTitle = 'No requests yet';
      cleaned.emptyStateDescription = 'Submit a request to connect with content creators';
    }

    if (item.route === '/buyers/deals') {
      cleaned.title = 'My Deals';
      cleaned.subtitle = '';
      cleaned.description = 'Manage your active deals and negotiations';
      cleaned.emptyStateTitle = 'No active deals';
      cleaned.emptyStateDescription = 'Your completed deals will appear here';
    }

    if (item.route === '/buyers/browse') {
      cleaned.title = 'Browse Content';
      cleaned.subtitle = '';
      cleaned.description = 'Discover Korean content across all genres';
      cleaned.emptyStateTitle = 'No content found';
      cleaned.emptyStateDescription = 'Try different search terms or browse categories';
    }

    if (item.route === '/buyers/media') {
      cleaned.title = 'Media Center';
      cleaned.subtitle = '';
      cleaned.description = 'Access your media files and downloads';
      cleaned.emptyStateTitle = 'No media files';
      cleaned.emptyStateDescription = 'Your downloaded content will appear here';
    }

    if (item.route === '/buyers/users') {
      cleaned.title = 'User Management';
      cleaned.subtitle = '';
      cleaned.description = 'Manage team members and permissions';
      cleaned.emptyStateTitle = 'No team members';
      cleaned.emptyStateDescription = 'Invite team members to collaborate';
    }

    if (item.route === '/buyers/settings') {
      cleaned.title = 'Settings';
      cleaned.subtitle = '';
      cleaned.description = 'Configure your account preferences';
      cleaned.emptyStateTitle = '';
      cleaned.emptyStateDescription = '';
    }

    if (item.route === '/buyers/profile') {
      cleaned.title = 'Buyer Profile';
      cleaned.subtitle = '';
      cleaned.description = 'Manage your professional profile and company information';
      cleaned.emptyStateTitle = '';
      cleaned.emptyStateDescription = '';
    }

    if (item.route === '/buyers/plan') {
      cleaned.title = 'Subscription Plan';
      cleaned.subtitle = '';
      cleaned.description = 'Manage your subscription and billing';
      cleaned.emptyStateTitle = '';
      cleaned.emptyStateDescription = '';
    }

    if (item.route === '/buyers/news') {
      cleaned.title = 'K-Content News';
      cleaned.subtitle = '';
      cleaned.description = 'Stay updated with the latest Korean entertainment industry news';
      cleaned.emptyStateTitle = 'No news articles';
      cleaned.emptyStateDescription = 'Check back for the latest industry updates';
    }

    if (item.route === '/buyers/send-message') {
      cleaned.title = 'Send Message';
      cleaned.subtitle = '';
      cleaned.description = 'Contact content creators directly';
      cleaned.emptyStateTitle = '';
      cleaned.emptyStateDescription = '';
    }

    // Creator pages
    if (item.route === '/creators/home') {
      cleaned.title = 'Creator Dashboard';
      cleaned.subtitle = '';
      cleaned.description = 'Manage your content and track performance';
      cleaned.emptyStateTitle = 'No content yet';
      cleaned.emptyStateDescription = 'Upload your first title to get started';
    }

    if (item.route === '/creators/titles') {
      cleaned.title = 'My Titles';
      cleaned.subtitle = '';
      cleaned.description = 'Manage your published content';
      cleaned.emptyStateTitle = 'No titles published';
      cleaned.emptyStateDescription = 'Create your first title to share with buyers';
    }

    if (item.route === '/creators/titles/add') {
      cleaned.title = 'Add New Title';
      cleaned.subtitle = '';
      cleaned.description = 'Upload and publish new content';
      cleaned.emptyStateTitle = '';
      cleaned.emptyStateDescription = '';
    }

    if (item.route === '/creators/titles/:id/edit') {
      cleaned.title = 'Edit Title';
      cleaned.subtitle = '';
      cleaned.description = 'Update your content information';
      cleaned.emptyStateTitle = '';
      cleaned.emptyStateDescription = '';
    }

    if (item.route === '/creators/titles/:id') {
      cleaned.title = 'Title Details';
      cleaned.subtitle = '';
      cleaned.description = 'View and manage your title';
      cleaned.emptyStateTitle = 'Title not found';
      cleaned.emptyStateDescription = 'This title may have been removed';
    }

    if (item.route === '/creators/requests') {
      cleaned.title = 'Incoming Requests';
      cleaned.subtitle = '';
      cleaned.description = 'Manage buyer requests for your content';
      cleaned.emptyStateTitle = 'No requests received';
      cleaned.emptyStateDescription = 'Buyers will contact you about your content here';
    }

    if (item.route === '/creators/profile') {
      cleaned.title = 'Creator Profile';
      cleaned.subtitle = '';
      cleaned.description = 'Manage your creator profile and portfolio';
      cleaned.emptyStateTitle = '';
      cleaned.emptyStateDescription = '';
    }

    if (item.route === '/creators/news') {
      cleaned.title = 'K-Content News';
      cleaned.subtitle = '';
      cleaned.description = 'Stay updated with industry trends and opportunities';
      cleaned.emptyStateTitle = 'No news articles';
      cleaned.emptyStateDescription = 'Check back for the latest industry updates';
    }

    if (item.route === '/creators/send-message') {
      cleaned.title = 'Send Message';
      cleaned.subtitle = '';
      cleaned.description = 'Contact buyers and industry professionals';
      cleaned.emptyStateTitle = '';
      cleaned.emptyStateDescription = '';
    }

    if (item.route === '/creators/chat') {
      cleaned.title = 'AI Chat Assistant';
      cleaned.subtitle = '';
      cleaned.description = 'Get help with content creation and industry insights';
      cleaned.emptyStateTitle = 'Start a conversation';
      cleaned.emptyStateDescription = 'Ask me anything about content creation or the industry';
    }

    return cleaned;
  });

  console.log('\n✅ Messaging data cleaned successfully!');
  console.log(`📊 Processed ${cleanedData.length} pages`);

  // Save cleaned data
  const cleanedPath = path.join(__dirname, 'cleaned-messaging.json');
  fs.writeFileSync(cleanedPath, JSON.stringify(cleanedData, null, 2));
  console.log(`💾 Saved cleaned data to: ${cleanedPath}`);

  // Generate SQL updates with cleaned data
  generateDatabaseUpdates(cleanedData);

  return cleanedData;
}

function cleanText(text) {
  if (!text || typeof text !== 'string') return '';

  // Remove code artifacts and variables
  const codePatterns = [
    // Remove template literals and variables
    /\{[^}]*\}/g,
    // Remove JSX fragments
    /<[^>]*>/g,
    // Remove code comments
    /\/\*[\s\S]*?\*\//g,
    /\/\/.*$/gm,
    // Remove function calls
    /\w+\([^)]*\)/g,
    // Remove console logs and errors
    /console\.(log|error|warn).*$/gm,
    // Remove variable declarations
    /(?:const|let|var)\s+\w+.*$/gm,
    // Remove import statements
    /import\s+.*$/gm,
    // Remove error messages with variables
    /Error:\s*\{.*?\}/g,
    // Remove long code blocks (more than 100 chars that contain code patterns)
    /^.{100,}(?=.*(?:function|const|let|var|import|export|\{|\}|console|error|useState|useEffect)).*/gm,
    // Remove specific code patterns we found
    /NO FALLBACK TO MOCK DATA[\s\S]*/g,
    /useEffect[\s\S]*/g,
    /useState[\s\S]*/g
  ];

  let cleaned = text;

  // Apply all cleaning patterns
  codePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Clean up whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ')  // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n')  // Multiple newlines to single
    .trim();

  // If the result is empty or still looks like code, return empty string
  if (!cleaned ||
      cleaned.length < 3 ||
      /^[{}[\]();.,\s]*$/.test(cleaned) ||
      /^[A-Z_]{3,}$/.test(cleaned) ||
      cleaned.includes('useState') ||
      cleaned.includes('useEffect') ||
      cleaned.includes('console.') ||
      cleaned.includes('Error:') ||
      cleaned.includes('function') ||
      cleaned.includes('=>') ||
      cleaned.includes('const ') ||
      cleaned.includes('import ')) {
    return '';
  }

  return cleaned;
}

function generateDatabaseUpdates(messagingData) {
  console.log('\n📊 Generated Database Update SQL:');
  console.log('-- Update messaging with cleaned real content');

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

  console.log('\n💡 Copy and run these SQL statements in your database to update the messaging content.');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanMessagingData();
}