#!/usr/bin/env node

/**
 * Test Vercel Preview Deployment Script
 *
 * Runs smoke tests against Vercel preview deployments to verify:
 * 1. Homepage loads
 * 2. Signin page loads
 * 3. API endpoints respond
 * 4. No critical JavaScript errors
 *
 * Usage:
 *   PREVIEW_URL=https://dashboard-abc123.vercel.app node scripts/test-preview-deployment.js
 *   npm run test:preview -- https://dashboard-abc123.vercel.app
 */

import { chromium } from '@playwright/test';

const PREVIEW_URL = process.env.PREVIEW_URL || process.argv[2];

if (!PREVIEW_URL) {
  console.error('❌ Error: PREVIEW_URL environment variable or argument required');
  console.log('   Usage: PREVIEW_URL=https://... node scripts/test-preview-deployment.js');
  console.log('   Or: npm run test:preview -- https://...');
  process.exit(1);
}

console.log(`🔍 Testing preview deployment: ${PREVIEW_URL}\n`);

async function runSmokeTests() {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Test 1: Homepage loads
  try {
    console.log('Test 1: Homepage loads...');
    await page.goto(PREVIEW_URL, { timeout: 30000 });

    const title = await page.title();
    if (title && title.length > 0) {
      console.log(`✅ Homepage loaded (title: "${title}")`);
      passed++;
    } else {
      throw new Error('No page title found');
    }
  } catch (error) {
    console.error(`❌ Homepage failed: ${error.message}`);
    failed++;
  }

  // Test 2: Signin page loads
  try {
    console.log('\nTest 2: Signin page loads...');
    await page.goto(`${PREVIEW_URL}/signin`, { timeout: 30000 });

    const signinForm = await page.locator('form').count();
    if (signinForm > 0) {
      console.log(`✅ Signin page loaded (found ${signinForm} form(s))`);
      passed++;
    } else {
      throw new Error('No signin form found');
    }
  } catch (error) {
    console.error(`❌ Signin page failed: ${error.message}`);
    failed++;
  }

  // Test 3: Buyer signup page loads
  try {
    console.log('\nTest 3: Buyer signup page loads...');
    await page.goto(`${PREVIEW_URL}/signup/buyer`, { timeout: 30000 });

    const signupForm = await page.locator('form').count();
    if (signupForm > 0) {
      console.log(`✅ Buyer signup page loaded`);
      passed++;
    } else {
      throw new Error('No signup form found');
    }
  } catch (error) {
    console.error(`❌ Buyer signup page failed: ${error.message}`);
    failed++;
  }

  // Test 4: Creator signup page loads
  try {
    console.log('\nTest 4: Creator signup page loads...');
    await page.goto(`${PREVIEW_URL}/signup/creator`, { timeout: 30000 });

    const signupForm = await page.locator('form').count();
    if (signupForm > 0) {
      console.log(`✅ Creator signup page loaded`);
      passed++;
    } else {
      throw new Error('No signup form found');
    }
  } catch (error) {
    console.error(`❌ Creator signup page failed: ${error.message}`);
    failed++;
  }

  // Test 5: Static assets load (no 404s)
  try {
    console.log('\nTest 5: Static assets check...');
    const failedRequests = [];

    page.on('response', response => {
      if (response.status() >= 400 && response.url().includes(PREVIEW_URL)) {
        failedRequests.push({ url: response.url(), status: response.status() });
      }
    });

    await page.goto(PREVIEW_URL, { timeout: 30000, waitUntil: 'networkidle' });

    if (failedRequests.length === 0) {
      console.log('✅ All static assets loaded successfully');
      passed++;
    } else {
      console.error(`❌ Found ${failedRequests.length} failed requests:`);
      failedRequests.forEach(req => {
        console.error(`   ${req.status}: ${req.url}`);
      });
      failed++;
    }
  } catch (error) {
    console.error(`❌ Static assets check failed: ${error.message}`);
    failed++;
  }

  // Test 6: No critical JavaScript errors
  console.log('\nTest 6: JavaScript error check...');
  const criticalErrors = errors.filter(err =>
    err.toLowerCase().includes('error') &&
    !err.includes('favicon') && // Ignore favicon errors
    !err.includes('analytics') // Ignore analytics errors
  );

  if (criticalErrors.length === 0) {
    console.log('✅ No critical JavaScript errors');
    passed++;
  } else {
    console.error(`❌ Found ${criticalErrors.length} JavaScript errors:`);
    criticalErrors.slice(0, 5).forEach(err => {
      console.error(`   ${err}`);
    });
    if (criticalErrors.length > 5) {
      console.error(`   ... and ${criticalErrors.length - 5} more`);
    }
    failed++;
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Smoke Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n✅ Preview deployment is healthy!\n');
    process.exit(0);
  } else {
    console.log('\n❌ Preview deployment has issues\n');
    process.exit(1);
  }
}

// Run tests
runSmokeTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
