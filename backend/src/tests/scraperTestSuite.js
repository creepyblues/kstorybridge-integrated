/**
 * Scraper Test Suite - Automated Testing & Feedback Loop System
 * Enables systematic accuracy improvement through test-driven development
 */

import scraperService from '../services/scraperService.js';
import fs from 'fs/promises';
import path from 'path';

class ScraperTestSuite {
  constructor() {
    this.testDataPath = './test-data';
    this.resultsPath = './test-results';
    this.testCases = new Map();
    this.results = [];
  }

  /**
   * Initialize test directories and load existing test cases
   */
  async init() {
    await this.ensureDirectories();
    await this.loadTestCases();
    console.log(`🧪 Test Suite initialized with ${this.testCases.size} test cases`);
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.testDataPath, { recursive: true });
      await fs.mkdir(this.resultsPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create test directories:', error);
    }
  }

  /**
   * Add a new test case with expected results
   */
  async addTestCase(url, expectedData, metadata = {}) {
    const testCase = {
      url,
      expected: expectedData,
      metadata: {
        platform: this.detectPlatform(url),
        dateAdded: new Date().toISOString(),
        source: metadata.source || 'manual',
        difficulty: metadata.difficulty || 'medium',
        ...metadata
      }
    };

    const testId = this.generateTestId(url);
    this.testCases.set(testId, testCase);
    
    await this.saveTestCase(testId, testCase);
    console.log(`✅ Added test case: ${testId} (${testCase.metadata.platform})`);
    
    return testId;
  }

  /**
   * Run all test cases and generate accuracy report
   */
  async runAllTests() {
    console.log(`🚀 Running ${this.testCases.size} test cases...`);
    const results = [];
    
    for (const [testId, testCase] of this.testCases) {
      console.log(`\n📋 Testing: ${testId}`);
      const result = await this.runSingleTest(testId, testCase);
      results.push(result);
      
      // Log immediate feedback
      const accuracy = result.accuracy.overall;
      const status = accuracy >= 0.8 ? '✅' : accuracy >= 0.6 ? '⚠️' : '❌';
      console.log(`${status} Accuracy: ${(accuracy * 100).toFixed(1)}% (${result.extracted}/${result.expected} fields)`);
    }

    const report = await this.generateReport(results);
    await this.saveReport(report);
    
    return report;
  }

  /**
   * Run a single test case and calculate field-level accuracy
   */
  async runSingleTest(testId, testCase) {
    const startTime = Date.now();
    
    try {
      // Run scraper
      const scrapingResult = await scraperService.scrapeTitle(testCase.url);
      const duration = Date.now() - startTime;
      
      // Calculate accuracy
      const accuracy = this.calculateAccuracy(testCase.expected, scrapingResult.data);
      
      const result = {
        testId,
        url: testCase.url,
        platform: testCase.metadata.platform,
        success: scrapingResult.success,
        expected: Object.keys(testCase.expected).length,
        extracted: scrapingResult.extractedFields.length,
        accuracy,
        confidence: scrapingResult.confidence,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        logs: scrapingResult.logs,
        data: scrapingResult.data,
        expectedData: testCase.expected,
        metadata: testCase.metadata
      };

      return result;
      
    } catch (error) {
      return {
        testId,
        url: testCase.url,
        platform: testCase.metadata.platform,
        success: false,
        error: error.message,
        expected: Object.keys(testCase.expected).length,
        extracted: 0,
        accuracy: { overall: 0, byField: {} },
        confidence: 0,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate field-level accuracy between expected and actual data
   */
  calculateAccuracy(expected, actual) {
    const fieldAccuracy = {};
    let correctFields = 0;
    let totalFields = 0;

    for (const [field, expectedValue] of Object.entries(expected)) {
      totalFields++;
      const actualValue = actual[field];
      
      let isCorrect = false;
      let score = 0;

      if (actualValue && actualValue !== 'N/A') {
        switch (field) {
          case 'views':
            // Numerical fields: exact match or within 10% tolerance
            const expectedNum = Number(expectedValue);
            const actualNum = Number(actualValue);
            if (expectedNum === actualNum) {
              isCorrect = true;
              score = 1.0;
            } else if (Math.abs(expectedNum - actualNum) / expectedNum <= 0.1) {
              score = 0.8; // Partial credit for close values
            }
            break;
            
          case 'title_name_kr':
          case 'author':
          case 'story_author_kr':
          case 'art_author_kr':
            // String fields: exact match or high similarity
            if (expectedValue === actualValue) {
              isCorrect = true;
              score = 1.0;
            } else if (this.stringSimilarity(expectedValue, actualValue) >= 0.9) {
              score = 0.9;
            } else if (this.stringSimilarity(expectedValue, actualValue) >= 0.7) {
              score = 0.7;
            }
            break;
            
          case 'genre':
          case 'audience':
          case 'cp':
            // Categorical fields: exact match
            if (expectedValue === actualValue) {
              isCorrect = true;
              score = 1.0;
            }
            break;
            
          case 'completed':
            // Boolean fields: exact match
            if (Boolean(expectedValue) === Boolean(actualValue)) {
              isCorrect = true;
              score = 1.0;
            }
            break;
            
          default:
            // Default: exact match
            if (expectedValue === actualValue) {
              isCorrect = true;
              score = 1.0;
            }
        }
        
        if (isCorrect) correctFields++;
      }

      fieldAccuracy[field] = {
        expected: expectedValue,
        actual: actualValue,
        correct: isCorrect,
        score: score
      };
    }

    return {
      overall: totalFields > 0 ? correctFields / totalFields : 0,
      byField: fieldAccuracy,
      correctFields,
      totalFields
    };
  }

  /**
   * Generate comprehensive test report with insights
   */
  async generateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.accuracy.overall >= 0.8).length,
        warning: results.filter(r => r.accuracy.overall >= 0.6 && r.accuracy.overall < 0.8).length,
        failed: results.filter(r => r.accuracy.overall < 0.6).length,
        avgAccuracy: results.reduce((sum, r) => sum + r.accuracy.overall, 0) / results.length,
        avgConfidence: results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length
      },
      byPlatform: {},
      fieldAnalysis: {},
      recommendations: [],
      results
    };

    // Platform analysis
    const platforms = [...new Set(results.map(r => r.platform))];
    for (const platform of platforms) {
      const platformResults = results.filter(r => r.platform === platform);
      report.byPlatform[platform] = {
        count: platformResults.length,
        avgAccuracy: platformResults.reduce((sum, r) => sum + r.accuracy.overall, 0) / platformResults.length,
        passed: platformResults.filter(r => r.accuracy.overall >= 0.8).length
      };
    }

    // Field analysis
    const allFields = new Set();
    results.forEach(r => Object.keys(r.accuracy.byField || {}).forEach(f => allFields.add(f)));
    
    for (const field of allFields) {
      const fieldResults = results.map(r => r.accuracy.byField[field]).filter(Boolean);
      report.fieldAnalysis[field] = {
        totalTests: fieldResults.length,
        avgScore: fieldResults.reduce((sum, f) => sum + f.score, 0) / fieldResults.length,
        correctCount: fieldResults.filter(f => f.correct).length,
        accuracy: fieldResults.filter(f => f.correct).length / fieldResults.length
      };
    }

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  /**
   * Generate actionable recommendations based on test results
   */
  generateRecommendations(report) {
    const recommendations = [];

    // Platform-specific recommendations
    for (const [platform, stats] of Object.entries(report.byPlatform)) {
      if (stats.avgAccuracy < 0.7) {
        recommendations.push({
          type: 'platform',
          priority: 'high',
          platform,
          issue: `Low accuracy for ${platform} (${(stats.avgAccuracy * 100).toFixed(1)}%)`,
          suggestion: `Review and improve ${platform} scraper patterns. Consider adding more specific selectors.`
        });
      }
    }

    // Field-specific recommendations  
    for (const [field, stats] of Object.entries(report.fieldAnalysis)) {
      if (stats.accuracy < 0.6) {
        recommendations.push({
          type: 'field',
          priority: stats.accuracy < 0.3 ? 'high' : 'medium',
          field,
          issue: `Poor extraction accuracy for ${field} (${(stats.accuracy * 100).toFixed(1)}%)`,
          suggestion: `Improve ${field} extraction patterns. Consider adding fallback selectors or regex patterns.`
        });
      }
    }

    // Overall recommendations
    if (report.summary.avgAccuracy < 0.75) {
      recommendations.push({
        type: 'general',
        priority: 'high',
        issue: `Overall accuracy below target (${(report.summary.avgAccuracy * 100).toFixed(1)}%)`,
        suggestion: 'Focus on improving high-value fields like title_name_kr, author, and genre extraction.'
      });
    }

    return recommendations.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  }

  /**
   * String similarity calculation (Jaro-Winkler-like)
   */
  stringSimilarity(str1, str2) {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  // Helper methods
  detectPlatform(url) {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('series.naver.com') || hostname.includes('comic.naver.com')) return 'naver';
    if (hostname.includes('page.kakao.com')) return 'kakaopage';
    if (hostname.includes('webtoon.kakao.com')) return 'kakao_webtoon';
    if (hostname.includes('webtoons.com')) return 'webtoons';
    if (hostname.includes('toons.kr')) return 'toons';
    return 'generic';
  }

  generateTestId(url) {
    return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50) + '_' + Date.now().toString(36);
  }

  async saveTestCase(testId, testCase) {
    const filePath = path.join(this.testDataPath, `${testId}.json`);
    await fs.writeFile(filePath, JSON.stringify(testCase, null, 2));
  }

  async loadTestCases() {
    try {
      const files = await fs.readdir(this.testDataPath);
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const testId = file.replace('.json', '');
        const content = await fs.readFile(path.join(this.testDataPath, file), 'utf8');
        this.testCases.set(testId, JSON.parse(content));
      }
    } catch (error) {
      console.log('No existing test cases found, starting fresh');
    }
  }

  async saveReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(this.resultsPath, `report_${timestamp}.json`);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    console.log(`📊 Report saved: ${filePath}`);
  }
}

export default ScraperTestSuite;