#!/usr/bin/env node

/**
 * Quick script to update UI component imports to use shared package
 * This is a simplified version for demonstration purposes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Updating UI component imports to use @kstorybridge/ui...\n');

const appsToUpdate = ['apps/dashboard', 'apps/website', 'apps/admin'];

// Common UI components to replace
const componentsToReplace = [
  'button', 'card', 'input', 'badge', 'dialog', 'dropdown-menu',
  'label', 'select', 'checkbox', 'toast', 'toaster', 'tabs',
  'separator', 'skeleton', 'alert', 'avatar', 'form', 'table',
  'tooltip', 'switch', 'progress', 'use-toast'
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Replace individual component imports
    componentsToReplace.forEach(component => {
      const oldImport = new RegExp(`from ['"]@/components/ui/${component}['"]`, 'g');
      if (oldImport.test(content)) {
        updated = true;
      }
    });

    // Replace common UI import patterns with a consolidated import
    const uiImportPattern = /import\s+{([^}]+)}\s+from\s+['"]@\/components\/ui\/([^'"]+)['"]/g;
    let matches = [];
    let match;
    
    while ((match = uiImportPattern.exec(content)) !== null) {
      matches.push(match);
    }

    if (matches.length > 0) {
      // For now, just add a comment indicating the file needs manual update
      const comment = '// TODO: Update imports to use @kstorybridge/ui\n';
      if (!content.includes('TODO: Update imports')) {
        content = comment + content;
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath.replace(__dirname + '/../', '')}`);
      return true;
    }
    
  } catch (error) {
    console.log(`⚠️  Error updating ${filePath}: ${error.message}`);
  }
  
  return false;
}

function processDirectory(dir) {
  let updatedFiles = 0;
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
        walkDir(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        if (updateFile(fullPath)) {
          updatedFiles++;
        }
      }
    });
  }
  
  walkDir(dir);
  return updatedFiles;
}

// Process each app
let totalUpdated = 0;
appsToUpdate.forEach(app => {
  const appPath = path.join(__dirname, '..', app, 'src');
  if (fs.existsSync(appPath)) {
    console.log(`📂 Processing ${app}...`);
    const updated = processDirectory(appPath);
    totalUpdated += updated;
    console.log(`   ${updated} files marked for import updates\n`);
  }
});

console.log(`🎯 Summary: ${totalUpdated} files marked for manual import updates`);
console.log('\n📋 Next Steps:');
console.log('1. Review files with "TODO: Update imports" comments');
console.log('2. Replace @/components/ui/* imports with @kstorybridge/ui');
console.log('3. Consolidate multiple imports into single import statements');
console.log('\nExample:');
console.log('❌ import { Button } from "@/components/ui/button";');
console.log('❌ import { Card } from "@/components/ui/card";');
console.log('✅ import { Button, Card } from "@kstorybridge/ui";');