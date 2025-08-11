/**
 * Testing & Feedback API Routes
 * Provides endpoints for test management and feedback collection
 */

import express from 'express';
import ScraperTestSuite from '../tests/scraperTestSuite.js';
import feedbackService from '../services/feedbackService.js';

const router = express.Router();
const testSuite = new ScraperTestSuite();

// Initialize services
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await testSuite.init();
    await feedbackService.init();
    initialized = true;
  }
}

/**
 * Add a new test case
 * POST /api/testing/test-case
 */
router.post('/test-case', async (req, res) => {
  try {
    await ensureInitialized();
    const { url, expectedData, metadata } = req.body;
    
    if (!url || !expectedData) {
      return res.status(400).json({
        success: false,
        error: 'URL and expectedData are required'
      });
    }

    const testId = await testSuite.addTestCase(url, expectedData, metadata);
    
    res.json({
      success: true,
      testId,
      message: 'Test case added successfully'
    });
    
  } catch (error) {
    console.error('Failed to add test case:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add test case',
      details: error.message
    });
  }
});

/**
 * Run all tests and generate report
 * POST /api/testing/run-all
 */
router.post('/run-all', async (req, res) => {
  try {
    await ensureInitialized();
    
    console.log('🧪 Starting comprehensive test run...');
    const report = await testSuite.runAllTests();
    
    res.json({
      success: true,
      report,
      summary: {
        totalTests: report.summary.totalTests,
        passed: report.summary.passed,
        avgAccuracy: Math.round(report.summary.avgAccuracy * 100) + '%',
        recommendations: report.recommendations.length
      }
    });
    
  } catch (error) {
    console.error('Failed to run tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run tests',
      details: error.message
    });
  }
});

/**
 * Get test report summary
 * GET /api/testing/report
 */
router.get('/report', async (req, res) => {
  try {
    await ensureInitialized();
    
    // Run a quick subset of tests for status check
    const quickTests = Array.from(testSuite.testCases.entries()).slice(0, 5);
    const quickResults = [];
    
    for (const [testId, testCase] of quickTests) {
      const result = await testSuite.runSingleTest(testId, testCase);
      quickResults.push(result);
    }
    
    const avgAccuracy = quickResults.reduce((sum, r) => sum + r.accuracy.overall, 0) / quickResults.length;
    
    res.json({
      success: true,
      quickCheck: {
        testsRun: quickResults.length,
        totalAvailable: testSuite.testCases.size,
        avgAccuracy: Math.round(avgAccuracy * 100) + '%',
        status: avgAccuracy >= 0.8 ? 'good' : avgAccuracy >= 0.6 ? 'warning' : 'needs_improvement'
      },
      lastRun: quickResults[0]?.timestamp || null
    });
    
  } catch (error) {
    console.error('Failed to get test report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test report',
      details: error.message
    });
  }
});

/**
 * Submit correction feedback
 * POST /api/testing/feedback
 */
router.post('/feedback', async (req, res) => {
  try {
    await ensureInitialized();
    const { url, originalData, correctedData, userContext } = req.body;
    
    if (!url || !originalData || !correctedData) {
      return res.status(400).json({
        success: false,
        error: 'URL, originalData, and correctedData are required'
      });
    }

    const correctionId = await feedbackService.submitCorrection(
      url,
      originalData,
      correctedData,
      userContext
    );
    
    res.json({
      success: true,
      correctionId,
      message: 'Feedback submitted successfully'
    });
    
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
      details: error.message
    });
  }
});

/**
 * Get feedback analysis
 * GET /api/testing/feedback/analysis
 */
router.get('/feedback/analysis', async (req, res) => {
  try {
    await ensureInitialized();
    
    const analysis = await feedbackService.analyzeFeedbackPatterns();
    
    res.json({
      success: true,
      analysis,
      summary: {
        totalCorrections: analysis.totalCorrections,
        platforms: Object.keys(analysis.byPlatform).length,
        topIssues: analysis.recommendations.slice(0, 5)
      }
    });
    
  } catch (error) {
    console.error('Failed to get feedback analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback analysis',
      details: error.message
    });
  }
});

/**
 * Quick test with specific URL (for debugging)
 * POST /api/testing/quick-test
 */
router.post('/quick-test', async (req, res) => {
  try {
    await ensureInitialized();
    const { url, expectedData } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Create temporary test case
    const tempTestCase = {
      url,
      expected: expectedData || {},
      metadata: { source: 'quick_test', temporary: true }
    };
    
    const result = await testSuite.runSingleTest('temp_test', tempTestCase);
    
    res.json({
      success: true,
      result: {
        url: result.url,
        platform: result.platform,
        success: result.success,
        accuracy: expectedData ? Math.round(result.accuracy.overall * 100) + '%' : 'N/A',
        confidence: Math.round(result.confidence * 100) + '%',
        extractedFields: result.extracted,
        duration: result.duration,
        data: result.data
      }
    });
    
  } catch (error) {
    console.error('Failed to run quick test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run quick test',
      details: error.message
    });
  }
});

/**
 * Get available test cases
 * GET /api/testing/test-cases
 */
router.get('/test-cases', async (req, res) => {
  try {
    await ensureInitialized();
    
    const testCases = Array.from(testSuite.testCases.entries()).map(([id, testCase]) => ({
      id,
      url: testCase.url,
      platform: testCase.metadata.platform,
      difficulty: testCase.metadata.difficulty,
      dateAdded: testCase.metadata.dateAdded,
      expectedFields: Object.keys(testCase.expected).length
    }));
    
    res.json({
      success: true,
      testCases,
      summary: {
        total: testCases.length,
        byPlatform: testCases.reduce((acc, tc) => {
          acc[tc.platform] = (acc[tc.platform] || 0) + 1;
          return acc;
        }, {}),
        byDifficulty: testCases.reduce((acc, tc) => {
          acc[tc.difficulty] = (acc[tc.difficulty] || 0) + 1;
          return acc;
        }, {})
      }
    });
    
  } catch (error) {
    console.error('Failed to get test cases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test cases',
      details: error.message
    });
  }
});

export default router;