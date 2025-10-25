#!/usr/bin/env node

/**
 * Generate Test Metrics Report
 *
 * Collects test metrics from CI/CD runs and generates:
 * 1. HTML dashboard
 * 2. JSON metrics file
 * 3. Markdown summary
 *
 * Usage:
 *   node scripts/generate-test-metrics.js
 *   npm run test:metrics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PLAYWRIGHT_RESULTS = path.join(__dirname, '../test-results');
const COVERAGE_DIR = path.join(__dirname, '../coverage');
const OUTPUT_DIR = path.join(__dirname, '../test-metrics');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'index.html');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'metrics.json');
const OUTPUT_MD = path.join(OUTPUT_DIR, 'METRICS.md');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Collect test metrics
 */
function collectMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
    },
    coverage: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
    e2e: {
      suites: [],
      totalDuration: 0,
    },
  };

  // Collect Playwright metrics
  try {
    const playwrightFiles = fs.readdirSync(PLAYWRIGHT_RESULTS).filter(f => f.endsWith('.json'));

    if (playwrightFiles.length > 0) {
      console.log(`📊 Found ${playwrightFiles.length} Playwright result files`);

      playwrightFiles.forEach(file => {
        try {
          const content = JSON.parse(
            fs.readFileSync(path.join(PLAYWRIGHT_RESULTS, file), 'utf-8')
          );

          // Extract test counts
          if (content.stats) {
            metrics.summary.totalTests += content.stats.total || 0;
            metrics.summary.passed += content.stats.passed || 0;
            metrics.summary.failed += content.stats.failed || 0;
            metrics.summary.skipped += content.stats.skipped || 0;
            metrics.summary.duration += content.stats.duration || 0;
          }
        } catch (err) {
          console.warn(`⚠️  Could not parse ${file}:`, err.message);
        }
      });
    }
  } catch (err) {
    console.warn('⚠️  No Playwright results found');
  }

  // Collect coverage metrics
  try {
    const coverageSummary = path.join(COVERAGE_DIR, 'coverage-summary.json');
    if (fs.existsSync(coverageSummary)) {
      const coverage = JSON.parse(fs.readFileSync(coverageSummary, 'utf-8'));
      const total = coverage.total;

      metrics.coverage = {
        statements: total.statements.pct,
        branches: total.branches.pct,
        functions: total.functions.pct,
        lines: total.lines.pct,
      };

      console.log('📊 Coverage metrics collected');
    }
  } catch (err) {
    console.warn('⚠️  No coverage data found');
  }

  return metrics;
}

/**
 * Generate HTML dashboard
 */
