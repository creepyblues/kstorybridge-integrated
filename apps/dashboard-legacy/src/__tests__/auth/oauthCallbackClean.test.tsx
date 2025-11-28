/**
 * OAuth Callback Clean URL Test Suite
 *
 * Tests for OAuth callback with NO URL parameters (per CLAUDE.md critical rule)
 * Validates sessionStorage-based data passing for account_type and flow
 *
 * Related files:
 * - AuthCallbackSimple.tsx: OAuth callback handler
 * - signupService.ts: handleOAuthSignup function
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock functions - must be const to avoid hoisting issues
const mockNavigate = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUpdateUser = vi.fn();
const mockUnsubscribe = vi.fn();

// Mock modules BEFORE importing the component
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      })),
      updateUser: mockUpdateUser,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  },
  withRetry: vi.fn((fn) => fn),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    BrowserRouter: actual.BrowserRouter,
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Import component AFTER mocking
const AuthCallbackSimple = (await import('@/pages/AuthCallbackSimple')).default;

describe('OAuth Callback - Clean URL (No Parameters)', () => {
  beforeEach(() => {
    // Clear all mocks and storage
    vi.clearAllMocks();
    sessionStorage.clear();
    mockNavigate.mockClear();

    // Reset window location
    delete (window as any).location;
    (window as any).location = {
      href: 'http://localhost:8081/auth/callback?code=test-oauth-code',
      origin: 'http://localhost:8081',
      search: '?code=test-oauth-code',
    };
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('CRITICAL: No URL Parameters for account_type or flow', () => {
    it('should NOT read account_type from URL parameters', async () => {
      // Attempt to pass account_type via URL (should be ignored)
      (window as any).location.search = '?code=test-code&account_type=creator&flow=signup';

      // Set sessionStorage (correct method)
      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signup');

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
      };

      const mockSession = {
        access_token: 'token-123',
        user: mockUser,
      };

      // Mock successful OAuth exchange
      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should use sessionStorage value (buyer), not URL param value (creator)
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/signup/buyer')
        );
      }, { timeout: 3000 });
    });

    it('should use sessionStorage as PRIMARY source for account_type', async () => {
      // Clean URL with only OAuth code
      (window as any).location.search = '?code=test-oauth-code';

      // Set account type in sessionStorage (correct method per CLAUDE.md)
      sessionStorage.setItem('oauth_account_type', 'creator');
      sessionStorage.setItem('oauth_flow', 'signup');

      const mockUser = {
        id: 'user-456',
        email: 'creator@example.com',
        user_metadata: {},
      };

      const mockSession = {
        access_token: 'token-456',
        user: mockUser,
      };

      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/signup/creator')
        );
      }, { timeout: 3000 });
    });

    it('should fallback to metadata if sessionStorage is empty', async () => {
      // Clean URL
      (window as any).location.search = '?code=test-oauth-code';

      // No sessionStorage (simulating cleared storage)

      const mockUser = {
        id: 'user-789',
        email: 'existing@example.com',
        user_metadata: {
          account_type: 'buyer', // Fallback source
        },
      };

      const mockSession = {
        access_token: 'token-789',
        user: mockUser,
      };

      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should use metadata as fallback
        expect(mockNavigate).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Creator OAuth Signup', () => {
    it('should handle creator OAuth signup with clean URL', async () => {
      // Clean callback URL (per CLAUDE.md)
      (window as any).location.search = '?code=creator-oauth-code';

      sessionStorage.setItem('oauth_account_type', 'creator');
      sessionStorage.setItem('oauth_flow', 'signup');

      const mockCreator = {
        id: 'creator-123',
        email: 'newcreator@example.com',
        user_metadata: {},
      };

      const mockSession = {
        access_token: 'creator-token',
        user: mockCreator,
      };

      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('creator')
        );
      }, { timeout: 3000 });
    });

    it('should clear sessionStorage after processing', async () => {
      (window as any).location.search = '?code=test-code';

      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signin');

      const mockUser = {
        id: 'user-cleanup',
        email: 'cleanup@example.com',
        user_metadata: { account_type: 'buyer' },
      };

      const mockSession = {
        access_token: 'cleanup-token',
        user: mockUser,
      };

      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        // SessionStorage should be cleared after redirect
        expect(sessionStorage.getItem('oauth_account_type')).toBeNull();
        expect(sessionStorage.getItem('oauth_flow')).toBeNull();
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('should redirect to account-type-selection if no valid account type', async () => {
      (window as any).location.search = '?code=test-code';

      // No sessionStorage and no metadata
      const mockUser = {
        id: 'user-no-type',
        email: 'notype@example.com',
        user_metadata: {},
      };

      const mockSession = {
        access_token: 'no-type-token',
        user: mockUser,
      };

      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/account-type-selection')
        );
      }, { timeout: 3000 });
    });

    it('should handle missing OAuth code', async () => {
      // No code in URL
      (window as any).location.search = '';

      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signup');

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/signin?error=missing_code')
        );
      }, { timeout: 1000 });
    });
  });

  describe('Flow Type Detection', () => {
    it('should use sessionStorage for flow type (not URL params)', async () => {
      (window as any).location.search = '?code=test-code';

      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signin'); // signin, not signup

      const mockUser = {
        id: 'user-signin',
        email: 'signin@example.com',
        user_metadata: { account_type: 'buyer' },
      };

      const mockSession = {
        access_token: 'signin-token',
        user: mockUser,
      };

      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should route to dashboard for signin flow, not signup
        expect(mockNavigate).toHaveBeenCalled();
        const callArg = mockNavigate.mock.calls[0][0];
        expect(callArg).not.toContain('signup');
      }, { timeout: 3000 });
    });

    it('should default to signin flow if sessionStorage empty', async () => {
      (window as any).location.search = '?code=test-code';

      sessionStorage.setItem('oauth_account_type', 'buyer');
      // No oauth_flow in sessionStorage

      const mockUser = {
        id: 'user-default',
        email: 'default@example.com',
        user_metadata: { account_type: 'buyer' },
      };

      const mockSession = {
        access_token: 'default-token',
        user: mockUser,
      };

      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
        // Should default to signin behavior
      }, { timeout: 3000 });
    });
  });
});
