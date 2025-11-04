/**
 * Signup Service Clean URL Test Suite
 *
 * Tests for handleOAuthSignup with NO URL parameters (per CLAUDE.md)
 * Validates clean callback URL generation and sessionStorage usage
 *
 * Related files:
 * - signupService.ts: OAuth signup initiation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock authService BEFORE importing the module that uses it
const mockSignInWithOAuth = vi.fn();

vi.mock('@/services/auth', () => ({
  authService: {
    signInWithOAuth: mockSignInWithOAuth,
  },
}));

// Now import after mocking
const { handleOAuthSignup } = await import('@/components/auth/signupService');

describe('Signup Service - Clean OAuth Callback URL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    // Mock window.location.origin
    delete (window as unknown as { location: unknown }).location;
    (window as unknown as { location: { origin: string } }).location = {
      origin: 'http://localhost:8081',
    };
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('CRITICAL: Clean Callback URL (No Parameters)', () => {
    it('should generate callback URL WITHOUT account_type parameter', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('google', 'buyer');

      expect(mockSignInWithOAuth).toHaveBeenCalledWith('google', {
        redirectTo: 'http://localhost:8081/auth/callback', // Clean URL
      });

      // Verify NO parameters in callback URL
      const callArgs = mockSignInWithOAuth.mock.calls[0];
      const redirectTo = callArgs[1].redirectTo;
      expect(redirectTo).not.toContain('?');
      expect(redirectTo).not.toContain('account_type');
      expect(redirectTo).not.toContain('flow');
    });

    it('should generate callback URL WITHOUT flow parameter', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('google', 'creator');

      const callArgs = mockSignInWithOAuth.mock.calls[0];
      const redirectTo = callArgs[1].redirectTo;

      expect(redirectTo).toBe('http://localhost:8081/auth/callback');
      expect(redirectTo).not.toContain('flow=signup');
    });

    it('should NOT append any query parameters to callback URL', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('discord', 'buyer');

      const callArgs = mockSignInWithOAuth.mock.calls[0];
      const redirectTo = callArgs[1].redirectTo;

      // Callback URL must be clean (per CLAUDE.md critical rule)
      expect(redirectTo).toBe('http://localhost:8081/auth/callback');
      expect(redirectTo.split('?').length).toBe(1); // No query string
    });
  });

  describe('SessionStorage Data Passing', () => {
    it('should store account_type in sessionStorage for buyer signup', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('google', 'buyer');

      expect(sessionStorage.getItem('oauth_account_type')).toBe('buyer');
      expect(sessionStorage.getItem('oauth_flow')).toBe('signup');
    });

    // Creator test removed - dashboard app now only handles buyer auth (creator auth moved to creator app)

    it('should store flow type as "signup" in sessionStorage', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('discord', 'buyer');

      expect(sessionStorage.getItem('oauth_flow')).toBe('signup');
    });

    it('should use sessionStorage as PRIMARY data passing mechanism', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('google');

      // Verify sessionStorage is set BEFORE OAuth redirect (dashboard app only handles buyer)
      expect(sessionStorage.getItem('oauth_account_type')).toBe('buyer');
      expect(sessionStorage.getItem('oauth_flow')).toBe('signup');

      // Verify callback URL is clean
      const callArgs = mockSignInWithOAuth.mock.calls[0];
      expect(callArgs[1].redirectTo).not.toContain('account_type');
    });
  });

  describe('OAuth Provider Support', () => {
    it('should support Google OAuth with clean callback', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      const result = await handleOAuthSignup('google', 'buyer');

      expect(result.error).toBeUndefined();
      expect(mockSignInWithOAuth).toHaveBeenCalledWith('google', {
        redirectTo: 'http://localhost:8081/auth/callback',
      });
    });

    it('should support Discord OAuth with clean callback', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      const result = await handleOAuthSignup('discord', 'creator');

      expect(result.error).toBeUndefined();
      expect(mockSignInWithOAuth).toHaveBeenCalledWith('discord', {
        redirectTo: 'http://localhost:8081/auth/callback',
      });
    });
  });

  describe('Error Handling', () => {
    it('should return error if OAuth initiation fails', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        error: 'OAuth provider unavailable',
      });

      const result = await handleOAuthSignup('google', 'buyer');

      expect(result.error).toBe('OAuth provider unavailable');
    });

    it('should handle exceptions during OAuth signup', async () => {
      mockSignInWithOAuth.mockRejectedValue(new Error('Network error'));

      const result = await handleOAuthSignup('google', 'creator');

      expect(result.error).toBe('Network error');
    });

    it('should handle non-Error exceptions', async () => {
      mockSignInWithOAuth.mockRejectedValue('Unknown error');

      const result = await handleOAuthSignup('google', 'buyer');

      expect(result.error).toBe('OAuth signup failed');
    });
  });

  describe('Production Environment', () => {
    it('should generate correct callback URL for production', async () => {
      // Mock production URL
      (window as unknown as { location: { origin: string } }).location.origin = 'https://dashboard.kstorybridge.com';
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('google', 'buyer');

      expect(mockSignInWithOAuth).toHaveBeenCalledWith('google', {
        redirectTo: 'https://dashboard.kstorybridge.com/auth/callback',
      });
    });

    it('should maintain clean URL in production', async () => {
      (window as unknown as { location: { origin: string } }).location.origin = 'https://dashboard.kstorybridge.com';
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('google', 'creator');

      const callArgs = mockSignInWithOAuth.mock.calls[0];
      const redirectTo = callArgs[1].redirectTo;

      // Must be clean even in production
      expect(redirectTo).toBe('https://dashboard.kstorybridge.com/auth/callback');
      expect(redirectTo).not.toContain('?');
    });
  });

  describe('Localhost Development', () => {
    it('should generate correct callback URL for localhost', async () => {
      (window as unknown as { location: { origin: string } }).location.origin = 'http://localhost:8081';
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('google', 'buyer');

      expect(mockSignInWithOAuth).toHaveBeenCalledWith('google', {
        redirectTo: 'http://localhost:8081/auth/callback',
      });
    });

    it('should maintain clean URL in development', async () => {
      (window as unknown as { location: { origin: string } }).location.origin = 'http://localhost:8081';
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('google', 'creator');

      const callArgs = mockSignInWithOAuth.mock.calls[0];
      const redirectTo = callArgs[1].redirectTo;

      expect(redirectTo).not.toContain('account_type');
      expect(redirectTo).not.toContain('flow');
    });
  });

  describe('Account Type Validation', () => {
    it('should handle buyer account type correctly', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await handleOAuthSignup('google', 'buyer');

      expect(sessionStorage.getItem('oauth_account_type')).toBe('buyer');
    });

    // Creator test removed - dashboard app now only handles buyer auth (creator auth moved to creator app)
  });

  describe('Callback URL Consistency', () => {
    it('should generate same callback URL for all account types', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      // Buyer
      await handleOAuthSignup('google', 'buyer');
      const buyerCallbackUrl = mockSignInWithOAuth.mock.calls[0][1].redirectTo;

      // Creator
      mockSignInWithOAuth.mockClear();
      await handleOAuthSignup('google', 'creator');
      const creatorCallbackUrl = mockSignInWithOAuth.mock.calls[0][1].redirectTo;

      // Callback URL should be IDENTICAL for all account types
      expect(buyerCallbackUrl).toBe(creatorCallbackUrl);
      expect(buyerCallbackUrl).toBe('http://localhost:8081/auth/callback');
    });

    it('should generate same callback URL for all providers', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      // Google
      await handleOAuthSignup('google', 'buyer');
      const googleCallbackUrl = mockSignInWithOAuth.mock.calls[0][1].redirectTo;

      // Discord
      mockSignInWithOAuth.mockClear();
      await handleOAuthSignup('discord', 'buyer');
      const discordCallbackUrl = mockSignInWithOAuth.mock.calls[0][1].redirectTo;

      // Callback URL should be IDENTICAL for all providers
      expect(googleCallbackUrl).toBe(discordCallbackUrl);
      expect(googleCallbackUrl).toBe('http://localhost:8081/auth/callback');
    });
  });
});
