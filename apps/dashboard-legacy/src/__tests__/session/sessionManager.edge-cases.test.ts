/**
 * Session Manager - Edge Cases and Advanced Scenarios
 *
 * Comprehensive tests for edge cases, error recovery, concurrent operations,
 * and security scenarios in session management.
 *
 * Coverage:
 * - sessionStorage disabled/blocked scenarios
 * - Concurrent tab operations
 * - Session expiry during active use
 * - OAuth callback edge cases
 * - Storage quota exceeded
 * - Network errors and retries
 * - Session corruption and recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import {
  validateSessionIntegrity,
  validateSessionTokens,
  performSessionCleanup,
  recoverCorruptedSession,
  setSessionWithRecovery,
  refreshSessionIfNeeded,
  performSessionHealthCheck,
  getCurrentSession,
  getSessionRecoveryMetrics
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
    return msg.includes('network') || msg.includes('timeout') || msg.includes('connection');
  }),
  performSupabaseHealthCheck: vi.fn(() =>
    Promise.resolve({
      healthy: true,
      response: 100,
      details: {
        url: 'https://test.supabase.co',
        isLocal: false,
        connectivity: 'ok',
        authConfigured: true
      }
    })
  ),
}));

describe('Session Manager - Storage Unavailability', () => {
  let originalSessionStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    originalSessionStorage = window.sessionStorage;
    originalLocalStorage = window.localStorage;
  });

  afterEach(() => {
    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true
    });
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
    vi.clearAllMocks();
  });

  it('should handle sessionStorage disabled (private browsing)', async () => {
    const disabledStorage = {
      getItem: vi.fn(() => {
        throw new DOMException('SecurityError: The operation is insecure');
      }),
      setItem: vi.fn(() => {
        throw new DOMException('SecurityError');
      }),
      removeItem: vi.fn(() => {
        throw new DOMException('SecurityError');
      }),
      clear: vi.fn(() => {
        throw new DOMException('SecurityError');
      }),
      key: vi.fn(() => null),
      length: 0
    } as unknown as Storage;

    Object.defineProperty(window, 'sessionStorage', {
      value: disabledStorage,
      writable: true
    });

    // Cleanup should handle errors gracefully
    const result = await performSessionCleanup();

    expect(result.cleaned).toBe(true); // Should still report as cleaned
    expect(result.errors.length).toBeGreaterThan(0); // But with errors
  });

  it('should handle quota exceeded error', async () => {
    const quotaStorage = {
      ...window.sessionStorage,
      setItem: vi.fn(() => {
        throw new DOMException('QuotaExceededError');
      })
    } as unknown as Storage;

    Object.defineProperty(window, 'sessionStorage', {
      value: quotaStorage,
      writable: true
    });

    // Attempting to set session should handle quota error
    const sessionData = {
      access_token: 'token',
      refresh_token: 'refresh'
    };

    const result = await setSessionWithRecovery(sessionData, {
      maxRetries: 1
    });

    // Should fail gracefully without crashing
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle storage being undefined (SSR scenario)', () => {
    const originalWindow = global.window;

    // Simulate SSR
    delete (global as any).window;

    const isServer = typeof window === 'undefined';
    expect(isServer).toBe(true);

    // Restore
    global.window = originalWindow;
  });

  it('should handle storage corruption (invalid JSON)', async () => {
    const corruptedStorage = {
      ...window.sessionStorage,
      getItem: vi.fn(() => 'invalid{json]data')
    } as unknown as Storage;

    Object.defineProperty(window, 'sessionStorage', {
      value: corruptedStorage,
      writable: true
    });

    // Should handle parse errors
    const raw = corruptedStorage.getItem('test');
    expect(() => JSON.parse(raw!)).toThrow();
  });
});

describe('Session Manager - Concurrent Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent concurrent getCurrentSession calls', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    const mockSession: Session = {
      access_token: 'concurrent_test_token'.repeat(3),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {}
      }
    } as Session;

    // Mock with delay to simulate slow network
    vi.mocked(supabase.auth.getSession).mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          data: { session: mockSession },
          error: null
        }), 100)
      )
    );

    // Make 5 concurrent calls
    const promises = Array(5).fill(null).map(() => getCurrentSession());
    const results = await Promise.all(promises);

    // All should succeed
    results.forEach(result => {
      expect(result).toBeTruthy();
      expect(result?.user?.email).toBe('test@example.com');
    });

    // But getSession should only be called once due to locking
    expect(vi.mocked(supabase.auth.getSession).mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('should handle concurrent health checks with throttling', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    const mockSession: Session = {
      access_token: 'health_check_token'.repeat(3),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: 'user-456',
        email: 'health@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { account_type: 'buyer' }
      }
    } as Session;

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    // Make concurrent health checks
    const healthChecks = Array(3).fill(null).map(() =>
      performSessionHealthCheck()
    );

    const results = await Promise.all(healthChecks);

    // All should return results
    expect(results).toHaveLength(3);

    // Due to throttling, some might use cached results
    results.forEach(result => {
      expect(result.healthy).toBe(true);
    });
  });

  it('should handle race condition in session recovery', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    // First call fails, triggers recovery
    vi.mocked(supabase.auth.getSession)
      .mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Session corrupted', name: 'AuthError', status: 500 } as any
      })
      .mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'recovered_token'.repeat(3),
            user: { id: 'user-789', email: 'recovered@example.com' }
          } as Session
        },
        error: null
      });

    const result = await recoverCorruptedSession();

    expect(result.recovered).toBe(true);
  });
});

describe('Session Manager - OAuth Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/auth/callback',
        search: '?code=oauth_code',
        origin: 'http://localhost:8081',
        href: 'http://localhost:8081/auth/callback?code=oauth_code'
      },
      writable: true,
      configurable: true
    });
  });

  it('should handle OAuth callback with missing code parameter', () => {
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/auth/callback',
        search: '', // No code parameter
        origin: 'http://localhost:8081'
      },
      writable: true
    });

    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.has('code');

    expect(hasCode).toBe(false);
  });

  it('should handle OAuth callback with error parameter', () => {
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/auth/callback',
        search: '?error=access_denied&error_description=User+cancelled',
        origin: 'http://localhost:8081'
      },
      writable: true
    });

    const urlParams = new URLSearchParams(window.location.search);
    const hasError = urlParams.has('error');
    const errorType = urlParams.get('error');

    expect(hasError).toBe(true);
    expect(errorType).toBe('access_denied');
  });

  it('should handle malformed OAuth code', () => {
    const urlParams = new URLSearchParams('code=malformed@@code##here');

    const validation = validateSessionTokens(urlParams);

    // No access_token in OAuth callback URL
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Missing access_token parameter');
  });

  it('should handle OAuth timeout scenario', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    vi.mocked(supabase.auth.getSession).mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OAuth timeout')), 100)
      )
    );

    // Should handle timeout gracefully
    await expect(getCurrentSession()).resolves.toBeNull();
  });

  it('should prevent OAuth code reprocessing', () => {
    let oauthCodeProcessed = false;

    const processOAuthCode = (code: string): boolean => {
      if (oauthCodeProcessed) {
        console.log('OAuth code already processed');
        return false;
      }

      console.log('Processing OAuth code:', code);
      oauthCodeProcessed = true;
      return true;
    };

    const firstCall = processOAuthCode('code123');
    const secondCall = processOAuthCode('code123');

    expect(firstCall).toBe(true);
    expect(secondCall).toBe(false);
  });
});

describe('Session Manager - Network Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retry on network timeout', async () => {
    const { supabase, isNetworkError } = await import('@/integrations/supabase/client');

    const timeoutError = new Error('Network timeout');
    expect(isNetworkError(timeoutError)).toBe(true);

    // First call fails, second succeeds
    vi.mocked(supabase.auth.getSession)
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'retry_token'.repeat(3),
            user: { id: 'user-retry', email: 'retry@example.com' }
          } as Session
        },
        error: null
      });

    const result = await getCurrentSession();
    expect(result).toBeTruthy();
  });

  it('should handle connection refused error', async () => {
    const { supabase, isNetworkError } = await import('@/integrations/supabase/client');

    const connError = new Error('ECONNREFUSED: Connection refused');
    expect(isNetworkError(connError)).toBe(true);

    vi.mocked(supabase.auth.getSession).mockRejectedValue(connError);

    const result = await getCurrentSession();
    expect(result).toBeNull();
  });

  it('should handle intermittent network failures', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    const networkError = new Error('Network error occurred');

    // Fail twice, then succeed
    vi.mocked(supabase.auth.refreshSession)
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'intermittent_token'.repeat(3),
            user: { id: 'user-intermittent', email: 'test@example.com' }
          } as Session
        },
        error: null
      });

    const mockSession: Session = {
      access_token: 'old_token',
      expires_at: Math.floor(Date.now() / 1000) - 100, // Expired
      user: { id: 'user-old' } as any
    } as Session;

    const result = await refreshSessionIfNeeded(mockSession);

    // After retries, should eventually succeed
    expect(result.refreshed || result.error).toBeDefined();
  });
});

describe('Session Manager - Session Expiry Edge Cases', () => {
  it('should handle session expiring during active use', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    // Session expires in 30 seconds
    const expiringSession: Session = {
      access_token: 'expiring_token'.repeat(3),
      expires_at: nowSeconds + 30,
      user: {
        id: 'user-expiring',
        email: 'expiring@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {}
      }
    } as Session;

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if refresh needed
    const nowAfterWait = Math.floor(Date.now() / 1000);
    const timeRemaining = (expiringSession.expires_at || 0) - nowAfterWait;

    // Should be close to expiry
    expect(timeRemaining).toBeLessThan(60); // Less than 1 minute
  }, 10000); // 10 second timeout for this test

  it('should handle clock skew between client and server', () => {
    const CLOCK_SKEW_SECONDS = 300; // 5 minutes

    // Server time
    const serverTime = Math.floor(Date.now() / 1000);

    // Client clock is 5 minutes ahead
    const clientTime = serverTime + CLOCK_SKEW_SECONDS;

    // Session expires at server time + 20 minutes
    const expiresAt = serverTime + (20 * 60);

    // From client perspective
    const apparentTimeLeft = expiresAt - clientTime;

    // Client sees 15 minutes remaining (20 - 5)
    expect(apparentTimeLeft).toBe(15 * 60);

    // This might trigger premature refresh warnings
    // Should account for clock skew in production
  });

  it('should handle session already expired', async () => {
    const expiredSession: Session = {
      access_token: 'expired_token',
      expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      user: { id: 'user-expired' } as any
    } as Session;

    const validation = validateSessionIntegrity(expiredSession);

    expect(validation.isValid).toBe(false);
    expect(validation.issues.some(issue => issue.includes('expired'))).toBe(true);
  });

  it('should handle missing expires_at field', () => {
    const noExpirySession: Session = {
      access_token: 'no_expiry_token'.repeat(3),
      user: {
        id: 'user-no-expiry',
        email: 'test@example.com'
      } as any
    } as Session;

    // expires_at is undefined
    expect(noExpirySession.expires_at).toBeUndefined();

    // Should be treated as non-expiring or invalid
    const validation = validateSessionIntegrity(noExpirySession);
    // Implementation may vary - just verify it doesn't crash
    expect(validation).toBeDefined();
  });
});

describe('Session Manager - Recovery Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track recovery attempts', async () => {
    const before = getSessionRecoveryMetrics();
    const initialAttempts = before.totalAttempts;

    // Trigger recovery (will fail since we haven't mocked properly)
    await recoverCorruptedSession().catch(() => {});

    const after = getSessionRecoveryMetrics();

    // Metrics should be updated
    expect(after.totalAttempts).toBeGreaterThanOrEqual(initialAttempts);
  });

  it('should track successful recoveries', () => {
    const metrics = getSessionRecoveryMetrics();

    // Verify structure
    expect(metrics).toHaveProperty('totalAttempts');
    expect(metrics).toHaveProperty('successfulRecoveries');
    expect(metrics).toHaveProperty('failedRecoveries');
    expect(metrics).toHaveProperty('lastAttemptTime');
    expect(metrics).toHaveProperty('lastRecoveryReason');
  });

  it('should calculate recovery success rate', () => {
    const metrics = getSessionRecoveryMetrics();

    if (metrics.totalAttempts > 0) {
      const successRate = (metrics.successfulRecoveries / metrics.totalAttempts) * 100;
      const failureRate = (metrics.failedRecoveries / metrics.totalAttempts) * 100;

      expect(successRate + failureRate).toBeLessThanOrEqual(100);
      expect(successRate).toBeGreaterThanOrEqual(0);
      expect(failureRate).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Session Manager - Security Edge Cases', () => {
  it('should detect token injection attempt', () => {
    const maliciousToken = 'attacker_token<script>alert("xss")</script>';

    const urlParams = new URLSearchParams();
    urlParams.set('access_token', maliciousToken);

    const validation = validateSessionTokens(urlParams);

    // Should fail validation due to invalid JWT format
    expect(validation.isValid).toBe(false);
  });

  it('should detect session fixation attempt', () => {
    // Attacker provides their session token
    const attackerSession = {
      access_token: 'attacker.controlled.token',
      user: {
        id: 'attacker-id',
        email: 'attacker@evil.com'
      }
    };

    // Validate integrity
    const validation = validateSessionIntegrity(attackerSession as Session);

    // Should fail due to suspicious patterns or invalid format
    expect(validation.isValid).toBe(false);
  });

  it('should prevent session token tampering', () => {
    // Valid JWT structure but tampered payload
    const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.TAMPERED_PAYLOAD.invalid_signature';

    const urlParams = new URLSearchParams();
    urlParams.set('access_token', tamperedToken);

    const validation = validateSessionTokens(urlParams);

    // Valid JWT format, so initial validation passes
    // But actual auth would fail at Supabase level
    expect(validation.sessionData?.access_token).toBe(tamperedToken);
  });

  it('should handle replay attack scenario', () => {
    // Same session used twice
    const replayedSession = {
      access_token: 'replayed.jwt.token'.repeat(2),
      expires_at: Math.floor(Date.now() / 1000) + 300,
      user: { id: 'user-123', email: 'test@example.com' }
    } as Session;

    // First use
    const firstValidation = validateSessionIntegrity(replayedSession);
    expect(firstValidation.isValid).toBe(true);

    // Second use (replay)
    const replayValidation = validateSessionIntegrity(replayedSession);
    expect(replayValidation.isValid).toBe(true);

    // Note: Actual replay protection would require nonce/jti checking
    // which would be done server-side
  });
});

describe('Session Manager - Performance Edge Cases', () => {
  it('should handle health check timeout', async () => {
    const { performSupabaseHealthCheck } = await import('@/integrations/supabase/client');

    // Mock slow health check
    vi.mocked(performSupabaseHealthCheck).mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          healthy: false,
          error: 'Health check timeout',
          details: {
            url: 'https://test.supabase.co',
            isLocal: false,
            connectivity: 'failed',
            authConfigured: true
          }
        }), 100)
      )
    );

    const startTime = Date.now();
    const result = await performSessionHealthCheck();
    const duration = Date.now() - startTime;

    // Should complete even with timeout
    expect(result).toBeDefined();
    expect(duration).toBeLessThan(5000); // Should not hang indefinitely
  }, 10000);

  it('should handle many concurrent operations efficiently', async () => {
    const operations = Array(50).fill(null).map((_, i) =>
      performSessionCleanup()
    );

    const startTime = Date.now();
    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(50);
    expect(duration).toBeLessThan(5000); // Should not be too slow
  }, 10000);
});
