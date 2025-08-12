#!/usr/bin/env node

/**
 * Fix critical UI component imports to use shared package
 * This fixes the build failures by updating imports in key files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Fixing critical UI component imports...\n');

// Critical files that are breaking the build
const criticalFiles = [
  'apps/dashboard/src/pages/Content.tsx',
  'apps/dashboard/src/pages/BuyerDashboard.tsx',
  'apps/dashboard/src/pages/CreatorDashboard.tsx',
  'apps/dashboard/src/pages/Titles.tsx',
  'apps/dashboard/src/pages/TitleDetail.tsx',
  'apps/dashboard/src/pages/Favorites.tsx',
  'apps/dashboard/src/components/TitleCard.tsx',
  'apps/dashboard/src/App.tsx'
];

// Map of imports to consolidate
const uiComponents = [
  'button', 'card', 'input', 'badge', 'dialog', 'dropdown-menu',
  'label', 'select', 'checkbox', 'toast', 'toaster', 'tabs',
  'separator', 'skeleton', 'alert', 'avatar', 'form', 'table',
  'tooltip', 'switch', 'progress', 'use-toast'
];

function fixFileImports(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Remove TODO comment
    if (content.includes('// TODO: Update imports to use @kstorybridge/ui')) {
      content = content.replace('// TODO: Update imports to use @kstorybridge/ui\n\n', '');
      modified = true;
    }

    // Track all UI imports to consolidate
    const foundImports = new Set();
    
    // Replace individual UI component imports
    uiComponents.forEach(component => {
      const patterns = [
        new RegExp(`import\\s*{([^}]+)}\\s*from\\s*["']@/components/ui/${component}["'];?`, 'g'),
        new RegExp(`import\\s*{([^}]+)}\\s*from\\s*["']@/components/ui/${component}["']`, 'g')
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          // Extract component names
          const imports = match[1].split(',').map(imp => imp.trim());
          imports.forEach(imp => foundImports.add(imp));
          
          // Remove the old import line
          content = content.replace(match[0], '');
          modified = true;
        }
      });
    });

    // If we found UI imports, add consolidated import
    if (foundImports.size > 0) {
      const importsList = Array.from(foundImports).join(', ');
      const consolidatedImport = `import { ${importsList} } from "@kstorybridge/ui";`;
      
      // Add the consolidated import after the React import
      if (content.includes('import') && !content.includes('@kstorybridge/ui')) {
        const lines = content.split('\n');
        let insertIndex = 0;
        
        // Find where to insert (after React imports, before other imports)
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('import') && lines[i].includes('react')) {
            insertIndex = i + 1;
          } else if (lines[i].includes('import') && !lines[i].includes('react') && insertIndex > 0) {
            break;
          }
        }
        
        lines.splice(insertIndex, 0, consolidatedImport);
        content = lines.join('\n');
        modified = true;
      }
    }
    
    // Clean up empty lines and formatting
    content = content.replace(/\n\n\n+/g, '\n\n');
    content = content.replace(/^import\s*{\s*}\s*from[^;]+;?\n/gm, '');
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
      if (foundImports.size > 0) {
        console.log(`   Consolidated ${foundImports.size} component imports`);
      }
      return true;
    }
    
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}: ${error.message}`);
  }
  
  return false;
}

// Fix critical files
let fixedCount = 0;
console.log('🎯 Fixing critical build-breaking files...\n');

criticalFiles.forEach(file => {
  if (fixFileImports(file)) {
    fixedCount++;
  }
});

console.log(`\n📊 Summary: Fixed ${fixedCount} critical files`);
console.log('\n🚀 Testing build after fixes...');

// Test build after fixes
import { execSync } from 'child_process';

try {
  execSync('npm run build:dashboard', { stdio: 'inherit' });
  console.log('\n✅ Dashboard build successful after import fixes!');
} catch (error) {
  console.log('\n⚠️  Dashboard build still has issues. Additional files may need fixing.');
  console.log('Run `node scripts/update-imports.js` to see all files needing updates.');
}