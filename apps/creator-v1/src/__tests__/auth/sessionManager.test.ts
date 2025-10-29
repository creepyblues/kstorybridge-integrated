/**
 * Session Manager Test Suite
 *
 * Comprehensive tests for session validation, recovery, and health check logic.
 * Target: sessionManager.ts (960 lines, previously 0% coverage)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import {
  validateSessionIntegrity,
  validateSessionTokens,
  performSessionCleanup,
  recoverCorruptedSession,
  isSessionExpiredOrExpiring,
  refreshSessionIfNeeded,
  performSessionHealthCheck,
  getCurrentSession,
} from '@/utils/sessionManager';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      setSession: vi.fn(),
    },
  },
  isNetworkError: vi.fn((error: any) => {
    const msg = error?.message?.toLowerCase() || '';
    return msg.includes('network') || msg.includes('timeout');
  }),
  performSupabaseHealthCheck: vi.fn(() =>
    Promise.resolve({ healthy: true, response: 100 })
  ),
}));

describe('Session Manager - Integrity Validation', () => {
  describe('validateSessionIntegrity', () => {
    it('should pass validation for valid session', () => {
      const validSession: Session = {
        access_token: 'valid.jwt.token'.repeat(10), // 45+ chars
        refresh_token: 'refresh_token_here',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
        token_type: 'bearer',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      };

      const result = validateSessionIntegrity(validSession);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });

    it('should fail validation for null session', () => {
      const result = validateSessionIntegrity(null);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('No session provided');
      expect(result.recommendations).toContain('User should sign in');
    });

    it('should fail validation for short access token', () => {
      const invalidSession: Session = {
        access_token: 'short', // Too short (< 20 chars)
        refresh_token: 'refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      };

      const result = validateSessionIntegrity(invalidSession);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid or missing access token');
      expect(result.recommendations).toContain(
        'Session should be refreshed or user re-authenticated'
      );
    });

    it('should fail validation for expired session', () => {
      const expiredSession: Session = {
        access_token: 'valid.jwt.token'.repeat(10),
        refresh_token: 'refresh_token',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        token_type: 'bearer',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      };

      const result = validateSessionIntegrity(expiredSession);

      expect(result.isValid).toBe(false);
      expect(result.issues.some((issue) => issue.includes('expired'))).toBe(true);
      expect(result.recommendations).toContain('Refresh session or re-authenticate');
    });

    it('should warn for soon-to-expire session', () => {
      const expiringSession: Session = {
        access_token: 'valid.jwt.token'.repeat(10),
        refresh_token: 'refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 120, // Expires in 2 minutes
        token_type: 'bearer',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      };

      const result = validateSessionIntegrity(expiringSession);

      expect(result.issues.some((issue) => issue.includes('expires soon'))).toBe(true);
      expect(result.recommendations).toContain('Proactive session refresh recommended');
    });

    it('should fail validation for session with suspicious token patterns', () => {
      const suspiciousSession: Session = {
        access_token: 'undefined.token.here'.repeat(5), // Contains 'undefined'
        refresh_token: 'refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      };

      const result = validateSessionIntegrity(suspiciousSession);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Access token contains suspicious patterns');
    });

    it('should fail validation for missing user data', () => {
      const noUserSession: Session = {
        access_token: 'valid.jwt.token'.repeat(10),
        refresh_token: 'refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: null as any, // Missing user
      };

      const result = validateSessionIntegrity(noUserSession);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Session missing user data');
    });
  });

  describe('validateSessionTokens', () => {
    it('should validate valid URL tokens', () => {
      const urlParams = new URLSearchParams(
        'access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U&refresh_token=refresh_token_here&expires_at=1234567890&token_type=bearer'
      );

      const result = validateSessionTokens(urlParams);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sessionData).toBeDefined();
      expect(result.sessionData?.access_token).toBeTruthy();
    });

    it('should fail validation for missing access token', () => {
      const urlParams = new URLSearchParams('refresh_token=refresh');

      const result = validateSessionTokens(urlParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing access_token parameter');
    });

    it('should fail validation for short access token', () => {
      const urlParams = new URLSearchParams('access_token=short');

      const result = validateSessionTokens(urlParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Access token appears too short (possibly corrupted)'
      );
    });

    it('should fail validation for non-JWT format token', () => {
      const urlParams = new URLSearchParams('access_token=not_a_jwt_format_token');

      const result = validateSessionTokens(urlParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Access token does not appear to be a valid JWT format'
      );
    });

    it('should fail validation for expired token', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const urlParams = new URLSearchParams(
        `access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U&expires_at=${pastTimestamp}`
      );

      const result = validateSessionTokens(urlParams);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((err) => err.includes('expired'))).toBe(true);
    });

    it('should warn for soon-expiring token', () => {
      const soonTimestamp = Math.floor(Date.now() / 1000) + 120; // 2 minutes
      const urlParams = new URLSearchParams(
        `access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U&expires_at=${soonTimestamp}`
      );

      const result = validateSessionTokens(urlParams);

      expect(result.warnings.some((warn) => warn.includes('expires soon'))).toBe(true);
    });
  });
});

describe('Session Manager - Cleanup Operations', () => {
  beforeEach(() => {
    // Mock localStorage and sessionStorage
    global.localStorage = {
      length: 0,
      clear: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      key: vi.fn(),
    };
    global.sessionStorage = {
      length: 0,
      clear: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      key: vi.fn(),
    };
  });

  describe('performSessionCleanup', () => {
    it('should clean up auth-related storage items', async () => {
      // Setup mock localStorage with auth items
      const mockKeys = ['sb-auth-token', 'supabase-session', 'other-key'];
      vi.mocked(global.localStorage.length as any).mockReturnValue(3);
      vi.mocked(global.localStorage.key).mockImplementation((index: number) =>
        mockKeys[index] || null
      );

      const result = await performSessionCleanup();

      expect(result.cleaned).toBe(true);
      expect(result.itemsRemoved).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should preserve PKCE storage during OAuth callback', async () => {
      // Mock being on OAuth callback page
      Object.defineProperty(window, 'location', {
        value: { pathname: '/auth/callback' },
        writable: true,
      });

      const mockKeys = ['sb-dlrnrgcoguxlkkcitlpd-auth-token'];
      vi.mocked(global.localStorage.length as any).mockReturnValue(1);
      vi.mocked(global.localStorage.key).mockImplementation(() => mockKeys[0]);

      const result = await performSessionCleanup();

      // Should NOT remove PKCE storage during callback
      expect(vi.mocked(global.localStorage.removeItem)).not.toHaveBeenCalledWith(
        'sb-dlrnrgcoguxlkkcitlpd-auth-token'
      );
    });
  });
});

describe('Session Manager - Expiry & Refresh', () => {
  describe('isSessionExpiredOrExpiring', () => {
    it('should return true for null session', () => {
      const result = isSessionExpiredOrExpiring(null);
      expect(result).toBe(true);
    });

    it('should return true for expired session', () => {
      const expiredSession: Session = {
        access_token: 'token',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired
        user: {} as any,
      } as Session;

      const result = isSessionExpiredOrExpiring(expiredSession);
      expect(result).toBe(true);
    });

    it('should return true for session expiring within buffer', () => {
      const expiringSession: Session = {
        access_token: 'token',
        expires_at: Math.floor(Date.now() / 1000) + 120, // 2 minutes (within 5min buffer)
        user: {} as any,
      } as Session;

      const result = isSessionExpiredOrExpiring(expiringSession, 5); // 5 minute buffer
      expect(result).toBe(true);
    });

    it('should return false for session with time remaining', () => {
      const validSession: Session = {
        access_token: 'token',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        user: {} as any,
      } as Session;

      const result = isSessionExpiredOrExpiring(validSession, 5);
      expect(result).toBe(false);
    });
  });

  describe('refreshSessionIfNeeded', () => {
    it('should return early for null session', async () => {
      const result = await refreshSessionIfNeeded(null);

      expect(result.refreshed).toBe(false);
      expect(result.error).toBe('No session to refresh');
    });

    it('should skip refresh for non-expiring session', async () => {
      const validSession: Session = {
        access_token: 'token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {} as any,
      } as Session;

      const result = await refreshSessionIfNeeded(validSession);

      expect(result.refreshed).toBe(false);
      expect(result.session).toBe(validSession);
    });
  });
});

describe('Session Manager - Health Checks', () => {
  describe('performSessionHealthCheck', () => {
    it('should report unhealthy when no session exists', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await performSessionHealthCheck();

      expect(result.healthy).toBe(false);
      expect(result.issues).toContain('No active session found');
    });

    it('should report healthy for valid session', async () => {
      const validSession: Session = {
        access_token: 'valid.jwt.token'.repeat(10),
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: { account_type: 'buyer' },
        },
      };

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: validSession },
        error: null,
      });

      const result = await performSessionHealthCheck();

      expect(result.healthy).toBe(true);
      expect(result.session).toBeDefined();
    });

    it('should detect invalid user ID', async () => {
      const invalidSession: Session = {
        access_token: 'valid.jwt.token'.repeat(10),
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: 'short', // Too short
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      } as Session;

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: invalidSession },
        error: null,
      });

      const result = await performSessionHealthCheck();

      expect(result.healthy).toBe(false);
      expect(result.issues).toContain('User ID missing or invalid');
    });

    it('should detect invalid email', async () => {
      const invalidSession: Session = {
        access_token: 'valid.jwt.token'.repeat(10),
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'invalid-email', // No @ sign
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      } as Session;

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: invalidSession },
        error: null,
      });

      const result = await performSessionHealthCheck();

      expect(result.healthy).toBe(false);
      expect(result.issues).toContain('User email missing or invalid');
    });

    it('should include performance metrics', async () => {
      const validSession: Session = {
        access_token: 'valid.jwt.token'.repeat(10),
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      } as Session;

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: validSession },
        error: null,
      });

      const result = await performSessionHealthCheck();

      expect(result.diagnostics).toBeDefined();
      expect(result.diagnostics.performanceMetrics).toBeDefined();
      expect(result.diagnostics.performanceMetrics.responseTime).toBeGreaterThan(0);
      expect(result.diagnostics.performanceMetrics.networkConnectivity).toMatch(
        /ok|slow|failed/
      );
    });
  });
});

describe('Session Manager - Concurrent Operations', () => {
  describe('getCurrentSession', () => {
    it('should use lock to prevent concurrent calls', async () => {
      const validSession: Session = {
        access_token: 'token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {} as any,
      } as Session;

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: validSession },
        error: null,
      });

      // Make concurrent calls
      const [result1, result2, result3] = await Promise.all([
        getCurrentSession(),
        getCurrentSession(),
        getCurrentSession(),
      ]);

      // All should succeed with same session
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(result3).toBeTruthy();

      // Supabase getSession should be called only once due to lock
      expect(vi.mocked(supabase.auth.getSession)).toHaveBeenCalledTimes(1);
    });
  });
});
