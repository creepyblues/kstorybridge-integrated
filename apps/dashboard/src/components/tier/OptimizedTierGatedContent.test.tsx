import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OptimizedTierGatedContent from './OptimizedTierGatedContent';

const tierMock = vi.hoisted(() => ({
  tier: 'basic' as string,
  loading: false,
}));

vi.mock('@/contexts/TierContext', () => ({
  useTierAccess: () => ({
    tier: tierMock.tier,
    loading: tierMock.loading,
    hasAccess: (required: string) => {
      const order: Record<string, number> = { invited: 0, basic: 1, pro: 2, suite: 3 };
      return (order[tierMock.tier] ?? 0) >= (order[required] ?? 0);
    },
  }),
}));

// A user who is BOTH a creator and a basic buyer. Role membership must not unlock paid content.
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'both@example.com', user_metadata: { account_type: 'creator' } },
    loading: false,
  }),
}));

describe('OptimizedTierGatedContent', () => {
  beforeEach(() => {
    tierMock.tier = 'basic';
    tierMock.loading = false;
  });

  it('gates a basic-tier buyer even when they also hold a creator profile', () => {
    render(
      <OptimizedTierGatedContent requiredTier="pro" premiumLabel="PRO PLAN">
        <span>secret pitch deck</span>
      </OptimizedTierGatedContent>,
    );
    expect(screen.getByText('PRO PLAN')).toBeInTheDocument();
    // Content is rendered blurred, not unlocked
    expect(screen.getByText('secret pitch deck').closest('.blur-sm')).not.toBeNull();
  });

  it('shows content when the buyer tier satisfies the requirement', () => {
    tierMock.tier = 'pro';
    render(
      <OptimizedTierGatedContent requiredTier="pro" premiumLabel="PRO PLAN">
        <span>secret pitch deck</span>
      </OptimizedTierGatedContent>,
    );
    expect(screen.queryByText('PRO PLAN')).toBeNull();
    expect(screen.getByText('secret pitch deck').closest('.blur-sm')).toBeNull();
  });

  it('renders a skeleton while the tier is loading', () => {
    tierMock.loading = true;
    const { container } = render(
      <OptimizedTierGatedContent requiredTier="pro">
        <span>secret pitch deck</span>
      </OptimizedTierGatedContent>,
    );
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
    expect(screen.queryByText('secret pitch deck')).toBeNull();
  });
});
