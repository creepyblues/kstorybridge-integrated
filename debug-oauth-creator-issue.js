#!/usr/bin/env node

/**
 * Debug OAuth Creator Issue - Comprehensive Analysis
 * This script helps identify where the production redirect is coming from
 */

console.log('🔍 OAUTH CREATOR DEBUG - Comprehensive Analysis');
console.log('='.repeat(60));

// Check environment configuration
console.log('\n📋 ENVIRONMENT CONFIGURATION:');
console.log('Current directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');

// Read environment files
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const checkEnvFile = (path, description) => {
  const fullPath = resolve(path);
  if (existsSync(fullPath)) {
    const content = readFileSync(fullPath, 'utf-8');
    console.log(`\n${description}:`);
    console.log(`File: ${fullPath}`);
    content.split('\n').forEach(line => {
      if (line.includes('VITE_DASHBOARD_URL') || line.includes('VITE_WEBSITE_URL')) {
        console.log(`  ${line}`);
      }
    });
  } else {
    console.log(`\n${description}: ❌ NOT FOUND (${fullPath})`);
  }
};

// Check all relevant env files
checkEnvFile('apps/dashboard/.env.local', '📁 Dashboard .env.local');
checkEnvFile('apps/website/.env.local', '📁 Website .env.local');
checkEnvFile('.env.local', '📁 Root .env.local');

// Check package.json dev scripts
const checkDevScript = (path, description) => {
  const fullPath = resolve(path);
  if (existsSync(fullPath)) {
    const pkg = JSON.parse(readFileSync(fullPath, 'utf-8'));
    console.log(`\n${description}:`);
    console.log(`File: ${fullPath}`);
    if (pkg.scripts) {
      Object.keys(pkg.scripts).forEach(script => {
        if (script.includes('dev') || script.includes('start')) {
          console.log(`  ${script}: ${pkg.scripts[script]}`);
        }
      });
    }
  }
};

checkDevScript('package.json', '📦 Root package.json dev scripts');
checkDevScript('apps/dashboard/package.json', '📦 Dashboard package.json dev scripts');
checkDevScript('apps/website/package.json', '📦 Website package.json dev scripts');

// Check Vite config files
const checkViteConfig = (path, description) => {
  const fullPath = resolve(path);
  if (existsSync(fullPath)) {
    const content = readFileSync(fullPath, 'utf-8');
    console.log(`\n${description}:`);
    console.log(`File: ${fullPath}`);
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('port') || line.includes('3000') || line.includes('8080') || line.includes('8081')) {
        console.log(`  Line ${index + 1}: ${line.trim()}`);
      }
    });
  }
};

checkViteConfig('apps/dashboard/vite.config.ts', '⚡ Dashboard Vite config');
checkViteConfig('apps/website/vite.config.ts', '⚡ Website Vite config');

console.log('\n🔧 DEBUGGING STEPS:');
console.log('1. Check if dev servers are running on correct ports');
console.log('2. Verify browser dev tools for actual redirect URLs');
console.log('3. Check for cached OAuth URLs in browser localStorage');
console.log('4. Clear browser cache and localStorage completely');
console.log('5. Use incognito mode with cleared browser data');

console.log('\n🚨 POTENTIAL ISSUES:');
console.log('❌ Dashboard .env.local missing or incorrect VITE_DASHBOARD_URL');
console.log('❌ Website build contains hardcoded production URLs');
console.log('❌ Browser cache contains old OAuth redirect URLs');
console.log('❌ Supabase OAuth configuration has production redirect URLs');
console.log('❌ AuthCallbackPage uses hardcoded production URL somewhere');

console.log('\n✅ EXPECTED CONFIGURATION:');
console.log('📁 apps/dashboard/.env.local should contain:');
console.log('   VITE_DASHBOARD_URL=http://localhost:8081');
console.log('   VITE_WEBSITE_URL=http://localhost:5173');
console.log('');
console.log('📁 apps/website/.env.local should contain:');
console.log('   VITE_DASHBOARD_URL=http://localhost:8081');
console.log('   VITE_WEBSITE_URL=http://localhost:5173');

console.log('\n🔄 OAUTH FLOW ANALYSIS:');
console.log('Step 1: User clicks OAuth button on website (localhost:5173)');
console.log('Step 2: Redirects to Google OAuth');
console.log('Step 3: Google redirects to /auth/callback?account_type=creator');
console.log('Step 4: AuthCallbackPage processes callback');
console.log('Step 5: Should redirect to /signup/creator?complete=true');
console.log('Step 6: SignupForm completes profile creation');
console.log('Step 7: Should navigate to /creators/home/');

console.log('\n📝 MANUAL CHECK LIST:');
console.log('□ Are both dev servers running?');
console.log('  npm run dev:website (should be on port 5173)');
console.log('  npm run dev:dashboard (should be on port 8081)');
console.log('□ Did you rebuild website after env changes?');
console.log('  cd apps/website && VITE_DASHBOARD_URL=http://localhost:8081 npm run build');
console.log('□ Is browser completely cleared of cache/localStorage?');
console.log('□ Are you testing in a completely fresh incognito window?');
console.log('□ Check browser Network tab for actual redirect URLs');
console.log('□ Check console logs for AuthCallbackPage debug messages');

console.log('\n' + '='.repeat(60));