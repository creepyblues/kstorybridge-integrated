import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthCallbackMinimal from '../pages/AuthCallbackMinimal';

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

vi.mock('@/utils/oauthUtils', () => ({
  getOAuthAccountType: vi.fn(),
  getDashboardPath: vi.fn(),
  getSignupPath: vi.fn(),
  markOAuthCompletion: vi.fn()
}));

vi.mock('@/services/authErrorTracking', () => ({
  trackOAuthCallbackError: vi.fn()
}));

vi.mock('@/utils/oauthSecurity', () => ({
  validateOAuthState: vi.fn(),
  initializeOAuthFlow: vi.fn(),
  generateSecureState: vi.fn()
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

describe('OAuth State Parameter Support', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked functions
    const { getOAuthAccountType, getDashboardPath, getSignupPath } = await import('@/utils/oauthUtils');
    const { validateOAuthState } = await import('@/utils/oauthSecurity');

    // Set up default mock implementations
    vi.mocked(getDashboardPath).mockImplementation((accountType: string) => {
      return accountType === 'buyer' ? '/buyers/home' : '/home';
    });

    vi.mocked(getSignupPath).mockImplementation((accountType: string) => {
      return accountType === 'buyer' ? '/signup/buyer' : '/signup/creator';
    });

    // Mock secure OAuth state validation
    vi.mocked(validateOAuthState).mockImplementation((state: string) => {
      // Handle specific test states
      if (state === 'a1b2c3d4e5f67890123456789012345a') {
        return { flow: 'signup', accountType: 'buyer', provider: 'google', timestamp: Date.now() };
      }
      if (state === 'e5f6g7h8901234567890123456789abc') {
        return { flow: 'signin', accountType: 'creator', provider: 'google', timestamp: Date.now() };
      }
      if (state === 'i9j0k1l2345678901234567890123def') {
        return { flow: 'signup', accountType: 'creator', provider: 'google', timestamp: Date.now() };
      }

      // For any other 32-character hex string, validate format and return mock data
      if (state && state.length === 32 && /^[a-f0-9]+$/.test(state)) {
        return { flow: 'signup', accountType: 'buyer', provider: 'google', timestamp: Date.now() };
      }

      // Invalid state - return null (simulates security validation failure)
      return null;
    });

    // Default account type detection behavior (fallback for URL params)
    vi.mocked(getOAuthAccountType).mockImplementation((user: any, urlParams?: URLSearchParams) => {
      // First check URL params
      if (urlParams) {
        const urlAccountType = urlParams.get('account_type');
        if (urlAccountType) {
          return { accountType: urlAccountType as any, source: 'url_params' };
        }
      }

      // Then check user metadata
      const metadataAccountType = user?.user_metadata?.account_type;
      if (metadataAccountType) {
        return { accountType: metadataAccountType, source: 'metadata' };
      }

      // Default fallback
      return { accountType: 'buyer', source: 'unknown' };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle OAuth state parameter for signup flow', async () => {
    // Create secure OAuth state parameter (32-character hex string)
    const stateParam = 'a1b2c3d4e5f67890123456789012345a'; // Mock secure state for buyer signup

    // Clean callback URL with state parameter (OAuth compliant)
    Object.defineProperty(window, 'location', {
      value: {
        href: `http://localhost:8081/auth/callback?code=oauth_code&state=${stateParam}`,
        search: `?code=oauth_code&state=${stateParam}`,
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
        <AuthCallbackMinimal />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code');
    }, { timeout: 1000 });

    // Should redirect to signup completion page
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/signup/buyer?complete=true')
      );
    }, { timeout: 2000 });
  });

  it('should handle OAuth state parameter for signin flow', async () => {
    // Create secure OAuth state parameter for signin (32-character hex string)
    const stateParam = 'e5f6g7h8901234567890123456789abc'; // Mock secure state for creator signin

    // Clean callback URL with state parameter
    Object.defineProperty(window, 'location', {
      value: {
        href: `http://localhost:8081/auth/callback?code=oauth_code&state=${stateParam}`,
        search: `?code=oauth_code&state=${stateParam}`,
        origin: 'http://localhost:8081',
        assign: vi.fn()
      }
    });

    const { supabase } = await import('@/integrations/supabase/client');

    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { account_type: 'creator' }
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
        <AuthCallbackMinimal />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code');
    }, { timeout: 1000 });

    // Should redirect to creator dashboard
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/home')
      );
    }, { timeout: 2000 });
  });

  it('should fallback to URL parameters if state parameter is invalid', async () => {
    // Invalid state parameter that cannot be decoded
    const invalidStateParam = 'invalid_base64_state';

    // URL with both invalid state and fallback URL parameters
    Object.defineProperty(window, 'location', {
      value: {
        href: `http://localhost:8081/auth/callback?code=oauth_code&state=${invalidStateParam}&account_type=buyer&flow=signup`,
        search: `?code=oauth_code&state=${invalidStateParam}&account_type=buyer&flow=signup`,
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
        <AuthCallbackMinimal />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code');
    }, { timeout: 1000 });

    // Should still work using URL parameter fallback
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/signup/buyer?complete=true')
      );
    }, { timeout: 2000 });
  });

  it('should handle clean callback URL with only code parameter (no state, no URL params)', async () => {
    // Minimal clean callback URL - only the OAuth code
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:8081/auth/callback?code=oauth_code',
        search: '?code=oauth_code',
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
        <AuthCallbackMinimal />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code');
    }, { timeout: 1000 });

    // Should work with account type detection from user metadata
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should prioritize state parameter over URL parameters when both are present', async () => {
    // State parameter says creator/signup, URL parameters say buyer/signin
    const stateParam = 'i9j0k1l2345678901234567890123def'; // Mock secure state for creator signup

    Object.defineProperty(window, 'location', {
      value: {
        href: `http://localhost:8081/auth/callback?code=oauth_code&state=${stateParam}&account_type=buyer&flow=signin`,
        search: `?code=oauth_code&state=${stateParam}&account_type=buyer&flow=signin`,
        origin: 'http://localhost:8081',
        assign: vi.fn()
      }
    });

    const { supabase } = await import('@/integrations/supabase/client');

    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { account_type: 'creator' }
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
        <AuthCallbackMinimal />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code');
    }, { timeout: 1000 });

    // Should use state parameter values (creator/signup) not URL parameter values (buyer/signin)
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/signup/creator?complete=true')
      );
    }, { timeout: 2000 });
  });
});