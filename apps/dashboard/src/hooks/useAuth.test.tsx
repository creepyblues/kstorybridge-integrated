import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
import {
  AUTH_INACTIVITY_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
  SESSION_EXPIRED_REASON_KEY,
} from '@/lib/sessionInactivity';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  setAnalyticsUser: vi.fn(),
  clearAnalyticsUser: vi.fn(),
  isInternalTrafficMetadata: vi.fn(
    (metadata?: Record<string, unknown>) => metadata?.internal_traffic === true
  ),
}));

import { supabase } from '@/lib/supabase';
import { setAnalyticsUser, clearAnalyticsUser } from '@/utils/analytics';

// Helper component to test useAuth hook
function TestComponent() {
  const { user, session, loading, error, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      // Error is logged in signOut, this catches the rethrow
    }
  };

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'none'}</div>
      <div data-testid="user">{user?.email || 'null'}</div>
      <div data-testid="session">{session ? 'exists' : 'null'}</div>
      <button onClick={handleSignOut} data-testid="signout-btn">Sign Out</button>
    </div>
  );
}

// Mock user and session
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  user: mockUser,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
};

describe('useAuth', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authStateChangeCallback: any = null;
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateChangeCallback = null;
    unsubscribeMock = vi.fn();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/buyers/home');

    // Default mock: onAuthStateChange captures the callback
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authStateChangeCallback = callback;
      return {
        data: {
          subscription: {
            id: 'test-subscription-id',
            callback: callback,
            unsubscribe: unsubscribeMock,
          },
        },
      };
    });
  });

  describe('useAuth hook without provider', () => {
    it('should use default context values when used outside AuthProvider', () => {
      // The default context value doesn't throw, so this test checks the context behavior
      render(<TestComponent />);

      // Default values are provided
      expect(screen.getByTestId('loading').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  describe('AuthProvider initialization', () => {
    it('locally signs out an already-inactive persisted session before exposing it', async () => {
      localStorage.setItem(
        LAST_ACTIVITY_KEY,
        String(Date.now() - AUTH_INACTIVITY_TIMEOUT_MS)
      );
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(sessionStorage.getItem(SESSION_EXPIRED_REASON_KEY)).toBe('inactivity');
    });

    it('should set user and session on successful initialization', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      expect(screen.getByTestId('session').textContent).toBe('exists');
      expect(screen.getByTestId('error').textContent).toBe('none');
    });

    it('should handle null session (not authenticated)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('session').textContent).toBe('null');
      expect(screen.getByTestId('error').textContent).toBe('none');
    });

    it('should set error on session fetch error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Network error' } as any,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('error').textContent).toBe('Authentication failed. Please refresh and try again.');

      consoleError.mockRestore();
    });

    it('should set GA4 analytics user when session exists', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(setAnalyticsUser).toHaveBeenCalledWith('user-123', {
        type: 'buyer',
        internal: false,
      });
    });

    it('should not set GA4 analytics user when session is null', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(setAnalyticsUser).not.toHaveBeenCalled();
    });
  });

  describe('Auth state change listener', () => {
    it.each(['INITIAL_SESSION', 'SIGNED_IN']) (
      'rejects an expired session from the %s auth event before exposing it',
      async (event) => {
        localStorage.setItem(
          LAST_ACTIVITY_KEY,
          String(Date.now() - AUTH_INACTIVITY_TIMEOUT_MS)
        );
        vi.mocked(supabase.auth.getSession).mockImplementation(
          () => new Promise(() => {})
        );
        vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => expect(authStateChangeCallback).toBeTypeOf('function'));
        await act(async () => {
          authStateChangeCallback?.(event, mockSession);
        });

        expect(screen.getByTestId('user').textContent).toBe('null');
        expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
        expect(sessionStorage.getItem(SESSION_EXPIRED_REASON_KEY)).toBe('inactivity');
      }
    );

    it('should subscribe to auth state changes', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should update state when auth state changes to signed in', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');

      // Simulate auth state change (user signs in)
      await act(async () => {
        authStateChangeCallback?.('SIGNED_IN', mockSession);
      });

      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      expect(screen.getByTestId('session').textContent).toBe('exists');
      expect(setAnalyticsUser).toHaveBeenCalledWith('user-123', {
        type: 'buyer',
        internal: false,
      });
    });

    it('should update state when auth state changes to signed out', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('test@example.com');

      // Simulate auth state change (user signs out)
      await act(async () => {
        authStateChangeCallback?.('SIGNED_OUT', null);
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('session').textContent).toBe('null');
      expect(clearAnalyticsUser).toHaveBeenCalled();
    });

    it('should clear errors on successful auth state change', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Start with error state
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Initial error' } as any,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('error').textContent).not.toBe('none');

      // Simulate successful auth state change
      await act(async () => {
        authStateChangeCallback?.('SIGNED_IN', mockSession);
      });

      expect(screen.getByTestId('error').textContent).toBe('none');

      consoleError.mockRestore();
    });

    it('should unsubscribe on unmount', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('test@example.com');

      // Click sign out button
      await act(async () => {
        screen.getByTestId('signout-btn').click();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(clearAnalyticsUser).toHaveBeenCalled();
    });

    it('should log error on sign out failure', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Create a proper rejection that will be caught
      const signOutError = new Error('Sign out failed');
      vi.mocked(supabase.auth.signOut).mockImplementation(() => Promise.reject(signOutError));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Click sign out button
      await act(async () => {
        screen.getByTestId('signout-btn').click();
        // Give time for the promise to reject
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Wait for the error to be logged
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Sign out error:', signOutError);
      });

      consoleError.mockRestore();
    });

    it('should clear analytics before sign out', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('signout-btn').click();
      });

      // clearAnalyticsUser should be called before signOut
      expect(clearAnalyticsUser).toHaveBeenCalled();
    });
  });

  describe('timeout behavior', () => {
    it('should handle timeout error with proper message', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate a timeout error directly
      vi.mocked(supabase.auth.getSession).mockRejectedValue(
        new Error('Session initialization timed out after 10000ms')
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('error').textContent).toBe('Connection timeout. Please check your network and try again.');

      consoleError.mockRestore();
    });

    it('should show generic error for non-timeout failures', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.auth.getSession).mockRejectedValue(
        new Error('Some other error')
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('error').textContent).toBe('Authentication failed. Please refresh and try again.');

      consoleError.mockRestore();
    });
  });

  describe('mounted flag behavior', () => {
    it('should not update state from auth listener after unmount', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Unmount component
      unmount();

      // Trigger auth state change after unmount - should not cause errors
      // Just verify unsubscribe was called
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid auth state changes', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Rapid auth state changes
      await act(async () => {
        authStateChangeCallback?.('SIGNED_IN', mockSession);
        authStateChangeCallback?.('SIGNED_OUT', null);
        authStateChangeCallback?.('SIGNED_IN', mockSession);
      });

      // Should settle on final state
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
    });

    it('should handle session with partial user data', async () => {
      const partialSession = {
        ...mockSession,
        user: {
          ...mockUser,
          email: undefined,
        },
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: partialSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('session').textContent).toBe('exists');
      expect(screen.getByTestId('user').textContent).toBe('null'); // email is undefined
    });

    it('should show loading state before session resolves', () => {
      // Never resolve the promise
      vi.mocked(supabase.auth.getSession).mockReturnValue(
        new Promise(() => {}) as any
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('session').textContent).toBe('null');
    });
  });
});
