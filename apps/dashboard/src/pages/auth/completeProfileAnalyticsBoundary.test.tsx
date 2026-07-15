import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CompleteProfile from './CompleteProfile';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
  completeOAuthProfile: vi.fn(),
  trackSignup: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'buyer-1', email: 'buyer@example.com', user_metadata: {} },
    session: { access_token: 'token' },
  }),
}));
vi.mock('@/lib/auth', () => ({ completeOAuthProfile: mocks.completeOAuthProfile }));
vi.mock('@/utils/analytics', () => ({ trackSignup: mocks.trackSignup }));
vi.mock('@/services/emailService', () => ({ sendWelcomeEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/utils/slack', () => ({ notifyBuyerSignup: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/contexts/TrialContext', () => ({ getTrialSessionId: () => null }));

const renderPage = () => render(<MemoryRouter><CompleteProfile /></MemoryRouter>);

const submit = () => {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Buyer One' } });
  fireEvent.click(screen.getByRole('button', { name: /complete profile/i }));
};

describe('buyer OAuth profile analytics boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits Google signup completion once after profile persistence succeeds', async () => {
    mocks.completeOAuthProfile.mockResolvedValue(undefined);
    renderPage();

    submit();

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/buyers/home'));
    expect(mocks.trackSignup.mock.calls.filter(([stage]) => stage === 'completed')).toEqual([
      ['completed', 'google', { role: '' }],
    ]);
    expect(mocks.trackSignup.mock.calls.some(([stage]) => stage === 'failed')).toBe(false);
  });

  it('emits no completion when profile persistence fails', async () => {
    mocks.completeOAuthProfile.mockRejectedValue(new Error('profile write failed'));
    renderPage();

    submit();

    await waitFor(() => expect(mocks.trackSignup).toHaveBeenCalledWith(
      'failed',
      'google',
      { failure_reason: 'profile_creation_failed' }
    ));
    expect(mocks.trackSignup.mock.calls.filter(([stage]) => stage === 'failed')).toHaveLength(1);
    expect(mocks.trackSignup.mock.calls.some(([stage]) => stage === 'completed')).toBe(false);
  });
});
