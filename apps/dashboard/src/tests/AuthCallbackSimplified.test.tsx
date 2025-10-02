import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthCallbackPageSimplified from '../pages/AuthCallbackPageSimplified';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn(),
      updateUser: vi.fn()
    }
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/utils/simpleAccountTypeDetection', () => ({
  getOAuthAccountType: vi.fn(() => ({ accountType: 'buyer', source: 'url' })),
  getDashboardPath: vi.fn(() => '/buyers/home'),
  getSignupPath: vi.fn(() => '/signup/buyer')
}));

vi.mock('@/utils/oauthFlowDetection', () => ({
  markOAuthCompletion: vi.fn()
}));

vi.mock('@/services/authErrorTracking', () => ({
  trackOAuthCallbackError: vi.fn()
}));

// Mock router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock URL
const mockURL = new URL('http://localhost:8081/auth/callback?code=oauth_code&account_type=buyer&flow=signup');
Object.defineProperty(window, 'location', {
  value: {
    href: mockURL.href,
    search: mockURL.search,
    origin: mockURL.origin,
    assign: vi.fn()
  }
});

describe('AuthCallbackPageSimplified', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state', () => {
    render(
      <BrowserRouter>
        <AuthCallbackPageSimplified />
      </BrowserRouter>
    );

    expect(screen.getByText('Completing Authentication')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we process your login...')).toBeInTheDocument();
  });

  it('should handle successful OAuth exchange with session data', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { account_type: 'buyer' }
      },
      access_token: 'token123'
    };

    supabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    supabase.auth.updateUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null
    });

    render(
      <BrowserRouter>
        <AuthCallbackPageSimplified />
      </BrowserRouter>
    );

    // Should complete much faster than the old version
    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code');
    }, { timeout: 1000 }); // Much shorter timeout

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/signup/buyer?complete=true')
      );
    }, { timeout: 2000 }); // Much shorter timeout
  });

  it('should handle OAuth exchange failure immediately', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    supabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: null,
      error: { message: 'OAuth exchange failed', code: 'oauth_error' }
    });

    render(
      <BrowserRouter>
        <AuthCallbackPageSimplified />
      </BrowserRouter>
    );

    // Should fail fast, no long timeouts
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin?error=oauth_failed');
    }, { timeout: 1000 }); // Much faster failure
  });

  it('should handle missing code parameter immediately', async () => {
    // Update URL to remove code
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:8081/auth/callback?account_type=buyer&flow=signup',
        search: '?account_type=buyer&flow=signup',
        origin: 'http://localhost:8081',
        assign: vi.fn()
      }
    });

    render(
      <BrowserRouter>
        <AuthCallbackPageSimplified />
      </BrowserRouter>
    );

    // Should fail immediately for missing code
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin?error=missing_code');
    }, { timeout: 500 }); // Very fast validation
  });

  it('should handle no session returned', async () => {
    // Ensure URL has code parameter for this test
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:8081/auth/callback?code=valid_code&account_type=buyer&flow=signup',
        search: '?code=valid_code&account_type=buyer&flow=signup',
        origin: 'http://localhost:8081',
        assign: vi.fn()
      }
    });

    const { supabase } = await import('@/integrations/supabase/client');

    supabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    render(
      <BrowserRouter>
        <AuthCallbackPageSimplified />
      </BrowserRouter>
    );

    // Should fail fast without retries
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin?error=no_session');
    }, { timeout: 1000 }); // Fast failure
  });

  it('should handle signin flow (not signup)', async () => {
    // Update URL to signin flow
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:8081/auth/callback?code=oauth_code&account_type=buyer&flow=signin',
        search: '?code=oauth_code&account_type=buyer&flow=signin',
        origin: 'http://localhost:8081',
        assign: vi.fn()
      }
    });

    const { supabase } = await import('@/integrations/supabase/client');

    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { account_type: 'buyer' }
      },
      access_token: 'token123'
    };

    supabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    supabase.auth.updateUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null
    });

    render(
      <BrowserRouter>
        <AuthCallbackPageSimplified />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/buyers/home')
      );
    }, { timeout: 1000 }); // Fast completion
  });

  it('should handle metadata update failure gracefully', async () => {
    // Ensure URL has correct flow=signup parameter
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:8081/auth/callback?code=oauth_code&account_type=buyer&flow=signup',
        search: '?code=oauth_code&account_type=buyer&flow=signup',
        origin: 'http://localhost:8081',
        assign: vi.fn()
      }
    });

    const { supabase } = await import('@/integrations/supabase/client');

    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { account_type: 'buyer' }
      },
      access_token: 'token123'
    };

    supabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    // Metadata update fails, but flow should continue
    supabase.auth.updateUser.mockRejectedValue(new Error('Metadata update failed'));

    render(
      <BrowserRouter>
        <AuthCallbackPageSimplified />
      </BrowserRouter>
    );

    // Should still redirect despite metadata failure
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/signup/buyer?complete=true')
      );
    }, { timeout: 1000 });
  });
});