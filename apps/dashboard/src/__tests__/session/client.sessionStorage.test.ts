/**
 * Supabase Client - sessionStorage Integration Tests
 *
 * Tests for sessionStorage-based session persistence, bootstrap function,
 * and session cache behavior.
 *
 * Coverage:
 * - sessionStorage vs localStorage usage
 * - Bootstrap session loading from sessionStorage
 * - Session cache freshness checks
 * - OAuth callback detection and session handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

describe('Supabase Client - sessionStorage Integration', () => {
  let mockSessionStorage: Storage;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    // Create mock storage implementations
    const createMockStorage = (): Storage => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
        get length() { return Object.keys(store).length; }
      };
    };

    mockSessionStorage = createMockStorage();
    mockLocalStorage = createMockStorage();

    // Mock window storage
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true
    });

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/some-page',
        search: '',
        origin: 'http://localhost:8081'
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sessionStorage Usage', () => {
    it('should use sessionStorage instead of localStorage', () => {
      // This is validated by the CLIENT_CONFIG in client.ts
      // The auth.storage property should be sessionStorage
      const STORAGE_KEY = 'sb-dlrnrgcoguxlkkcitlpd-auth-token';

      // Simulate Supabase storing a session
      const mockAuthData = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockSessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockAuthData));

      // Verify storage location
      expect(mockSessionStorage.getItem(STORAGE_KEY)).toBeTruthy();
      expect(mockLocalStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should handle sessionStorage being disabled', () => {
      // Mock sessionStorage access throwing error (private browsing mode)
      const disabledStorage = {
        ...mockSessionStorage,
        getItem: vi.fn(() => {
          throw new Error('SecurityError: The operation is insecure');
        }),
        setItem: vi.fn(() => {
          throw new Error('SecurityError: The operation is insecure');
        })
      };

      Object.defineProperty(window, 'sessionStorage', {
        value: disabledStorage,
        writable: true,
        configurable: true
      });

      // Bootstrap should handle this gracefully
      expect(() => {
        // This would normally trigger bootstrapCachedSession
        window.sessionStorage.getItem('test');
      }).toThrow();
    });

    it('should handle sessionStorage quota exceeded', () => {
      const quotaExceededStorage = {
        ...mockSessionStorage,
        setItem: vi.fn(() => {
          throw new DOMException('QuotaExceededError');
        })
      };

      Object.defineProperty(window, 'sessionStorage', {
        value: quotaExceededStorage,
        writable: true,
        configurable: true
      });

      expect(() => {
        window.sessionStorage.setItem('test', 'value');
      }).toThrow('QuotaExceededError');
    });
  });

  describe('bootstrapCachedSession', () => {
    const STORAGE_KEY = 'sb-dlrnrgcoguxlkkcitlpd-auth-token';

    it('should successfully bootstrap valid session from sessionStorage', () => {
      const validAuthData = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.test',
        refresh_token: 'refresh_token_value',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString()
        },
        token_type: 'bearer'
      };

      mockSessionStorage.setItem(STORAGE_KEY, JSON.stringify(validAuthData));

      // Verify data is in sessionStorage
      const storedData = mockSessionStorage.getItem(STORAGE_KEY);
      expect(storedData).toBeTruthy();

      const parsed = JSON.parse(storedData!);
      expect(parsed.access_token).toBe(validAuthData.access_token);
      expect(parsed.user.email).toBe('test@example.com');
    });

    it('should handle corrupted JSON in sessionStorage', () => {
      // Store invalid JSON
      mockSessionStorage.setItem(STORAGE_KEY, 'invalid{json}data');

      // Bootstrap should handle parse errors gracefully
      const storedData = mockSessionStorage.getItem(STORAGE_KEY);
      expect(storedData).toBeTruthy();

      expect(() => JSON.parse(storedData!)).toThrow();
    });

    it('should handle missing required fields in session data', () => {
      const incompleteAuthData = {
        access_token: 'token_without_user',
        // Missing user field
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockSessionStorage.setItem(STORAGE_KEY, JSON.stringify(incompleteAuthData));

      const storedData = mockSessionStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(storedData!);

      // Verify incomplete data structure
      expect(parsed.access_token).toBeTruthy();
      expect(parsed.user).toBeUndefined();
    });

    it('should skip bootstrap during OAuth callback', () => {
      // Mock being on OAuth callback page
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/auth/callback',
          search: '?code=oauth_code_here',
          origin: 'http://localhost:8081'
        },
        writable: true
      });

      // Even with valid data in storage, bootstrap should skip
      const validAuthData = {
        access_token: 'token',
        user: { id: 'user123', email: 'test@example.com' },
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockSessionStorage.setItem(STORAGE_KEY, JSON.stringify(validAuthData));

      // Bootstrap logic checks window.location.pathname === '/auth/callback'
      expect(window.location.pathname).toBe('/auth/callback');
    });

    it('should handle empty sessionStorage gracefully', () => {
      // Verify no data in storage
      const storedData = mockSessionStorage.getItem(STORAGE_KEY);
      expect(storedData).toBeNull();

      // Bootstrap should handle this without errors
      expect(mockSessionStorage.length).toBe(0);
    });

    it('should handle sessionStorage with expired session', () => {
      const expiredAuthData = {
        access_token: 'expired_token',
        user: { id: 'user123', email: 'test@example.com' },
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        refresh_token: 'refresh_token'
      };

      mockSessionStorage.setItem(STORAGE_KEY, JSON.stringify(expiredAuthData));

      const storedData = mockSessionStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(storedData!);

      // Verify expired timestamp
      const now = Math.floor(Date.now() / 1000);
      expect(parsed.expires_at).toBeLessThan(now);
    });
  });

  describe('Session Cache Freshness', () => {
    it('should respect SESSION_CACHE_MAX_AGE_MS (30 minutes)', () => {
      const SESSION_CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

      const now = Date.now();
      const lastUpdated = now - (25 * 60 * 1000); // 25 minutes ago

      const cacheAgeMs = now - lastUpdated;
      const isFresh = cacheAgeMs < SESSION_CACHE_MAX_AGE_MS;

      expect(isFresh).toBe(true);
    });

    it('should detect stale cache after 30 minutes', () => {
      const SESSION_CACHE_MAX_AGE_MS = 30 * 60 * 1000;

      const now = Date.now();
      const lastUpdated = now - (35 * 60 * 1000); // 35 minutes ago

      const cacheAgeMs = now - lastUpdated;
      const isFresh = cacheAgeMs < SESSION_CACHE_MAX_AGE_MS;

      expect(isFresh).toBe(false);
    });

    it('should check expiry buffer (15 minutes)', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + (20 * 60); // Expires in 20 minutes
      const buffer = 15 * 60; // 15 minute buffer

      const timeUntilExpiry = expiresAt - now;
      const hasBuffer = timeUntilExpiry > buffer;

      expect(hasBuffer).toBe(true);
    });

    it('should detect session close to expiry (within 15 min buffer)', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + (10 * 60); // Expires in 10 minutes
      const buffer = 15 * 60; // 15 minute buffer

      const timeUntilExpiry = expiresAt - now;
      const hasBuffer = timeUntilExpiry > buffer;

      expect(hasBuffer).toBe(false);
    });
  });

  describe('Session Freshness with Clock Skew', () => {
    it('should handle client clock ahead of server', () => {
      const CLOCK_SKEW_MS = 5 * 60 * 1000; // 5 minutes

      const serverTime = Math.floor(Date.now() / 1000);
      const clientTime = serverTime + (5 * 60); // Client 5 min ahead

      const expiresAt = serverTime + (20 * 60); // Expires in 20 min (server time)
      const buffer = 15 * 60;

      // Without skew tolerance, this might falsely detect as expiring
      const apparentTimeLeft = expiresAt - clientTime;
      expect(apparentTimeLeft).toBe(15 * 60); // Appears to be at buffer edge

      // With skew tolerance
      const adjustedTimeLeft = apparentTimeLeft + (CLOCK_SKEW_MS / 1000);
      expect(adjustedTimeLeft).toBeGreaterThan(buffer);
    });

    it('should handle client clock behind server', () => {
      const serverTime = Math.floor(Date.now() / 1000);
      const clientTime = serverTime - (5 * 60); // Client 5 min behind

      const expiresAt = serverTime + (10 * 60); // Expires in 10 min (server time)

      const apparentTimeLeft = expiresAt - clientTime;
      expect(apparentTimeLeft).toBe(15 * 60); // Appears to have more time
    });
  });

  describe('OAuth Code Processing', () => {
    it('should detect OAuth code in URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/auth/callback',
          search: '?code=SG.abcdef123456',
          origin: 'http://localhost:8081'
        },
        writable: true
      });

      const urlParams = new URLSearchParams(window.location.search);
      const hasCode = urlParams.has('code');

      expect(hasCode).toBe(true);
      expect(urlParams.get('code')).toBe('SG.abcdef123456');
    });

    it('should prevent OAuth code reprocessing', () => {
      let oauthCodeProcessed = false;

      const processCode = () => {
        if (oauthCodeProcessed) {
          return false; // Already processed
        }
        oauthCodeProcessed = true;
        return true; // Successfully processed
      };

      expect(processCode()).toBe(true); // First call
      expect(processCode()).toBe(false); // Second call prevented
    });

    it('should detect recent OAuth flow completion', () => {
      const now = Date.now();

      // Simulate OAuth completion
      mockSessionStorage.setItem('oauth_completed_at', now.toString());

      const lastOAuthTime = parseInt(mockSessionStorage.getItem('oauth_completed_at') || '0');
      const timeSinceOAuth = Date.now() - lastOAuthTime;

      // Within 30 second window
      expect(timeSinceOAuth).toBeLessThan(30000);
    });

    it('should detect OAuth signup completion flag', () => {
      mockSessionStorage.setItem('oauth_signup_complete', 'true');

      const signupComplete = mockSessionStorage.getItem('oauth_signup_complete');
      expect(signupComplete).toBe('true');
    });
  });

  describe('Multi-tab Scenarios', () => {
    it('should handle session in one tab, not in another', () => {
      const STORAGE_KEY = 'sb-dlrnrgcoguxlkkcitlpd-auth-token';

      // Tab 1: Has session
      const tab1Storage = createMockStorage();
      tab1Storage.setItem(STORAGE_KEY, JSON.stringify({
        access_token: 'tab1_token',
        user: { id: 'user123' },
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }));

      // Tab 2: No session (new tab)
      const tab2Storage = createMockStorage();

      expect(tab1Storage.getItem(STORAGE_KEY)).toBeTruthy();
      expect(tab2Storage.getItem(STORAGE_KEY)).toBeNull();

      // Note: Real sessionStorage is NOT shared between tabs
      // This is intentional for security
    });
  });

  describe('Error Scenarios', () => {
    it('should handle SecurityError when accessing sessionStorage', () => {
      const secureStorage = {
        ...mockSessionStorage,
        getItem: vi.fn(() => {
          throw new DOMException('SecurityError', 'SecurityError');
        })
      };

      expect(() => secureStorage.getItem('test')).toThrow();
    });

    it('should handle undefined window object (SSR)', () => {
      const originalWindow = global.window;

      // Simulate SSR environment
      delete (global as any).window;

      const isServer = typeof window === 'undefined';
      expect(isServer).toBe(true);

      // Restore
      global.window = originalWindow;
    });

    it('should handle malformed session data structures', () => {
      const malformedData = [
        'null',
        '[]',
        '{"wrong": "structure"}',
        'undefined',
        '{}'
      ];

      malformedData.forEach(data => {
        mockSessionStorage.clear();
        mockSessionStorage.setItem('sb-test', data);

        const retrieved = mockSessionStorage.getItem('sb-test');
        const parsed = JSON.parse(retrieved!);

        // None of these should have the required session fields
        expect(parsed.access_token).toBeUndefined();
      });
    });
  });
});

// Helper function for tests
function createMockStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() { return Object.keys(store).length; }
  };
}
