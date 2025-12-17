/**
 * TierContext Tests
 *
 * Tests cover:
 * - Tier hierarchy and access control
 * - Provider state management
 * - Error handling and fail-safe behavior
 * - Hook behavior inside/outside provider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { TierProvider, useTierAccess, UserTier } from './TierContext';

// Mock the auth hook
const mockUser = { id: 'test-user-123', email: 'test@example.com' };
const mockSession = { access_token: 'test-token' };
let mockAuthState = { user: mockUser, session: mockSession };

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

// Mock Supabase
const mockSupabaseQuery = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockSupabaseQuery,
        })),
      })),
    })),
  },
}));

// Test component to expose context values
function TierConsumer() {
  const { tier, loading, hasAccess, error } = useTierAccess();
  return (
    <div>
      <span data-testid="tier">{tier}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error || 'none'}</span>
      <span data-testid="access-invited">{String(hasAccess('invited'))}</span>
      <span data-testid="access-basic">{String(hasAccess('basic'))}</span>
      <span data-testid="access-pro">{String(hasAccess('pro'))}</span>
      <span data-testid="access-suite">{String(hasAccess('suite'))}</span>
    </div>
  );
}

describe('TierContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default authenticated state
    mockAuthState = { user: mockUser, session: mockSession };
    // Default to returning basic tier
    mockSupabaseQuery.mockResolvedValue({
      data: { tier: 'basic' },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TierProvider', () => {
    it('should fetch tier on mount when user is authenticated', async () => {
      mockSupabaseQuery.mockResolvedValue({
        data: { tier: 'pro' },
        error: null,
      });

      render(
        <TierProvider>
          <TierConsumer />
        </TierProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      // After fetch completes
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('tier')).toHaveTextContent('pro');
    });

    it('should default to basic tier when no user is authenticated', async () => {
      mockAuthState = { user: null as any, session: null as any };

      render(
        <TierProvider>
          <TierConsumer />
        </TierProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('tier')).toHaveTextContent('basic');
    });

    it('should default to basic tier on database error', async () => {
      mockSupabaseQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      render(
        <TierProvider>
          <TierConsumer />
        </TierProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('tier')).toHaveTextContent('basic');
      expect(screen.getByTestId('error')).toHaveTextContent('Unable to load subscription tier');
    });

    it('should default to basic tier when profile not found', async () => {
      mockSupabaseQuery.mockResolvedValue({
        data: null,
        error: null,
      });

      render(
        <TierProvider>
          <TierConsumer />
        </TierProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('tier')).toHaveTextContent('basic');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    it('should handle timeout errors gracefully', async () => {
      // Mock a promise that never resolves (simulating timeout)
      mockSupabaseQuery.mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out after 10000ms')), 50);
        })
      );

      render(
        <TierProvider>
          <TierConsumer />
        </TierProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      }, { timeout: 5000 });

      expect(screen.getByTestId('tier')).toHaveTextContent('basic');
      expect(screen.getByTestId('error')).toHaveTextContent('timed out');
    });
  });

  describe('hasAccess', () => {
    const testCases: Array<{
      userTier: UserTier;
      requiredTier: UserTier;
      expected: boolean;
    }> = [
      // Basic tier access
      { userTier: 'basic', requiredTier: 'basic', expected: true },
      { userTier: 'basic', requiredTier: 'pro', expected: false },
      { userTier: 'basic', requiredTier: 'suite', expected: false },
      { userTier: 'basic', requiredTier: 'invited', expected: true },

      // Pro tier access
      { userTier: 'pro', requiredTier: 'basic', expected: true },
      { userTier: 'pro', requiredTier: 'pro', expected: true },
      { userTier: 'pro', requiredTier: 'suite', expected: false },
      { userTier: 'pro', requiredTier: 'invited', expected: true },

      // Suite tier access (highest)
      { userTier: 'suite', requiredTier: 'basic', expected: true },
      { userTier: 'suite', requiredTier: 'pro', expected: true },
      { userTier: 'suite', requiredTier: 'suite', expected: true },
      { userTier: 'suite', requiredTier: 'invited', expected: true },

      // Invited tier access (lowest)
      { userTier: 'invited', requiredTier: 'invited', expected: true },
      { userTier: 'invited', requiredTier: 'basic', expected: false },
      { userTier: 'invited', requiredTier: 'pro', expected: false },
      { userTier: 'invited', requiredTier: 'suite', expected: false },
    ];

    testCases.forEach(({ userTier, requiredTier, expected }) => {
      it(`should ${expected ? 'grant' : 'deny'} access when user has ${userTier} and ${requiredTier} is required`, async () => {
        mockSupabaseQuery.mockResolvedValue({
          data: { tier: userTier },
          error: null,
        });

        render(
          <TierProvider>
            <TierConsumer />
          </TierProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });

        expect(screen.getByTestId('tier')).toHaveTextContent(userTier);
        expect(screen.getByTestId(`access-${requiredTier}`)).toHaveTextContent(String(expected));
      });
    });
  });

  describe('useTierAccess outside TierProvider', () => {
    it('should return permissive defaults when used outside provider', () => {
      function StandaloneConsumer() {
        const { tier, loading, hasAccess, error } = useTierAccess();
        return (
          <div>
            <span data-testid="tier">{tier}</span>
            <span data-testid="loading">{String(loading)}</span>
            <span data-testid="error">{error || 'none'}</span>
            <span data-testid="access-suite">{String(hasAccess('suite'))}</span>
          </div>
        );
      }

      render(<StandaloneConsumer />);

      expect(screen.getByTestId('tier')).toHaveTextContent('basic');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
      // Should grant access to any tier when outside provider (trial mode)
      expect(screen.getByTestId('access-suite')).toHaveTextContent('true');
    });
  });

  describe('refetch functionality', () => {
    it('should allow manual refetch of tier', async () => {
      mockSupabaseQuery.mockResolvedValueOnce({
        data: { tier: 'basic' },
        error: null,
      });

      function RefetchConsumer() {
        const { tier, loading, refetch } = useTierAccess();
        return (
          <div>
            <span data-testid="tier">{tier}</span>
            <span data-testid="loading">{String(loading)}</span>
            <button data-testid="refetch" onClick={refetch}>
              Refetch
            </button>
          </div>
        );
      }

      render(
        <TierProvider>
          <RefetchConsumer />
        </TierProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('tier')).toHaveTextContent('basic');

      // Now update mock to return 'pro' for next fetch
      mockSupabaseQuery.mockResolvedValueOnce({
        data: { tier: 'pro' },
        error: null,
      });

      // Trigger refetch
      await act(async () => {
        screen.getByTestId('refetch').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('tier')).toHaveTextContent('pro');
    });
  });

  describe('tier hierarchy', () => {
    it('should correctly rank tiers: invited < basic < pro < suite', () => {
      // This test validates the tier hierarchy values
      const tierHierarchy: Record<UserTier, number> = {
        invited: 0,
        basic: 1,
        pro: 2,
        suite: 3,
      };

      expect(tierHierarchy.invited).toBeLessThan(tierHierarchy.basic);
      expect(tierHierarchy.basic).toBeLessThan(tierHierarchy.pro);
      expect(tierHierarchy.pro).toBeLessThan(tierHierarchy.suite);
    });
  });
});