function generateHTML(metrics) {
  const passRate = metrics.summary.totalTests > 0
    ? ((metrics.summary.passed / metrics.summary.totalTests) * 100).toFixed(1)
    : 0;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KStoryBridge Test Metrics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 32px; margin-bottom: 10px; color: #333; }
    .subtitle { color: #666; margin-bottom: 40px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .card {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .card h2 { font-size: 14px; color: #666; text-transform: uppercase; margin-bottom: 12px; }
    .metric-value { font-size: 48px; font-weight: bold; margin-bottom: 8px; }
    .metric-value.success { color: #10b981; }
    .metric-value.warning { color: #f59e0b; }
    .metric-value.error { color: #ef4444; }
    .metric-label { font-size: 14px; color: #666; }
    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 12px;
    }
    .progress-fill {
      height: 100%;
      background: #10b981;
      transition: width 0.3s ease;
    }
    .progress-fill.warning { background: #f59e0b; }
    .progress-fill.error { background: #ef4444; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    .badge.success { background: #d1fae5; color: #065f46; }
    .badge.warning { background: #fef3c7; color: #92400e; }
    .badge.error { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Test Metrics Dashboard</h1>
    <p class="subtitle">Generated: ${new Date(metrics.timestamp).toLocaleString()}</p>

    <div class="grid">
      <!-- Total Tests -->
      <div class="card">
        <h2>Total Tests</h2>
        <div class="metric-value">${metrics.summary.totalTests}</div>
        <div class="metric-label">Test cases</div>
      </div>

      <!-- Pass Rate -->
      <div class="card">
        <h2>Pass Rate</h2>
        <div class="metric-value ${passRate >= 95 ? 'success' : passRate >= 80 ? 'warning' : 'error'}">${passRate}%</div>
        <div class="metric-label">${metrics.summary.passed} / ${metrics.summary.totalTests} passed</div>
        <div class="progress-bar">
          <div class="progress-fill ${passRate >= 95 ? '' : passRate >= 80 ? 'warning' : 'error'}" style="width: ${passRate}%"></div>
        </div>
        <span class="badge ${passRate >= 95 ? 'success' : passRate >= 80 ? 'warning' : 'error'}">
          ${passRate >= 95 ? '✅ Excellent' : passRate >= 80 ? '⚠️ Good' : '❌ Needs Attention'}
        </span>
      </div>

      <!-- Failed Tests -->
      <div class="card">
        <h2>Failed Tests</h2>
        <div class="metric-value ${metrics.summary.failed === 0 ? 'success' : 'error'}">${metrics.summary.failed}</div>
        <div class="metric-label">Failures</div>
      </div>

      <!-- Duration -->
      <div class="card">
        <h2>Test Duration</h2>
        <div class="metric-value">${(metrics.summary.duration / 1000 / 60).toFixed(1)}</div>
        <div class="metric-label">Minutes</div>
      </div>
    </div>

    <div class="grid">
      <!-- Code Coverage -->
      <div class="card">
        <h2>Code Coverage</h2>
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px;">Statements</span>
            <span style="font-weight: 600;">${metrics.coverage.statements}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${metrics.coverage.statements}%"></div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px;">Branches</span>
            <span style="font-weight: 600;">${metrics.coverage.branches}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${metrics.coverage.branches}%"></div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px;">Functions</span>
            <span style="font-weight: 600;">${metrics.coverage.functions}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${metrics.coverage.functions}%"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px;">Lines</span>
            <span style="font-weight: 600;">${metrics.coverage.lines}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${metrics.coverage.lines}%"></div>
          </div>
        </div>
      </div>

      <!-- Test Breakdown -->
      <div class="card">
        <h2>Test Breakdown</h2>
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px; color: #10b981;">✅ Passed</span>
            <span style="font-weight: 600;">${metrics.summary.passed}</span>
          </div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px; color: #ef4444;">❌ Failed</span>
            <span style="font-weight: 600;">${metrics.summary.failed}</span>
          </div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px; color: #6b7280;">⏭️ Skipped</span>
            <span style="font-weight: 600;">${metrics.summary.skipped}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(OUTPUT_HTML, html);
  console.log(`✅ HTML dashboard generated: ${OUTPUT_HTML}`);
}

/**
 * Generate JSON metrics
 */
function generateJSON(metrics) {
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(metrics, null, 2));
  console.log(`✅ JSON metrics generated: ${OUTPUT_JSON}`);
}

/**
 * Generate Markdown summary
 */
function generateMarkdown(metrics) {
  const passRate = metrics.summary.totalTests > 0
    ? ((metrics.summary.passed / metrics.summary.totalTests) * 100).toFixed(1)
    : 0;

  const md = `# 📊 Test Metrics Report

**Generated**: ${new Date(metrics.timestamp).toLocaleString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${metrics.summary.totalTests} |
| Passed | ${metrics.summary.passed} ✅ |
| Failed | ${metrics.summary.failed} ❌ |
| Skipped | ${metrics.summary.skipped} |
| Pass Rate | ${passRate}% |
| Duration | ${(metrics.summary.duration / 1000 / 60).toFixed(1)} min |

## Code Coverage

| Type | Coverage |
|------|----------|
| Statements | ${metrics.coverage.statements}% |
| Branches | ${metrics.coverage.branches}% |
| Functions | ${metrics.coverage.functions}% |
| Lines | ${metrics.coverage.lines}% |

## Status

${passRate >= 95 ? '✅ **Excellent** - All tests passing' : passRate >= 80 ? '⚠️ **Good** - Most tests passing' : '❌ **Needs Attention** - Multiple test failures'}

---

*View detailed metrics: [HTML Dashboard](./index.html)*
`;

  fs.writeFileSync(OUTPUT_MD, md);
  console.log(`✅ Markdown summary generated: ${OUTPUT_MD}`);
}

// Main execution
console.log('🔍 Collecting test metrics...\n');

const metrics = collectMetrics();

console.log('\n📈 Generating reports...\n');

generateHTML(metrics);
generateJSON(metrics);
generateMarkdown(metrics);

console.log('\n✅ Test metrics generated successfully!\n');
console.log(`📊 View dashboard: file://${OUTPUT_HTML}`);
console.log(`📄 View summary: ${OUTPUT_MD}\n`);
