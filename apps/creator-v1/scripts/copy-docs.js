#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Documentation Build Script
 * Copies markdown files from repository to public/docs/ directory
 * for access via HTTP in the DocumentViewer component
 */

const sourceRootDir = path.resolve(__dirname, '../../../'); // Repository root
const sourceDashboardDir = path.resolve(__dirname, '../'); // Dashboard app directory
const targetDir = path.resolve(__dirname, '../public/docs');

// List of documentation files to copy
const documentationFiles = [
  // Root level documentation
  { source: sourceRootDir, files: [
    'DATABASE_SCHEMA.md',
    'AUTH_DOCUMENTATION.md',
    'USER_JOURNEY_MAP.md',
    'SECURITY_BEST_PRACTICES.md',
    'EMAIL_POLICY_DOCUMENTATION.md',
    'SLACK_BLACKLIST_DOCUMENTATION.md',
    'VERCEL_DEPLOYMENT.md',
    'STRIPE_SETUP_GUIDE.md',
    'gtm-ga4-setup-guide.md',
    'GTM_BUTTON_TRACKING_LIST.md',
    'CLAUDE.md'
  ]},
  // Dashboard specific documentation
  { source: sourceDashboardDir, files: [
    'PRODUCT_REQUIREMENTS_DOCUMENT.md',
    'AI_CHATBOT_DOCUMENTATION.md',
    'CLAUDE.md',
    'COVER_EXTRACTION_README.md',
    'DASHBOARD_PDF_FIX.md',
    'GOOGLE_ANALYTICS_SETUP.md',
    'GA4_SEARCH_TRACKING_GUIDE.md',
    'GA4_SEARCH_SETUP_GUIDE.md',
    'DASHBOARD_REDESIGN_GUIDE.md',
    'TIER_OPTIMIZATION.md'
  ]}
];

/**
 * Ensure directory exists, create if not
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

/**
 * Copy a file from source to target
 */
function copyFile(sourcePath, targetPath, filename) {
  try {
    const sourceFile = path.join(sourcePath, filename);
    const targetFile = path.join(targetPath, filename);

    if (!fs.existsSync(sourceFile)) {
      console.log(`⚠️  File not found: ${filename} (${sourceFile})`);
      return false;
    }

    fs.copyFileSync(sourceFile, targetFile);
    console.log(`✅ Copied: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error copying ${filename}:`, error.message);
    return false;
  }
}

/**
 * Main copy function
 */
function copyDocumentationFiles() {
  console.log('📚 Copying documentation files...\n');

  // Ensure target directory exists
  ensureDirectoryExists(targetDir);

  let totalFiles = 0;
  let copiedFiles = 0;

  // Copy files from each source directory
  documentationFiles.forEach(({ source, files }) => {
    console.log(`\n📂 Copying from: ${path.relative(process.cwd(), source)}`);

    files.forEach(filename => {
      totalFiles++;
      if (copyFile(source, targetDir, filename)) {
        copiedFiles++;
      }
    });
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Successfully copied: ${copiedFiles}`);
  console.log(`   Failed: ${totalFiles - copiedFiles}`);
  console.log(`   Target directory: ${targetDir}`);

  if (copiedFiles === 0) {
    console.error('\n❌ No files were copied successfully!');
    process.exit(1);
  } else if (copiedFiles < totalFiles) {
    console.warn('\n⚠️  Some files were not copied. Check the warnings above.');
  } else {
    console.log('\n🎉 All documentation files copied successfully!');
  }
}

/**
 * Watch for changes (if --watch flag is provided)
 */
function watchForChanges() {
  console.log('\n👀 Watching for markdown file changes...');

  const chokidar = require('chokidar');

  const watchPaths = documentationFiles.flatMap(({ source, files }) =>
    files.map(file => path.join(source, file))
  );

  const watcher = chokidar.watch(watchPaths, {
    ignored: /node_modules/,
    persistent: true
  });

  watcher.on('change', (changedPath) => {
    const filename = path.basename(changedPath);
    const sourceDir = path.dirname(changedPath);

    console.log(`\n🔄 File changed: ${filename}`);

    if (copyFile(sourceDir, targetDir, filename)) {
      console.log(`✅ Updated: ${filename}`);
    }
  });

  watcher.on('error', error => {
    console.error('❌ Watcher error:', error);
  });

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping file watcher...');
    watcher.close();
    process.exit(0);
  });
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const shouldWatch = args.includes('--watch');

  copyDocumentationFiles();

  if (shouldWatch) {
    try {
      watchForChanges();
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('chokidar')) {
        console.log('\n📦 Installing chokidar for file watching...');
        console.log('💡 Run: npm install chokidar --save-dev');
        console.log('💡 Then use: npm run docs:watch');
      } else {
        console.error('❌ Watch mode failed:', error.message);
      }
    }
  }
}

module.exports = { copyDocumentationFiles };