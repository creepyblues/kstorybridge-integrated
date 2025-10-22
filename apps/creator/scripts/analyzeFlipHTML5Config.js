#!/usr/bin/env node

/**
 * Analyze FlipHTML5 Config File
 * 
 * This script analyzes the JavaScript config file from FlipHTML5 to extract title data
 * 
 * Usage:
 * node analyzeFlipHTML5Config.js [--dry-run] [--output=config_data.json]
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;

// Configuration
const CONFIG_URL = 'https://online.fliphtml5.com/ohjyz/lczp/javascript/config.js';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'fliphtml5_config_analysis.json';

console.log('🔍 FlipHTML5 Config Analyzer');
console.log(`📄 Config URL: ${CONFIG_URL}`);
console.log(`💾 Output file: ${outputFile}`);
console.log(`🧪 Dry run: ${isDryRun ? 'YES' : 'NO'}`);
console.log('');

async function fetchAndAnalyzeConfig() {
  try {
    console.log('📥 Fetching config file...');
    const curlCommand = `curl -s -L "${CONFIG_URL}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"`;
    const configContent = execSync(curlCommand, { encoding: 'utf8', timeout: 15000 });
    
    console.log(`✅ Config fetched: ${configContent.length} characters`);
    
    // Analyze the config content
    const analysis = {
      fetchedAt: new Date().toISOString(),
      source: CONFIG_URL,
      contentLength: configContent.length,
      analysis: {}
    };
    
    // Look for various data patterns
    console.log('🔍 Analyzing config content...');
    
    // Look for page data
    const pageMatches = configContent.match(/page\d+/gi) || [];
    analysis.analysis.pageReferences = [...new Set(pageMatches)];
    
    // Look for title patterns
    const titlePatterns = [
      /title['"]\s*:\s*['"]([^'"]+)['"]/gi,
      /['"]title['"]:\s*['"]([^'"]+)['"]/gi,
      /'([^']{10,100})'/g,
      /"([^"]{10,100})"/g
    ];
    
    analysis.analysis.potentialTitles = [];
    titlePatterns.forEach((pattern, index) => {
      const matches = [...configContent.matchAll(pattern)];
      matches.forEach(match => {
        const title = match[1]?.trim();
        if (title && title.length > 5 && title.length < 200) {
          analysis.analysis.potentialTitles.push({
            text: title,
            pattern: `pattern_${index}`,
            context: match[0]
          });
        }
      });
    });
    
    // Look for JSON-like structures
    const jsonMatches = configContent.match(/\{[^{}]*"[^"]*"[^{}]*\}/g) || [];
    analysis.analysis.jsonStructures = jsonMatches.slice(0, 10); // First 10
    
    // Look for arrays
    const arrayMatches = configContent.match(/\[[^\[\]]{10,}\]/g) || [];
    analysis.analysis.arrayStructures = arrayMatches.slice(0, 10); // First 10
    
    // Look for URLs/paths
    const urlMatches = configContent.match(/https?:\/\/[^\s'"]+/g) || [];
    analysis.analysis.urls = [...new Set(urlMatches)];
    
    // Look for file references
    const fileMatches = configContent.match(/['"]\/?[a-zA-Z0-9_/-]+\.(jpg|jpeg|png|gif|pdf|json|xml)['"]/g) || [];
    analysis.analysis.fileReferences = [...new Set(fileMatches.map(m => m.replace(/['"]/g, '')))];
    
    // Look for Korean text (webtoon titles might be in Korean)
    const koreanMatches = configContent.match(/[\u3131-\u3163\uAC00-\uD7A3]+/g) || [];
    analysis.analysis.koreanText = [...new Set(koreanMatches)];
    
    // Look for numeric patterns (possibly page numbers, IDs)
    const numberPatterns = configContent.match(/\d{1,3}/g) || [];
    const uniqueNumbers = [...new Set(numberPatterns)].map(Number).sort((a, b) => a - b);
    analysis.analysis.numberRange = {
      min: Math.min(...uniqueNumbers),
      max: Math.max(...uniqueNumbers),
      count: uniqueNumbers.length,
      sample: uniqueNumbers.slice(0, 20)
    };
    
    // Try to extract specific webtoon/title data
    console.log('🎯 Looking for webtoon-specific data...');
    
    // Look for common webtoon metadata patterns
    const webtoonPatterns = [
      /author['"]\s*:\s*['"]([^'"]+)['"]/gi,
      /genre['"]\s*:\s*['"]([^'"]+)['"]/gi,
      /status['"]\s*:\s*['"]([^'"]+)['"]/gi,
      /chapter['"]\s*:\s*['"]([^'"]+)['"]/gi,
      /episode['"]\s*:\s*['"]([^'"]+)['"]/gi
    ];
    
    analysis.analysis.webtoonMetadata = {};
    webtoonPatterns.forEach(pattern => {
      const matches = [...configContent.matchAll(pattern)];
      if (matches.length > 0) {
        const key = pattern.source.split('[')[0];
        analysis.analysis.webtoonMetadata[key] = matches.map(m => m[1]);
      }
    });
    
    // Raw content sample (first and last 1000 chars)
    analysis.analysis.contentSample = {
      beginning: configContent.substring(0, 1000),
      ending: configContent.substring(configContent.length - 1000)
    };
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error fetching/analyzing config:', error.message);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function main() {
  try {
    console.log('🚀 Starting config analysis...\n');
    
    const analysis = await fetchAndAnalyzeConfig();
    
    if (analysis.error) {
      console.log('❌ Analysis failed');
      return;
    }
    
    // Display results
    console.log('\n📊 ANALYSIS RESULTS');
    console.log('=' .repeat(50));
    console.log(`📄 Content length: ${analysis.contentLength.toLocaleString()} characters`);
    console.log(`📖 Page references: ${analysis.analysis.pageReferences?.length || 0}`);
    console.log(`🎯 Potential titles: ${analysis.analysis.potentialTitles?.length || 0}`);
    console.log(`🔗 URLs found: ${analysis.analysis.urls?.length || 0}`);
    console.log(`📁 File references: ${analysis.analysis.fileReferences?.length || 0}`);
    console.log(`🇰🇷 Korean text entries: ${analysis.analysis.koreanText?.length || 0}`);
    console.log(`🔢 Number range: ${analysis.analysis.numberRange?.min || 'N/A'}-${analysis.analysis.numberRange?.max || 'N/A'}`);
    
    // Show samples
    if (analysis.analysis.potentialTitles?.length > 0) {
      console.log('\n📝 Sample potential titles:');
      analysis.analysis.potentialTitles.slice(0, 10).forEach((title, i) => {
        console.log(`  ${i + 1}. ${title.text}`);
      });
    }
    
    if (analysis.analysis.koreanText?.length > 0) {
      console.log('\n🇰🇷 Korean text found:');
      analysis.analysis.koreanText.slice(0, 5).forEach((text, i) => {
        console.log(`  ${i + 1}. ${text}`);
      });
    }
    
    if (analysis.analysis.fileReferences?.length > 0) {
      console.log('\n📁 Sample file references:');
      analysis.analysis.fileReferences.slice(0, 10).forEach((file, i) => {
        console.log(`  ${i + 1}. ${file}`);
      });
    }
    
    // Save analysis
    if (!isDryRun) {
      await fs.writeFile(outputFile, JSON.stringify(analysis, null, 2), 'utf8');
      console.log(`\n💾 Analysis saved to: ${outputFile}`);
    } else {
      console.log('\n🧪 Dry run mode - no file saved');
      console.log('\n📄 Content sample (first 500 chars):');
      console.log(analysis.analysis.contentSample?.beginning?.substring(0, 500));
    }
    
    console.log('\n🎉 Analysis completed!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();