import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CompleteProfile from '../CompleteProfile';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  completeOAuthProfile: vi.fn(),
  trackCreatorProfileCompleted: vi.fn(),
  trackSignup: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'creator-1', email: 'creator@example.com', user_metadata: {} } }),
}));
vi.mock('@/lib/auth', () => ({ completeOAuthProfile: mocks.completeOAuthProfile }));
vi.mock('@/utils/analytics', () => ({
  trackCreatorProfileCompleted: mocks.trackCreatorProfileCompleted,
  trackSignup: mocks.trackSignup,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'auth:completeProfile.title': 'Complete Your Profile',
      'auth:completeProfile.subtitle': 'Tell us about yourself',
      'auth:signUp.fullNameLabel': 'Full Name',
      'auth:signUp.fullNamePlaceholder': 'Full name',
      'auth:completeProfile.penNameLabel': 'Pen Name',
      'auth:completeProfile.penNamePlaceholder': 'Pen name',
      'auth:completeProfile.roleLabel': 'Role',
      'auth:completeProfile.roleAuthor': 'Author',
      'auth:completeProfile.roleAgent': 'Agent',
      'auth:completeProfile.companyLabel': 'Company',
      'auth:completeProfile.companyPlaceholder': 'Company',
      'auth:completeProfile.websiteLabel': 'Website',
      'auth:completeProfile.websitePlaceholder': 'Website',
      'auth:completeProfile.submitButton': 'Complete Profile',
      'auth:completeProfile.submitting': 'Completing...',
    } as Record<string, string>)[key] || key,
  }),
}));

const renderPage = () => render(<MemoryRouter><CompleteProfile /></MemoryRouter>);

const submit = () => {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Creator One' } });
  fireEvent.change(screen.getByLabelText(/pen name/i), { target: { value: 'Pen One' } });
  fireEvent.click(screen.getByRole('button', { name: /complete profile/i }));
};

describe('creator OAuth profile analytics boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits profile and signup completion once after persistence succeeds', async () => {
    mocks.completeOAuthProfile.mockResolvedValue(undefined);
    renderPage();

    submit();

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/home'));
    expect(mocks.trackCreatorProfileCompleted).toHaveBeenCalledTimes(1);
    expect(mocks.trackSignup.mock.calls.filter(([stage]) => stage === 'completed')).toEqual([
      ['completed', 'google'],
    ]);
    expect(mocks.trackSignup.mock.calls.some(([stage]) => stage === 'failed')).toBe(false);
  });

  it('emits neither completion when persistence fails', async () => {
    mocks.completeOAuthProfile.mockRejectedValue(new Error('profile write failed'));
    renderPage();

    submit();

    await waitFor(() => expect(mocks.trackSignup).toHaveBeenCalledWith(
      'failed',
      'google',
      'profile_creation_failed'
    ));
    expect(mocks.trackCreatorProfileCompleted).not.toHaveBeenCalled();
    expect(mocks.trackSignup.mock.calls.some(([stage]) => stage === 'completed')).toBe(false);
  });
});
