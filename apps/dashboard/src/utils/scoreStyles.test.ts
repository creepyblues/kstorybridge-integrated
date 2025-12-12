import { describe, it, expect } from 'vitest';
import {
  SCORE_THRESHOLDS,
  getScoreBadgeStyles,
  getDimensionBadgeColor,
  getScoreBackgroundColor,
  getScoreTextColor,
  getScoreLabel,
} from './scoreStyles';

describe('scoreStyles', () => {
  describe('SCORE_THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(SCORE_THRESHOLDS.EXCELLENT).toBe(85);
      expect(SCORE_THRESHOLDS.GOOD).toBe(70);
      expect(SCORE_THRESHOLDS.FAIR).toBe(55);
    });
  });

  describe('getScoreBadgeStyles', () => {
    it('should return emerald styles for excellent scores (85+)', () => {
      const styles = getScoreBadgeStyles(85);
      expect(styles.gradient).toContain('emerald');
      expect(styles.text).toContain('emerald');
      expect(styles.border).toContain('emerald');
    });

    it('should return emerald styles for scores above 85', () => {
      const styles = getScoreBadgeStyles(95);
      expect(styles.gradient).toContain('emerald');
    });

    it('should return blue styles for good scores (70-84)', () => {
      const styles = getScoreBadgeStyles(70);
      expect(styles.gradient).toContain('blue');
      expect(styles.text).toContain('blue');
      expect(styles.border).toContain('blue');
    });

    it('should return blue styles for score 84', () => {
      const styles = getScoreBadgeStyles(84);
      expect(styles.gradient).toContain('blue');
    });

    it('should return amber styles for fair scores (55-69)', () => {
      const styles = getScoreBadgeStyles(55);
      expect(styles.gradient).toContain('amber');
      expect(styles.text).toContain('amber');
      expect(styles.border).toContain('amber');
    });

    it('should return amber styles for score 69', () => {
      const styles = getScoreBadgeStyles(69);
      expect(styles.gradient).toContain('amber');
    });

    it('should return purple styles for low scores (<55)', () => {
      const styles = getScoreBadgeStyles(54);
      expect(styles.gradient).toContain('purple');
      expect(styles.text).toContain('purple');
      expect(styles.border).toContain('purple');
    });

    it('should return purple styles for very low scores', () => {
      const styles = getScoreBadgeStyles(10);
      expect(styles.gradient).toContain('purple');
    });
  });

  describe('getDimensionBadgeColor', () => {
    it('should return emerald for excellent scores', () => {
      expect(getDimensionBadgeColor(90)).toContain('emerald');
    });

    it('should return blue for good scores', () => {
      expect(getDimensionBadgeColor(75)).toContain('blue');
    });

    it('should return amber for fair scores', () => {
      expect(getDimensionBadgeColor(60)).toContain('amber');
    });

    it('should return gray for low scores', () => {
      expect(getDimensionBadgeColor(40)).toContain('gray');
    });
  });

  describe('getScoreBackgroundColor', () => {
    it('should return green for excellent scores', () => {
      expect(getScoreBackgroundColor(90)).toBe('bg-green-500');
    });

    it('should return blue for good scores', () => {
      expect(getScoreBackgroundColor(75)).toBe('bg-blue-500');
    });

    it('should return yellow for fair scores', () => {
      expect(getScoreBackgroundColor(60)).toBe('bg-yellow-500');
    });

    it('should return gray for low scores', () => {
      expect(getScoreBackgroundColor(40)).toBe('bg-gray-400');
    });
  });

  describe('getScoreTextColor', () => {
    it('should return green for excellent scores', () => {
      expect(getScoreTextColor(90)).toBe('text-green-600');
    });

    it('should return blue for good scores', () => {
      expect(getScoreTextColor(75)).toBe('text-blue-600');
    });

    it('should return yellow for fair scores', () => {
      expect(getScoreTextColor(60)).toBe('text-yellow-600');
    });

    it('should return gray for low scores', () => {
      expect(getScoreTextColor(40)).toBe('text-gray-500');
    });
  });

  describe('getScoreLabel', () => {
    it('should return "Excellent" for scores 85+', () => {
      expect(getScoreLabel(85)).toBe('Excellent');
      expect(getScoreLabel(100)).toBe('Excellent');
    });

    it('should return "Good" for scores 70-84', () => {
      expect(getScoreLabel(70)).toBe('Good');
      expect(getScoreLabel(84)).toBe('Good');
    });

    it('should return "Fair" for scores 55-69', () => {
      expect(getScoreLabel(55)).toBe('Fair');
      expect(getScoreLabel(69)).toBe('Fair');
    });

    it('should return "Low" for scores below 55', () => {
      expect(getScoreLabel(54)).toBe('Low');
      expect(getScoreLabel(0)).toBe('Low');
    });
  });

  describe('edge cases', () => {
    it('should handle boundary scores correctly', () => {
      // Exactly at thresholds
      expect(getScoreLabel(85)).toBe('Excellent');
      expect(getScoreLabel(70)).toBe('Good');
      expect(getScoreLabel(55)).toBe('Fair');

      // Just below thresholds
      expect(getScoreLabel(84)).toBe('Good');
      expect(getScoreLabel(69)).toBe('Fair');
      expect(getScoreLabel(54)).toBe('Low');
    });

    it('should handle zero score', () => {
      expect(getScoreLabel(0)).toBe('Low');
      expect(getScoreBackgroundColor(0)).toBe('bg-gray-400');
    });

    it('should handle 100 score', () => {
      expect(getScoreLabel(100)).toBe('Excellent');
      expect(getScoreBackgroundColor(100)).toBe('bg-green-500');
    });
  });
});
