import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthCallback from '../AuthCallback';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getSession: vi.fn(),
  lookupCreatorProfile: vi.fn(),
  createCreatorProfileFromPending: vi.fn(),
  trackSignup: vi.fn(),
  trackSignin: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mocks.getSession, verifyOtp: vi.fn() },
    from: vi.fn(),
  },
}));
vi.mock('@/lib/auth', () => ({
  lookupCreatorProfile: mocks.lookupCreatorProfile,
  createCreatorProfileFromPending: mocks.createCreatorProfileFromPending,
  EmailConflictError: class EmailConflictError extends Error {
    constructor() { super('This email is already attached to a different KStoryBridge account.'); }
  },
}));
vi.mock('@/utils/analytics', () => ({
  trackSignup: mocks.trackSignup,
  trackSignin: mocks.trackSignin,
}));
vi.mock('@/services/emailService', () => ({ sendWelcomeEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/utils/slack', () => ({
  notifyCreatorSignup: vi.fn().mockResolvedValue(undefined),
  notifyCreatorSignin: vi.fn().mockResolvedValue(undefined),
}));

const session = {
  user: { id: 'creator-1', email: 'creator@example.com', user_metadata: {} },
};

const renderAndSettle = async () => {
  render(<MemoryRouter><AuthCallback /></MemoryRouter>);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
};

describe('creator OAuth callback analytics boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/auth/callback');
    sessionStorage.setItem('oauth_flow', 'signin');
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.lookupCreatorProfile.mockResolvedValue('exists');
    mocks.createCreatorProfileFromPending.mockResolvedValue({ status: 'no_data' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits signin completion once after session and profile checks succeed', async () => {
    await renderAndSettle();

    expect(mocks.trackSignin.mock.calls.filter(([stage]) => stage === 'completed')).toEqual([
      ['completed', 'google'],
    ]);
    expect(mocks.navigate).toHaveBeenCalledWith('/home');
  });

  it('emits no completion for a new OAuth user before profile persistence', async () => {
    mocks.lookupCreatorProfile.mockResolvedValue('missing');

    await renderAndSettle();

    expect(mocks.trackSignin.mock.calls.some(([stage]) => stage === 'completed')).toBe(false);
    expect(mocks.trackSignup.mock.calls.some(([stage]) => stage === 'completed')).toBe(false);
    expect(mocks.navigate).toHaveBeenCalledWith('/auth/complete-profile');
  });

  it('onboards a sign-in user with no creator profile instead of rejecting them', async () => {
    // oauth_flow is 'signin' (set in beforeEach): button intent never blocks onboarding
    mocks.lookupCreatorProfile.mockResolvedValue('missing');

    await renderAndSettle();

    expect(mocks.trackSignin.mock.calls.some(([stage]) => stage === 'failed')).toBe(false);
    expect(mocks.trackSignup).toHaveBeenCalledWith('attempted', 'google');
    expect(mocks.navigate).toHaveBeenCalledWith('/auth/complete-profile');
    expect(mocks.navigate).not.toHaveBeenCalledWith('/signup');
  });

  it('fails closed to /signin when the profile lookup errors (never profile completion)', async () => {
    mocks.lookupCreatorProfile.mockResolvedValue('error');

    await renderAndSettle();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.trackSignin).toHaveBeenCalledWith('failed', 'google', 'profile_lookup_failed');
    expect(mocks.trackSignin.mock.calls.some(([stage]) => stage === 'completed')).toBe(false);
    expect(mocks.navigate).not.toHaveBeenCalledWith('/auth/complete-profile');
    expect(mocks.navigate).toHaveBeenCalledWith('/signin');
  });

  it('emits one failure and no completion when the OAuth session is missing', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: new Error('missing') });

    await renderAndSettle();

    expect(mocks.trackSignin).toHaveBeenCalledWith('failed', 'google', 'oauth_session_failed');
    expect(mocks.trackSignin.mock.calls.filter(([stage]) => stage === 'failed')).toHaveLength(1);
    expect(mocks.trackSignin.mock.calls.some(([stage]) => stage === 'completed')).toBe(false);
  });
});
