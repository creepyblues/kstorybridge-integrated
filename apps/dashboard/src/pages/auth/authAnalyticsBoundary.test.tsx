import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { SESSION_EXPIRED_REASON_KEY } from '@/lib/sessionInactivity';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithEmail: vi.fn(),
  signInWithOAuth: vi.fn(),
  checkBuyerProfileExists: vi.fn(),
  trackSignup: vi.fn(),
  trackSignin: vi.fn(),
  notifyUserSignin: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/lib/auth', () => ({
  signUpWithEmail: mocks.signUpWithEmail,
  signInWithEmail: mocks.signInWithEmail,
  signInWithOAuth: mocks.signInWithOAuth,
  checkBuyerProfileExists: mocks.checkBuyerProfileExists,
}));

vi.mock('@/utils/analytics', () => ({
  trackSignup: mocks.trackSignup,
  trackSignin: mocks.trackSignin,
}));

vi.mock('@/services/emailService', () => ({ sendWelcomeEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/utils/slack', () => ({
  notifyBuyerSignup: vi.fn().mockResolvedValue(undefined),
  notifyUserSignin: mocks.notifyUserSignin,
}));
vi.mock('@/contexts/TrialContext', () => ({ getTrialSessionId: () => null }));
vi.mock('@/utils/onboarding', () => ({ completeOnboardingStep: vi.fn() }));

const renderSignUp = () => render(<MemoryRouter><SignUp /></MemoryRouter>);
const renderSignIn = () => render(<MemoryRouter><SignIn /></MemoryRouter>);

const submitSignup = () => {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Buyer One' } });
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'buyer@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /create account/i }));
};

const submitSignin = () => {
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'buyer@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
};

describe('buyer auth analytics outcome boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mocks.checkBuyerProfileExists.mockResolvedValue(true);
    mocks.notifyUserSignin.mockResolvedValue(undefined);
  });

  it('shows and consumes the one-time inactivity expiry message', () => {
    sessionStorage.setItem(SESSION_EXPIRED_REASON_KEY, 'inactivity');

    renderSignIn();

    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Session expired',
      description: 'Your session expired after one hour of inactivity. Please sign in again.',
    });
    expect(sessionStorage.getItem(SESSION_EXPIRED_REASON_KEY)).toBeNull();
  });

  it('emits signup completion exactly once after signup succeeds', async () => {
    mocks.signUpWithEmail.mockResolvedValue({ user: { id: 'buyer-1' }, session: { access_token: 'token' } });
    renderSignUp();

    submitSignup();

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    expect(mocks.trackSignup).toHaveBeenCalledTimes(3);
    expect(mocks.trackSignup).toHaveBeenNthCalledWith(1, 'viewed', 'email');
    expect(mocks.trackSignup).toHaveBeenNthCalledWith(2, 'attempted', 'email', { role: 'not_set' });
    expect(mocks.trackSignup).toHaveBeenNthCalledWith(3, 'completed', 'email', { role: '' });
    expect(mocks.trackSignup).not.toHaveBeenCalledWith('failed', expect.anything(), expect.anything());
  });

  it('emits no signup completion when the authoritative signup call fails', async () => {
    mocks.signUpWithEmail.mockRejectedValue(new Error('rejected'));
    renderSignUp();

    submitSignup();

    await waitFor(() => expect(mocks.trackSignup).toHaveBeenCalledWith(
      'failed',
      'email',
      { failure_reason: 'auth_rejected' }
    ));
    expect(mocks.trackSignup).not.toHaveBeenCalledWith('completed', expect.anything(), expect.anything());
    expect(mocks.trackSignup.mock.calls.filter(([stage]) => stage === 'failed')).toHaveLength(1);
  });

  it('emits signin completion exactly once after auth and buyer-profile checks succeed', async () => {
    mocks.signInWithEmail.mockResolvedValue({ user: { id: 'buyer-1' }, session: { access_token: 'token' } });
    renderSignIn();

    submitSignin();

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/buyers/home'));
    expect(mocks.trackSignin).toHaveBeenCalledTimes(3);
    expect(mocks.trackSignin).toHaveBeenNthCalledWith(1, 'viewed', 'email');
    expect(mocks.trackSignin).toHaveBeenNthCalledWith(2, 'attempted', 'email');
    expect(mocks.trackSignin).toHaveBeenNthCalledWith(3, 'completed', 'email');
    expect(mocks.notifyUserSignin).toHaveBeenCalledOnce();
    expect(mocks.notifyUserSignin).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      authType: 'email',
    });
  });

  it('emits no signin completion when the buyer profile does not exist', async () => {
    mocks.signInWithEmail.mockResolvedValue({ user: { id: 'buyer-1' }, session: { access_token: 'token' } });
    mocks.checkBuyerProfileExists.mockResolvedValue(false);
    renderSignIn();

    submitSignin();

    await waitFor(() => expect(mocks.trackSignin).toHaveBeenCalledWith(
      'failed',
      'email',
      { failure_reason: 'profile_not_found' }
    ));
    expect(mocks.trackSignin).not.toHaveBeenCalledWith('completed', expect.anything());
    expect(mocks.trackSignin.mock.calls.filter(([stage]) => stage === 'failed')).toHaveLength(1);
  });
});
