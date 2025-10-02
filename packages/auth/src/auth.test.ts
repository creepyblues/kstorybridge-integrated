import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock functions that will be accessible to the mock
const mockAuthMethods = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  updateUser: vi.fn(),
  onAuthStateChange: vi.fn()
};

// Mock the Supabase client creation with factory function
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: mockAuthMethods
  }))
}));

// Now import after mocking - using dynamic import to ensure mocks are set up
const { auth } = await import('./supabaseAdapter.js');
import type { AuthUser, AuthSession, SignUpParams, SignInParams } from './types.js';

describe('Auth Package', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should load configuration from environment', () => {
      // Config is loaded when module is imported
      expect(auth).toBeDefined();
      expect(typeof auth.signUp).toBe('function');
      expect(typeof auth.signIn).toBe('function');
      expect(typeof auth.signOut).toBe('function');
    });
  });

  describe('User Mapping', () => {
    it('should map Supabase user to AuthUser correctly', async () => {
      const supabaseUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'authenticated',
        user_metadata: {
          account_type: 'buyer',
          full_name: 'Test User'
        }
      };

      mockAuthMethods.getUser.mockResolvedValue({
        data: { user: supabaseUser },
        error: null
      });

      const user = await auth.getCurrentUser();

      expect(user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        roles: ['authenticated'],
        metadata: {
          account_type: 'buyer',
          full_name: 'Test User'
        },
        accountType: 'buyer'
      });
    });

    it('should handle user with no metadata', async () => {
      const supabaseUser = {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: null
      };

      mockAuthMethods.getUser.mockResolvedValue({
        data: { user: supabaseUser },
        error: null
      });

      const user = await auth.getCurrentUser();

      expect(user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        roles: [],
        metadata: {},
        accountType: undefined
      });
    });
  });

  describe('Session Mapping', () => {
    it('should map Supabase session to AuthSession correctly', async () => {
      const supabaseSession = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          user_metadata: { account_type: 'buyer' }
        },
        access_token: 'token123',
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      mockAuthMethods.getSession.mockResolvedValue({
        data: { session: supabaseSession },
        error: null
      });

      const session = await auth.getSession();

      expect(session).toEqual({
        user: expect.objectContaining({
          id: 'user123',
          email: 'test@example.com',
          accountType: 'buyer'
        }),
        accessToken: 'token123',
        expiresAt: expect.any(Number)
      });
      expect(session?.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('signUp', () => {
    it('should sign up with email and password', async () => {
      const signUpParams: SignUpParams = {
        email: 'test@example.com',
        password: 'password123',
        metadata: { account_type: 'buyer' }
      };

      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { account_type: 'buyer' }
      };

      mockAuthMethods.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const user = await auth.signUp(signUpParams);

      expect(mockAuthMethods.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { account_type: 'buyer' }
        }
      });

      expect(user).toEqual(expect.objectContaining({
        id: 'user123',
        email: 'test@example.com',
        accountType: 'buyer'
      }));
    });

    it('should handle OAuth signup', async () => {
      const signUpParams: SignUpParams = {
        email: 'test@example.com',
        provider: 'google',
        metadata: { account_type: 'buyer' }
      };

      mockAuthMethods.signInWithOAuth.mockResolvedValue({
        data: {},
        error: null
      });

      const user = await auth.signUp(signUpParams);

      expect(mockAuthMethods.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback?flow=signup'),
          data: { account_type: 'buyer' }
        }
      });

      expect(user).toEqual({
        id: 'oauth_pending',
        email: 'test@example.com',
        metadata: { account_type: 'buyer' }
      });
    });

    it('should handle signup errors', async () => {
      const signUpParams: SignUpParams = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockAuthMethods.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' }
      });

      await expect(auth.signUp(signUpParams)).rejects.toThrow('Signup failed: Email already registered');
    });

    it('should handle missing user in response', async () => {
      const signUpParams: SignUpParams = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockAuthMethods.signUp.mockResolvedValue({
        data: { user: null },
        error: null
      });

      await expect(auth.signUp(signUpParams)).rejects.toThrow('No user returned from signup');
    });
  });

  describe('signIn', () => {
    it('should sign in with email and password', async () => {
      const signInParams: SignInParams = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { account_type: 'buyer' }
      };

      mockAuthMethods.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const user = await auth.signIn(signInParams);

      expect(mockAuthMethods.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(user).toEqual(expect.objectContaining({
        id: 'user123',
        email: 'test@example.com',
        accountType: 'buyer'
      }));
    });

    it('should handle OAuth signin', async () => {
      const signInParams: SignInParams = {
        email: 'test@example.com',
        provider: 'github'
      };

      mockAuthMethods.signInWithOAuth.mockResolvedValue({
        data: {},
        error: null
      });

      const user = await auth.signIn(signInParams);

      expect(mockAuthMethods.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: expect.stringContaining('/auth/callback?flow=signin')
        }
      });

      expect(user).toEqual({
        id: 'oauth_pending',
        email: 'test@example.com'
      });
    });

    it('should handle signin errors', async () => {
      const signInParams: SignInParams = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockAuthMethods.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      });

      await expect(auth.signIn(signInParams)).rejects.toThrow('Signin failed: Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockAuthMethods.signOut.mockResolvedValue({
        error: null
      });

      await expect(auth.signOut()).resolves.toBeUndefined();
      expect(mockAuthMethods.signOut).toHaveBeenCalled();
    });

    it('should handle signout errors', async () => {
      mockAuthMethods.signOut.mockResolvedValue({
        error: { message: 'Signout failed' }
      });

      await expect(auth.signOut()).rejects.toThrow('Signout failed: Signout failed');
    });
  });

  describe('getSession', () => {
    it('should return session when available', async () => {
      const mockSession = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          user_metadata: { account_type: 'buyer' }
        },
        access_token: 'token123',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockAuthMethods.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const session = await auth.getSession();

      expect(session).toBeDefined();
      expect(session?.user.id).toBe('user123');
      expect(session?.accessToken).toBe('token123');
    });

    it('should return null when no session', async () => {
      mockAuthMethods.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const session = await auth.getSession();

      expect(session).toBeNull();
    });

    it('should handle session errors gracefully', async () => {
      mockAuthMethods.getSession.mockResolvedValue({
        data: null,
        error: { message: 'Session error' }
      });

      const session = await auth.getSession();

      expect(session).toBeNull();
    });
  });

  describe('requireUser', () => {
    it('should return user when session exists', async () => {
      const mockSession = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          user_metadata: { account_type: 'buyer' }
        },
        access_token: 'token123',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockAuthMethods.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const user = await auth.requireUser();

      expect(user).toEqual(expect.objectContaining({
        id: 'user123',
        email: 'test@example.com',
        accountType: 'buyer'
      }));
    });

    it('should throw when no session', async () => {
      mockAuthMethods.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(auth.requireUser()).rejects.toThrow('Authentication required');
    });
  });

  describe('exchangeCodeForSession', () => {
    it('should exchange OAuth code for session', async () => {
      const mockSession = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          user_metadata: { account_type: 'buyer' }
        },
        access_token: 'token123',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockAuthMethods.exchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const session = await auth.exchangeCodeForSession('oauth_code_123');

      expect(mockAuthMethods.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code_123');
      expect(session).toEqual(expect.objectContaining({
        user: expect.objectContaining({ id: 'user123' }),
        accessToken: 'token123'
      }));
    });

    it('should handle exchange errors', async () => {
      mockAuthMethods.exchangeCodeForSession.mockResolvedValue({
        data: null,
        error: { message: 'Invalid OAuth code' }
      });

      await expect(auth.exchangeCodeForSession('invalid_code'))
        .rejects.toThrow('OAuth code exchange failed: Invalid OAuth code');
    });

    it('should handle missing session in response', async () => {
      mockAuthMethods.exchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(auth.exchangeCodeForSession('oauth_code_123'))
        .rejects.toThrow('No session returned from code exchange');
    });
  });

  describe('updateUser', () => {
    it('should update user metadata', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { account_type: 'creator', full_name: 'Updated Name' }
      };

      mockAuthMethods.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const user = await auth.updateUser({
        metadata: { account_type: 'creator', full_name: 'Updated Name' }
      });

      expect(mockAuthMethods.updateUser).toHaveBeenCalledWith({
        data: { account_type: 'creator', full_name: 'Updated Name' }
      });

      expect(user).toEqual(expect.objectContaining({
        id: 'user123',
        accountType: 'creator',
        metadata: expect.objectContaining({ full_name: 'Updated Name' })
      }));
    });

    it('should handle update errors', async () => {
      mockAuthMethods.updateUser.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      await expect(auth.updateUser({ metadata: { test: 'value' } }))
        .rejects.toThrow('User update failed: Update failed');
    });
  });

  describe('onAuthStateChange', () => {
    it('should listen to auth state changes', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      mockAuthMethods.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      });

      const result = auth.onAuthStateChange(mockCallback);

      expect(mockAuthMethods.onAuthStateChange).toHaveBeenCalled();
      expect(result).toEqual({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty metadata gracefully', async () => {
      const signUpParams: SignUpParams = {
        email: 'test@example.com',
        password: 'password123',
        metadata: undefined
      };

      mockAuthMethods.signUp.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null
      });

      const user = await auth.signUp(signUpParams);

      expect(mockAuthMethods.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: { data: {} }
      });
    });

    it('should handle network errors gracefully', async () => {
      mockAuthMethods.getSession.mockRejectedValue(new Error('Network error'));

      const session = await auth.getSession();

      expect(session).toBeNull();
    });

    it('should handle malformed session data', async () => {
      mockAuthMethods.getSession.mockResolvedValue({
        data: {
          session: {
            user: null, // Malformed: user is null but session exists
            access_token: 'token123'
          }
        },
        error: null
      });

      const session = await auth.getSession();

      expect(session).toBeNull();
    });

    it('should handle missing email in user data', async () => {
      const supabaseUser = {
        id: 'user123',
        // email is missing
        user_metadata: { account_type: 'buyer' }
      };

      mockAuthMethods.getUser.mockResolvedValue({
        data: { user: supabaseUser },
        error: null
      });

      const user = await auth.getCurrentUser();

      expect(user).toEqual({
        id: 'user123',
        email: undefined, // Should handle missing email gracefully
        roles: [],
        metadata: { account_type: 'buyer' },
        accountType: 'buyer'
      });
    });

    it('should handle concurrent session requests safely', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' },
        access_token: 'token123',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      mockAuthMethods.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() => auth.getSession());
      const results = await Promise.all(promises);

      // All should succeed and return consistent data
      results.forEach(session => {
        expect(session?.user.id).toBe('user123');
        expect(session?.accessToken).toBe('token123');
      });
    });

    it('should handle invalid OAuth provider gracefully', async () => {
      const signUpParams: SignUpParams = {
        email: 'test@example.com',
        provider: 'invalid' as any // Invalid provider
      };

      mockAuthMethods.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'Invalid provider' }
      });

      await expect(auth.signUp(signUpParams)).rejects.toThrow('Signup failed: Invalid provider');
    });

    it('should handle session expiry edge cases', async () => {
      const expiredSession = {
        user: { id: 'user123', email: 'test@example.com' },
        access_token: 'token123',
        expires_at: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      };

      mockAuthMethods.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null
      });

      const session = await auth.getSession();

      // Should still return the session (expiry handling is done by client)
      expect(session?.expiresAt).toBeLessThan(Date.now());
    });

    it('should handle missing expires_at in session', async () => {
      const sessionWithoutExpiry = {
        user: { id: 'user123', email: 'test@example.com' },
        access_token: 'token123'
        // expires_at is missing
      };

      mockAuthMethods.getSession.mockResolvedValue({
        data: { session: sessionWithoutExpiry },
        error: null
      });

      const session = await auth.getSession();

      // Should use default expiry from config
      expect(session?.expiresAt).toBeGreaterThan(Date.now());
      expect(session?.expiresAt).toBeLessThan(Date.now() + 3600000 + 1000); // Within 1 hour + 1s
    });

    it('should handle malformed user metadata', async () => {
      const userWithMalformedMetadata = {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: 'invalid-metadata' // Should be object, not string
      };

      mockAuthMethods.getUser.mockResolvedValue({
        data: { user: userWithMalformedMetadata },
        error: null
      });

      const user = await auth.getCurrentUser();

      // The adapter should pass through whatever is returned by Supabase
      // Validation/sanitization happens at the backend level
      expect(user?.metadata).toBe('invalid-metadata');
    });

    it('should handle rate limiting errors', async () => {
      mockAuthMethods.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded', status: 429 }
      });

      await expect(auth.signIn({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow('Signin failed: Rate limit exceeded');
    });

    it('should handle timeout errors during OAuth exchange', async () => {
      mockAuthMethods.exchangeCodeForSession.mockRejectedValue(new Error('Request timeout'));

      await expect(auth.exchangeCodeForSession('code123')).rejects.toThrow('OAuth code exchange failed: Request timeout');
    });
  });

  describe('Security Tests', () => {
    it('should handle XSS attempts in email inputs', async () => {
      const maliciousEmail = '<script>alert("xss")</script>@example.com';

      mockAuthMethods.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email format' }
      });

      await expect(auth.signUp({
        email: maliciousEmail,
        password: 'password123'
      })).rejects.toThrow('Signup failed: Invalid email format');
    });

    it('should handle SQL injection attempts in metadata', async () => {
      const maliciousMetadata = {
        name: "'; DROP TABLE users; --",
        company: "test company"
      };

      mockAuthMethods.signUp.mockResolvedValue({
        data: { user: {
          id: 'user123',
          email: 'test@example.com',
          user_metadata: maliciousMetadata
        }},
        error: null
      });

      const user = await auth.signUp({
        email: 'test@example.com',
        password: 'password123',
        metadata: maliciousMetadata
      });

      // Should pass through metadata as-is (sanitization handled by backend)
      expect(user.metadata).toEqual(maliciousMetadata);
    });

    it('should handle extremely long input strings', async () => {
      const longString = 'a'.repeat(10000);

      mockAuthMethods.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Input too long' }
      });

      await expect(auth.signIn({
        email: 'test@example.com',
        password: longString
      })).rejects.toThrow('Signin failed: Input too long');
    });

    it('should handle empty/null OAuth codes', async () => {
      await expect(auth.exchangeCodeForSession('')).rejects.toThrow('OAuth code exchange failed');

      // Test with null-like values
      mockAuthMethods.exchangeCodeForSession.mockRejectedValue(new Error('Invalid code'));
      await expect(auth.exchangeCodeForSession('null')).rejects.toThrow('OAuth code exchange failed: Invalid code');
    });

    it('should not expose sensitive error details', async () => {
      mockAuthMethods.getSession.mockRejectedValue(new Error('Internal server error: database password is abc123'));

      const session = await auth.getSession();

      // Should not expose sensitive internal errors to client
      expect(session).toBeNull();
    });

    it('should handle Unicode and international characters safely', async () => {
      const unicodeEmail = 'test+日本語@example.com';
      const unicodeMetadata = {
        name: '김한국',
        company: 'テスト会社'
      };

      mockAuthMethods.signUp.mockResolvedValue({
        data: { user: {
          id: 'user123',
          email: unicodeEmail,
          user_metadata: unicodeMetadata
        }},
        error: null
      });

      const user = await auth.signUp({
        email: unicodeEmail,
        password: 'password123',
        metadata: unicodeMetadata
      });

      expect(user.email).toBe(unicodeEmail);
      expect(user.metadata).toEqual(unicodeMetadata);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate AUTH_CONFIG is frozen', async () => {
      const { AUTH_CONFIG } = await import('./config.js');

      expect(Object.isFrozen(AUTH_CONFIG)).toBe(true);

      // Should not allow modification
      expect(() => {
        (AUTH_CONFIG as any).newProperty = 'test';
      }).toThrow();
    });

    it('should have reasonable timeout values', async () => {
      const { AUTH_CONFIG } = await import('./config.js');

      expect(AUTH_CONFIG.timeouts.sessionCheck).toBeGreaterThan(1000);
      expect(AUTH_CONFIG.timeouts.sessionCheck).toBeLessThan(30000);
      expect(AUTH_CONFIG.timeouts.oauthExchange).toBeGreaterThan(1000);
      expect(AUTH_CONFIG.timeouts.oauthExchange).toBeLessThan(30000);
    });

    it('should have conservative retry counts', async () => {
      const { AUTH_CONFIG } = await import('./config.js');

      expect(AUTH_CONFIG.retries.profileCreation).toBeLessThanOrEqual(3);
      expect(AUTH_CONFIG.retries.sessionRefresh).toBeLessThanOrEqual(3);
      expect(AUTH_CONFIG.retries.metadataUpdate).toBeLessThanOrEqual(3);
    });
  });
});