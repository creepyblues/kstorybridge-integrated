import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthCallback from './AuthCallback';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
  getSession: vi.fn(),
  checkBuyerProfileExists: vi.fn(),
  trackSignup: vi.fn(),
  trackSignin: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: mocks.getSession } } }));
vi.mock('@/lib/auth', () => ({ checkBuyerProfileExists: mocks.checkBuyerProfileExists }));
vi.mock('@/utils/analytics', () => ({
  trackSignup: mocks.trackSignup,
  trackSignin: mocks.trackSignin,
}));
vi.mock('@/utils/slack', () => ({ notifyUserSignin: vi.fn().mockResolvedValue(undefined) }));

const session = { user: { id: 'buyer-1', email: 'buyer@example.com' } };

const renderAndSettle = async () => {
  render(<MemoryRouter><AuthCallback /></MemoryRouter>);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
};

describe('buyer OAuth callback analytics boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.setItem('oauth_account_type', 'buyer');
    sessionStorage.setItem('oauth_flow', 'signin');
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.checkBuyerProfileExists.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits signin completion once after session and profile checks succeed', async () => {
    await renderAndSettle();

    expect(mocks.trackSignin.mock.calls.filter(([stage]) => stage === 'completed')).toEqual([
      ['completed', 'google'],
    ]);
    expect(mocks.navigate).toHaveBeenCalledWith('/buyers/home');
  });

  it('continues a profile-less Google sign-in into profile completion instead of erroring', async () => {
    mocks.checkBuyerProfileExists.mockResolvedValue(false);

    await renderAndSettle();

    // Not a failed sign-in: the provider authenticated them, so this becomes a signup
    expect(mocks.trackSignin.mock.calls.some(([stage]) => stage === 'completed')).toBe(false);
    expect(mocks.trackSignin.mock.calls.some(([stage]) => stage === 'failed')).toBe(false);
    expect(mocks.trackSignup).toHaveBeenCalledWith('attempted', 'google');
    expect(mocks.navigate).not.toHaveBeenCalledWith('/signup');
    expect(mocks.navigate).toHaveBeenCalledWith('/signup/complete');
    expect(sessionStorage.getItem('oauth_user_id')).toBeTruthy();
  });

  it('defers signup completion to the profile-persistence page', async () => {
    sessionStorage.setItem('oauth_flow', 'signup');

    await renderAndSettle();

    expect(mocks.trackSignup).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith('/signup/complete');
  });
});
