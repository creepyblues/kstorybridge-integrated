import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { clearAnalyticsUser, setAnalyticsUser } from '@/utils/analytics';
import {
  AUTH_INACTIVITY_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
  SESSION_EXPIRED_REASON_KEY,
} from '@/lib/sessionInactivity';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('@/utils/analytics', () => ({
  setAnalyticsUser: vi.fn(),
  clearAnalyticsUser: vi.fn(),
  isInternalTrafficMetadata: vi.fn(
    (metadata?: Record<string, unknown>) => metadata?.internal_traffic === true
  ),
}));

const unsubscribe = vi.fn();
let authStateChange: ((event: string, session: unknown) => void) | undefined;

const externalCreatorSession = {
  user: {
    id: 'creator-uuid-123',
    email: 'must-not-be-sent@example.com',
    app_metadata: { account_type: 'creator' },
  },
};

function Consumer() {
  const { user, loading, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user-id">{user?.id ?? 'none'}</span>
      <button type="button" onClick={() => void signOut()}>Sign out</button>
    </div>
  );
}

describe('creator analytics identity lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateChange = undefined;
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/home');

    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authStateChange = callback as typeof authStateChange;
      return { data: { subscription: { unsubscribe } } } as never;
    });
  });

  it('locally signs out an already-inactive persisted session before exposing it', async () => {
    localStorage.setItem(
      LAST_ACTIVITY_KEY,
      String(Date.now() - AUTH_INACTIVITY_TIMEOUT_MS)
    );
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: externalCreatorSession },
      error: null,
    } as never);
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never);

    render(<AuthProvider><Consumer /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('user-id')).toHaveTextContent('none');
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(sessionStorage.getItem(SESSION_EXPIRED_REASON_KEY)).toBe('inactivity');
  });

  it.each(['INITIAL_SESSION', 'SIGNED_IN'])(
    'rejects an expired session from the %s auth event before exposing it',
    async (event) => {
      localStorage.setItem(
        LAST_ACTIVITY_KEY,
        String(Date.now() - AUTH_INACTIVITY_TIMEOUT_MS)
      );
      vi.mocked(supabase.auth.getSession).mockImplementation(
        () => new Promise(() => {})
      );
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never);

      render(<AuthProvider><Consumer /></AuthProvider>);
      await waitFor(() => expect(authStateChange).toBeTypeOf('function'));

      await act(async () => {
        authStateChange?.(event, externalCreatorSession);
      });

      expect(screen.getByTestId('user-id')).toHaveTextContent('none');
      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(sessionStorage.getItem(SESSION_EXPIRED_REASON_KEY)).toBe('inactivity');
    }
  );

  it('sets only the Supabase UUID after an authenticated session resolves', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: externalCreatorSession },
      error: null,
    } as never);

    render(<AuthProvider><Consumer /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(setAnalyticsUser).toHaveBeenCalledWith('creator-uuid-123', {
      type: 'creator',
      internal: false,
    });
    expect(JSON.stringify(vi.mocked(setAnalyticsUser).mock.calls)).not.toContain(
      'must-not-be-sent@example.com'
    );
  });

  it('clears the analytics identity when auth reports a signed-out session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: externalCreatorSession },
      error: null,
    } as never);

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(authStateChange).toBeTypeOf('function'));
    vi.mocked(clearAnalyticsUser).mockClear();

    await act(async () => {
      authStateChange?.('SIGNED_OUT', null);
    });

    expect(clearAnalyticsUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('user-id')).toHaveTextContent('none');
  });

  it('clears analytics before calling Supabase signOut', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: externalCreatorSession },
      error: null,
    } as never);
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never);

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    vi.mocked(clearAnalyticsUser).mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalledTimes(1));
    expect(clearAnalyticsUser).toHaveBeenCalledTimes(1);
    expect(vi.mocked(clearAnalyticsUser).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(supabase.auth.signOut).mock.invocationCallOrder[0]
    );
    consoleError.mockRestore();
  });
});
