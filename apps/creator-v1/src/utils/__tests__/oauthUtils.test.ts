import { describe, it, expect } from 'vitest';
import { getDashboardPath, getSignupPath, isValidAccountType } from '../oauthUtils';

describe('OAuthUtils - Clean URL Support', () => {
  describe('getDashboardPath', () => {
    it('should return clean URL /home for creator account type', () => {
      const path = getDashboardPath('creator');
      expect(path).toBe('/home');
    });

    it('should return /buyers/home for buyer account type', () => {
      const path = getDashboardPath('buyer');
      expect(path).toBe('/buyers/home');
    });

    it('should not include /creators prefix for creator (clean URLs)', () => {
      const path = getDashboardPath('creator');
      expect(path).not.toContain('/creators');
      expect(path).toBe('/home');
    });
  });

  describe('getSignupPath', () => {
    it('should return clean URL /signup for creator account type', () => {
      const path = getSignupPath('creator');
      expect(path).toBe('/signup');
    });

    it('should return /signup/buyer for buyer account type', () => {
      const path = getSignupPath('buyer');
      expect(path).toBe('/signup/buyer');
    });

    it('should not include account type suffix for creator (clean URLs)', () => {
      const path = getSignupPath('creator');
      expect(path).not.toContain('/creator');
      expect(path).toBe('/signup');
    });
  });

  describe('isValidAccountType', () => {
    it('should return true for valid account types', () => {
      expect(isValidAccountType('buyer')).toBe(true);
      expect(isValidAccountType('creator')).toBe(true);
    });

    it('should return false for invalid account types', () => {
      expect(isValidAccountType('admin')).toBe(false);
      expect(isValidAccountType('user')).toBe(false);
      expect(isValidAccountType('')).toBe(false);
      expect(isValidAccountType(null)).toBe(false);
      expect(isValidAccountType(undefined)).toBe(false);
      expect(isValidAccountType(123)).toBe(false);
    });
  });

  describe('OAuth Redirect Flow Integration', () => {
    it('should generate correct OAuth signup redirect for creator', () => {
      const signupPath = getSignupPath('creator');
      const completeUrl = `${signupPath}?complete=true&user_id=test-id&email=test@example.com`;

      expect(completeUrl).toBe('/signup?complete=true&user_id=test-id&email=test@example.com');
      expect(completeUrl).not.toContain('/signup/creator');
    });

    it('should generate correct OAuth signin redirect for creator', () => {
      const dashboardPath = getDashboardPath('creator');

      expect(dashboardPath).toBe('/home');
      expect(dashboardPath).not.toContain('/creators');
    });

    it('should avoid redirect loops with legacy routes', () => {
      // Legacy route: /signup/creator -> /signup
      // OAuth should target: /signup directly
      const signupPath = getSignupPath('creator');

      expect(signupPath).toBe('/signup');
      // This ensures no redirect loop: OAuth -> /signup/creator -> /signup
      // Instead: OAuth -> /signup (direct)
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain buyer paths for buyer app compatibility', () => {
      expect(getDashboardPath('buyer')).toBe('/buyers/home');
      expect(getSignupPath('buyer')).toBe('/signup/buyer');
    });

    it('should use clean URLs only for creator app', () => {
      // Creator app: clean URLs
      expect(getDashboardPath('creator')).toBe('/home');
      expect(getSignupPath('creator')).toBe('/signup');

      // Buyer app: legacy URLs (for compatibility)
      expect(getDashboardPath('buyer')).not.toBe('/home');
      expect(getSignupPath('buyer')).not.toBe('/signup');
    });
  });
});
