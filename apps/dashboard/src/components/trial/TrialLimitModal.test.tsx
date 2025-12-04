import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TrialLimitModal } from './TrialLimitModal';

// Mock the useTrial hook to control showLimitModal state
vi.mock('@/contexts/TrialContext', async () => {
  const actual = await vi.importActual('@/contexts/TrialContext');
  return {
    ...actual,
    useTrial: vi.fn(),
  };
});

import { useTrial } from '@/contexts/TrialContext';

const mockUseTrial = useTrial as ReturnType<typeof vi.fn>;

function renderModal(showModal = true) {
  const setShowLimitModal = vi.fn();
  mockUseTrial.mockReturnValue({
    remainingTrials: 0,
    hasTrialRemaining: false,
    incrementUsage: vi.fn(),
    showLimitModal: showModal,
    setShowLimitModal,
    maxTrials: 3,
  });

  render(
    <BrowserRouter>
      <TrialLimitModal />
    </BrowserRouter>
  );

  return { setShowLimitModal };
}

describe('TrialLimitModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when showLimitModal is true', () => {
    renderModal(true);
    expect(screen.getByText("You've used all 3 trial searches!")).toBeInTheDocument();
  });

  it('should not render modal when showLimitModal is false', () => {
    renderModal(false);
    expect(screen.queryByText("You've used all 3 trial searches!")).not.toBeInTheDocument();
  });

  it('should display benefits list', () => {
    renderModal(true);
    expect(screen.getByText('Unlimited AI-powered searches')).toBeInTheDocument();
    expect(screen.getByText('Save and revisit your search history')).toBeInTheDocument();
    expect(screen.getByText('Save your favorite titles')).toBeInTheDocument();
    expect(screen.getByText('Access to AI chat assistant (Jinu)')).toBeInTheDocument();
  });

  it('should have Sign Up Free button linking to /signup', () => {
    renderModal(true);
    const signUpButton = screen.getByRole('link', { name: /sign up free/i });
    expect(signUpButton).toHaveAttribute('href', '/signup');
  });

  it('should have Sign In link for existing users', () => {
    renderModal(true);
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/signin');
  });

  it('should display correct trial count in title', () => {
    renderModal(true);
    expect(screen.getByText("You've used all 3 trial searches!")).toBeInTheDocument();
  });
});
