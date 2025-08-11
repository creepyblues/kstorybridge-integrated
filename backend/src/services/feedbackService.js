/**
 * Feedback Collection Service
 * Collects user corrections and generates training data for scraper improvement
 */

import fs from 'fs/promises';
import path from 'path';

class FeedbackService {
  constructor() {
    this.feedbackPath = './feedback-data';
    this.corrections = new Map();
  }

  /**
   * Initialize feedback collection system
   */
  async init() {
    await this.ensureFeedbackDirectory();
    await this.loadExistingFeedback();
    console.log(`🔄 Feedback Service initialized with ${this.corrections.size} corrections`);
  }

  async ensureFeedbackDirectory() {
    try {
      await fs.mkdir(this.feedbackPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create feedback directory:', error);
    }
  }

  /**
   * Submit a correction from the admin interface
   */
  async submitCorrection(originalUrl, originalData, correctedData, userContext = {}) {
    const correction = {
      id: this.generateCorrectionId(),
      timestamp: new Date().toISOString(),
      url: originalUrl,
      original: originalData,
      corrected: correctedData,
      platform: this.detectPlatform(originalUrl),
      changes: this.calculateChanges(originalData, correctedData),
      userContext,
      status: 'pending', // pending, reviewed, applied, rejected
      confidence: this.calculateCorrectionConfidence(originalData, correctedData)
    };

    this.corrections.set(correction.id, correction);
    await this.saveCorrection(correction);

    // Auto-generate test case from high-confidence corrections
    if (correction.confidence >= 0.8) {
      await this.generateTestCaseFromCorrection(correction);
    }

    console.log(`✅ Correction submitted: ${correction.id} (${correction.platform})`);
    return correction.id;
  }

  /**
   * Calculate what fields were changed in the correction
   */
  calculateChanges(original, corrected) {
    const changes = {};
    const allFields = new Set([...Object.keys(original), ...Object.keys(corrected)]);

    for (const field of allFields) {
      const originalValue = original[field];
      const correctedValue = corrected[field];

      if (originalValue !== correctedValue) {
        changes[field] = {
          from: originalValue,
          to: correctedValue,
          type: this.getChangeType(originalValue, correctedValue)
        };
      }
    }

    return changes;
  }

  getChangeType(from, to) {
    if (!from || from === 'N/A') return 'added';
    if (!to || to === 'N/A') return 'removed';
    return 'modified';
  }

  /**
   * Calculate confidence score for a correction
   */
  calculateCorrectionConfidence(original, corrected) {
    const changes = this.calculateChanges(original, corrected);
    const changeCount = Object.keys(changes).length;
    
    // High-value fields that increase confidence when corrected
    const highValueFields = ['title_name_kr', 'author', 'genre', 'views', 'cp'];
    const highValueChanges = Object.keys(changes).filter(f => highValueFields.includes(f)).length;
    
    // Base confidence from field importance
    let confidence = 0.5;
    
    // Boost for high-value field corrections
    confidence += highValueChanges * 0.15;
    
    // Reduce for too many changes (might be unreliable)
    if (changeCount > 8) confidence -= 0.2;
    
    // Boost for specific correction patterns
    if (changes.title_name_kr && changes.title_name_kr.type === 'modified') confidence += 0.1;
    if (changes.views && changes.views.type === 'added') confidence += 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Generate a test case from a high-confidence correction
   */
  async generateTestCaseFromCorrection(correction) {
    const testCase = {
      url: correction.url,
      expected: correction.corrected,
      metadata: {
        source: 'user_correction',
        correctionId: correction.id,
        platform: correction.platform,
        dateAdded: new Date().toISOString(),
        difficulty: this.estimateDifficulty(correction.changes),
        changeCount: Object.keys(correction.changes).length
      }
    };

    const testId = `correction_${correction.id}`;
    const filePath = path.join(this.feedbackPath, 'generated-tests', `${testId}.json`);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(testCase, null, 2));
    
    console.log(`🧪 Generated test case: ${testId}`);
    return testId;
  }

  estimateDifficulty(changes) {
    const changeCount = Object.keys(changes).length;
    if (changeCount <= 2) return 'easy';
    if (changeCount <= 5) return 'medium';
    return 'hard';
  }

  /**
   * Analyze feedback patterns to identify improvement opportunities
   */
  async analyzeFeedbackPatterns() {
    const analysis = {
      timestamp: new Date().toISOString(),
      totalCorrections: this.corrections.size,
      byPlatform: {},
      commonIssues: {},
      fieldAccuracy: {},
      recommendations: []
    };

    // Platform analysis
    for (const correction of this.corrections.values()) {
      if (!analysis.byPlatform[correction.platform]) {
        analysis.byPlatform[correction.platform] = {
          count: 0,
          commonFields: {},
          avgChanges: 0
        };
      }
      
      const platform = analysis.byPlatform[correction.platform];
      platform.count++;
      platform.avgChanges += Object.keys(correction.changes).length;
      
      // Track commonly corrected fields per platform
      for (const field of Object.keys(correction.changes)) {
        platform.commonFields[field] = (platform.commonFields[field] || 0) + 1;
      }
    }

    // Calculate averages
    for (const platform of Object.values(analysis.byPlatform)) {
      platform.avgChanges = platform.avgChanges / platform.count;
    }

    // Field accuracy analysis
    const allFields = new Set();
    for (const correction of this.corrections.values()) {
      Object.keys(correction.changes).forEach(f => allFields.add(f));
    }

    for (const field of allFields) {
      const corrections = Array.from(this.corrections.values()).filter(c => c.changes[field]);
      analysis.fieldAccuracy[field] = {
        correctionCount: corrections.length,
        platforms: [...new Set(corrections.map(c => c.platform))],
        changeTypes: corrections.reduce((types, c) => {
          const type = c.changes[field].type;
          types[type] = (types[type] || 0) + 1;
          return types;
        }, {})
      };
    }

    // Generate recommendations
    analysis.recommendations = this.generateImprovementRecommendations(analysis);

    return analysis;
  }

  generateImprovementRecommendations(analysis) {
    const recommendations = [];

    // Platform-specific issues
    for (const [platform, stats] of Object.entries(analysis.byPlatform)) {
      if (stats.count >= 3) {
        const topField = Object.entries(stats.commonFields)
          .sort(([,a], [,b]) => b - a)[0];
        
        if (topField && topField[1] >= 2) {
          recommendations.push({
            type: 'platform_field',
            priority: 'high',
            platform,
            field: topField[0],
            issue: `${topField[0]} frequently corrected on ${platform} (${topField[1]} times)`,
            suggestion: `Review and improve ${topField[0]} extraction patterns for ${platform}`
          });
        }
      }
    }

    // Field-wide issues
    for (const [field, stats] of Object.entries(analysis.fieldAccuracy)) {
      if (stats.correctionCount >= 5) {
        recommendations.push({
          type: 'field',
          priority: 'medium',
          field,
          issue: `${field} corrected ${stats.correctionCount} times across platforms`,
          suggestion: `Implement better fallback patterns for ${field} extraction`
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  }

  /**
   * Export corrections as training data
   */
  async exportTrainingData() {
    const trainingData = Array.from(this.corrections.values())
      .filter(c => c.confidence >= 0.7)
      .map(c => ({
        url: c.url,
        platform: c.platform,
        expected: c.corrected,
        original: c.original,
        changes: c.changes,
        timestamp: c.timestamp
      }));

    const exportFile = path.join(this.feedbackPath, `training_data_${Date.now()}.json`);
    await fs.writeFile(exportFile, JSON.stringify(trainingData, null, 2));
    
    console.log(`📤 Exported ${trainingData.length} corrections as training data: ${exportFile}`);
    return exportFile;
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

  generateCorrectionId() {
    return `correction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveCorrection(correction) {
    const filePath = path.join(this.feedbackPath, 'corrections', `${correction.id}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(correction, null, 2));
  }

  async loadExistingFeedback() {
    try {
      const correctionsPath = path.join(this.feedbackPath, 'corrections');
      const files = await fs.readdir(correctionsPath);
      
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const content = await fs.readFile(path.join(correctionsPath, file), 'utf8');
        const correction = JSON.parse(content);
        this.corrections.set(correction.id, correction);
      }
    } catch (error) {
      console.log('No existing feedback found, starting fresh');
    }
  }
}

export default new FeedbackService();