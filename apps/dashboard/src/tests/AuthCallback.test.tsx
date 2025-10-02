import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthCallbackPageFixed from '../pages/AuthCallbackPageFixed';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

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

describe('AuthCallbackPageFixed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state', () => {
    render(
      <BrowserRouter>
        <AuthCallbackPageFixed />
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

    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null
    });

    render(
      <BrowserRouter>
        <AuthCallbackPageFixed />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code');
    }, { timeout: 10000 });

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/signup/buyer?complete=true')
      );
    }, { timeout: 15000 });
  });

  it('should handle OAuth exchange failure', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    supabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: null,
      error: { message: 'OAuth exchange failed', code: 'oauth_error' }
    });

    render(
      <BrowserRouter>
        <AuthCallbackPageFixed />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin?error=oauth_failed');
    }, { timeout: 10000 });
  });

  it('should handle no user found after processing', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    // Mock all session methods to return null/empty
    supabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });

    localStorageMock.getItem.mockReturnValue(null);

    render(
      <BrowserRouter>
        <AuthCallbackPageFixed />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin?error=no_user');
    }, { timeout: 20000 }); // Longer timeout since it tries many methods
  });

  it('should handle existing session from localStorage', async () => {
    const mockStoredSession = {
      currentSession: {
        user: {
          id: 'user123',
          email: 'test@example.com',
          user_metadata: { account_type: 'buyer' }
        },
        access_token: 'stored_token'
      }
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredSession));

    const { supabase } = await import('@/integrations/supabase/client');
    supabase.auth.updateUser.mockResolvedValue({
      data: { user: mockStoredSession.currentSession.user },
      error: null
    });
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockStoredSession.currentSession.user },
      error: null
    });

    render(
      <BrowserRouter>
        <AuthCallbackPageFixed />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/signup/buyer?complete=true')
      );
    }, { timeout: 10000 });
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

    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null
    });

    render(
      <BrowserRouter>
        <AuthCallbackPageFixed />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/buyers/home')
      );
    }, { timeout: 10000 });
  });
});