import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpressInterestButton } from './ExpressInterestButton';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  hasExpressedInterest: vi.fn(),
  submitInterest: vi.fn(),
  trackTitleContactCreatorClicked: vi.fn(),
  trackTitleInterestSubmitted: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/services/interestService', () => ({
  interestService: {
    hasExpressedInterest: mocks.hasExpressedInterest,
    submitInterest: mocks.submitInterest,
  },
}));
vi.mock('@/utils/analytics', () => ({
  trackTitleContactCreatorClicked: mocks.trackTitleContactCreatorClicked,
  trackTitleInterestSubmitted: mocks.trackTitleInterestSubmitted,
}));

const renderButton = () => render(
  <ExpressInterestButton
    titleId="title-1"
    titleName="Sensitive title name"
    userEmail="buyer@example.com"
    userTier="pro"
  />
);

const submit = async () => {
  const user = userEvent.setup();
  await waitFor(() => expect(mocks.hasExpressedInterest).toHaveBeenCalledTimes(1));
  await user.click(screen.getByRole('button', { name: /express interest/i }));
  await user.click(await screen.findByRole('button', { name: /^send interest$/i }));
};

describe('buyer-interest analytics outcome boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasExpressedInterest.mockResolvedValue(false);
  });

  it('emits interest_submitted exactly once for a newly created server outcome', async () => {
    mocks.submitInterest.mockResolvedValue(true);
    renderButton();

    await submit();

    await screen.findByRole('button', { name: /interest sent/i });
    expect(mocks.trackTitleInterestSubmitted).toHaveBeenCalledWith('title-1');
    expect(mocks.trackTitleInterestSubmitted).toHaveBeenCalledTimes(1);
  });

  it('emits no outcome when the server refreshes a duplicate interest', async () => {
    mocks.submitInterest.mockResolvedValue(false);
    renderButton();

    await submit();

    await screen.findByRole('button', { name: /interest sent/i });
    expect(mocks.submitInterest).toHaveBeenCalledTimes(1);
    expect(mocks.trackTitleInterestSubmitted).not.toHaveBeenCalled();
  });

  it('emits no outcome when the server request fails', async () => {
    mocks.submitInterest.mockRejectedValue(new Error('network failure'));
    renderButton();

    await submit();

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Could not send interest',
      variant: 'destructive',
    })));
    await waitFor(() => expect(screen.getByRole('button', { name: /^send interest$/i })).toBeEnabled());
    expect(mocks.trackTitleInterestSubmitted).not.toHaveBeenCalled();
  });
});
