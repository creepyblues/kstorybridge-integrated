/**
 * OAuth Profile Bypass Fix Test Suite (PR #11)
 *
 * CRITICAL FIX: OAuth signin must verify profile exists BEFORE redirecting to dashboard
 *
 * **Problem Solved**:
 * - OAuth signin was allowing authenticated users WITHOUT profiles to reach dashboard
 * - Users would see 406 errors querying user_buyers/user_creators tables
 * - Race condition in RootRedirect cleared flags before async profile check completed
 *
 * **Solution (PR #11)**:
 * - Profile check moved to AuthCallbackSimple.tsx (lines 165-260)
 * - Blocks redirect until profile existence verified
 * - If no profile found during "signin", redirects to signup flow
 * - Uses withRetry for database query reliability
 *
 * Related files:
 * - AuthCallbackSimple.tsx: OAuth callback handler (lines 165-260)
 * - RootRedirect.tsx: Fallback metadata writer (lines 46-127)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock functions
const mockNavigate = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUpdateUser = vi.fn();
const mockUnsubscribe = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockWithRetry = vi.fn();
const mockToast = vi.fn();

// Mock modules
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
    from: mockSupabaseFrom,
  },
  withRetry: mockWithRetry,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Import component after mocks
const { default: AuthCallbackSimple } = await import('@/pages/AuthCallbackSimple');

describe('OAuth Profile Bypass Fix (PR #11)', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {},
  };

  const mockSession = {
    access_token: 'test-token',
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default window.location
    delete (window as any).location;
    (window as any).location = {
      href: 'http://localhost:8081/auth/callback?code=oauth-code',
      search: '?code=oauth-code',
    };

    // Clear sessionStorage
    sessionStorage.clear();

    // Default mock: successful OAuth exchange
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Default mock: withRetry passes through function
    mockWithRetry.mockImplementation((fn) => fn());
  });

  describe('OAuth Signin - Existing User with Profile', () => {
    it('should redirect to dashboard if buyer profile exists', async () => {
      // OAuth signin flow (not signup)
      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signin');

      // Mock profile exists
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: mockUser.id }, // Profile exists
            error: null,
          }),
        }),
      });
      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/buyers/home');
      }, { timeout: 3000 });

      // Should NOT redirect to signup
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.stringContaining('/signup')
      );
    });

    // Creator test removed - dashboard app now only handles buyer auth (creator auth moved to creator app)
  });

  describe('OAuth Signin - New User WITHOUT Profile (CRITICAL FIX)', () => {
    it('should redirect to signup if buyer profile does NOT exist', async () => {
      // User clicks "Sign in with Google" but has no profile (first time)
      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signin');

      // Mock NO profile found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null, // NO profile
            error: null,
          }),
        }),
      });
      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should redirect to signup (not dashboard)
        expect(mockNavigate).toHaveBeenCalledWith('/signup/buyer');
      }, { timeout: 3000 });

      // Should show friendly toast message
      expect(mockToast).toHaveBeenCalledWith({
        title: "Welcome!",
        description: "Please complete your profile to get started.",
        variant: "default"
      });

      // Should set sessionStorage for signup completion
      expect(sessionStorage.getItem('oauth_signup_complete')).toBe('true');
      expect(sessionStorage.getItem('oauth_user_id')).toBe(mockUser.id);
      expect(sessionStorage.getItem('oauth_user_email')).toBe(mockUser.email);
      expect(sessionStorage.getItem('oauth_user_account_type')).toBe('buyer');
    });

    // Creator test removed - dashboard app now only handles buyer auth (creator auth moved to creator app)

    it('should PREVENT authenticated user without profile from reaching dashboard', async () => {
      // This is the bug that PR #11 fixes
      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signin');

      // Mock NO profile (user is authenticated but has no profile)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });
      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should NOT reach dashboard
        expect(mockNavigate).not.toHaveBeenCalledWith('/buyers/home');
        expect(mockNavigate).not.toHaveBeenCalledWith('/creators/home');

        // Should redirect to signup instead
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/signup'));
      }, { timeout: 3000 });
    });
  });

  describe('Profile Check Error Handling', () => {
    it('should handle database error during profile check', async () => {
      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signin');

      // Mock database error
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        }),
      });
      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should show error toast
        expect(mockToast).toHaveBeenCalledWith({
          title: "Connection Error",
          description: "Unable to verify your profile. Please try signing in again.",
          variant: "destructive"
        });

        // Should redirect to signin with error
        expect(mockNavigate).toHaveBeenCalledWith('/signin?error=profile_check_error');
      }, { timeout: 3000 });
    });

    it('should handle exception during profile check', async () => {
      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signin');

      // Mock exception
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockRejectedValue(new Error('Network timeout')),
        }),
      });
      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
      });

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Authentication Error",
          description: "Unable to verify your profile. Please try signing in again.",
          variant: "destructive"
        });

        expect(mockNavigate).toHaveBeenCalledWith('/signin?error=profile_check_exception');
      }, { timeout: 3000 });
    });
  });

  describe('Retry Logic with withRetry', () => {
    it('should use withRetry for profile existence check', async () => {
      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signin');

      // Mock profile exists
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: mockUser.id },
            error: null,
          }),
        }),
      });
      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
      });

      // Spy on withRetry
      mockWithRetry.mockImplementation((fn) => fn());

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        // withRetry should be called for database query
        expect(mockWithRetry).toHaveBeenCalled();

        // Should redirect after successful retry
        expect(mockNavigate).toHaveBeenCalledWith('/buyers/home');
      }, { timeout: 3000 });
    });

    it('should handle retry failures gracefully', async () => {
      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signin');

      // Mock withRetry exhausting retries
      mockWithRetry.mockRejectedValue(new Error('Max retries exceeded'));

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should handle retry failure gracefully
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Authentication Error",
            variant: "destructive"
          })
        );
      }, { timeout: 3000 });
    });
  });

  describe('OAuth Signup Flow (No Profile Check)', () => {
    it('should skip profile check for OAuth signup (redirect to signup form)', async () => {
      // OAuth SIGNUP flow (not signin)
      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signup');

      render(
        <BrowserRouter>
          <AuthCallbackSimple />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should redirect to signup form without checking profile
        expect(mockNavigate).toHaveBeenCalledWith('/signup/buyer');
      }, { timeout: 3000 });

      // Profile check should NOT be called for signup flow
      expect(mockSupabaseFrom).not.toHaveBeenCalledWith('user_buyers');
      expect(mockSupabaseFrom).not.toHaveBeenCalledWith('user_creators');
    });
  });
});
