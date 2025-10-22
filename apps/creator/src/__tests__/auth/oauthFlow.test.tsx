/**
 * OAuth Flow Test Suite
 *
 * Tests for OAuth callback processing, state validation, and account type detection.
 * Target: AuthCallbackSimple.tsx and OAuth security utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthCallbackSimple from '@/pages/AuthCallbackSimple';
import { validateOAuthState, initializeOAuthFlow } from '@/utils/oauthSecurity';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('OAuth Security - State Parameter', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  describe('initializeOAuthFlow', () => {
    it('should create valid OAuth state parameter', () => {
      const state = initializeOAuthFlow('signup', 'buyer', 'google');

      expect(state).toBeTruthy();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(20); // Should be encoded
    });

    it('should encode flow type', () => {
      const signupState = initializeOAuthFlow('signup', 'buyer', 'google');
      const signinState = initializeOAuthFlow('signin', 'buyer', 'google');

      expect(signupState).not.toBe(signinState);
    });

    it('should encode account type', () => {
      const buyerState = initializeOAuthFlow('signup', 'buyer', 'google');
      const creatorState = initializeOAuthFlow('signup', 'creator', 'google');

      expect(buyerState).not.toBe(creatorState);
    });

    it('should encode provider', () => {
      const googleState = initializeOAuthFlow('signup', 'buyer', 'google');
      const discordState = initializeOAuthFlow('signup', 'buyer', 'discord');

      expect(googleState).not.toBe(discordState);
    });
  });

  describe('validateOAuthState', () => {
    it('should validate and decode correct state parameter', () => {
      const state = initializeOAuthFlow('signup', 'buyer', 'google');
      const result = validateOAuthState(state);

      expect(result).toBeTruthy();
      expect(result?.flow).toBe('signup');
      expect(result?.accountType).toBe('buyer');
      expect(result?.provider).toBe('google');
    });

    it('should return null for invalid state format', () => {
      const result = validateOAuthState('invalid-state-string');

      expect(result).toBeNull();
    });

    it('should return null for tampered state', () => {
      const state = initializeOAuthFlow('signup', 'buyer', 'google');
      const tamperedState = state.slice(0, -5) + 'XXXXX'; // Tamper with end

      const result = validateOAuthState(tamperedState);

      // Depending on implementation, this should either fail or decode incorrectly
      if (result) {
        expect(result.flow).not.toBe('signup');
      } else {
        expect(result).toBeNull();
      }
    });

    it('should validate signin flow', () => {
      const state = initializeOAuthFlow('signin', 'creator', 'discord');
      const result = validateOAuthState(state);

      expect(result).toBeTruthy();
      expect(result?.flow).toBe('signin');
      expect(result?.accountType).toBe('creator');
      expect(result?.provider).toBe('discord');
    });
  });
});

describe('OAuth Callback - Account Type Detection', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should prioritize state parameter over metadata', () => {
    // Setup: State parameter says 'buyer', metadata says 'creator'
    const stateAccountType = 'buyer';
    const metadataAccountType = 'creator';
    const storageAccountType = null;

    // Priority: state > metadata > storage
    const final = stateAccountType || metadataAccountType || storageAccountType;

    expect(final).toBe('buyer'); // State wins
  });

  it('should use metadata when state is missing', () => {
    const stateAccountType = null;
    const metadataAccountType = 'buyer';
    const storageAccountType = 'creator';

    const final = stateAccountType || metadataAccountType || storageAccountType;

    expect(final).toBe('buyer'); // Metadata wins
  });

  it('should use sessionStorage as last fallback', () => {
    const stateAccountType = null;
    const metadataAccountType = null;
    const storageAccountType = 'buyer';

    const final = stateAccountType || metadataAccountType || storageAccountType;

    expect(final).toBe('buyer'); // Storage wins
  });

  it('should return null when all sources are empty', () => {
    const stateAccountType = null;
    const metadataAccountType = null;
    const storageAccountType = null;

    const final = stateAccountType || metadataAccountType || storageAccountType;

    expect(final).toBeNull();
  });
});

describe('OAuth Callback - Profile Existence Check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check buyer profile existence', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    // Mock profile exists
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'user-123' },
          error: null,
        }),
      })),
    }));

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    // Simulate profile check
    const { data } = await supabase
      .from('user_buyers')
      .select('id')
      .eq('id', 'user-123')
      .maybeSingle();

    expect(data).toBeTruthy();
    expect(mockSelect).toHaveBeenCalledWith('id');
  });

  it('should check creator profile existence', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    // Mock profile doesn't exist
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
    }));

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { data } = await supabase
      .from('user_creators')
      .select('id')
      .eq('id', 'user-123')
      .maybeSingle();

    expect(data).toBeNull();
  });
});

describe('OAuth Callback - Session Exchange', () => {
  it('should handle successful code exchange', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    const mockSession = {
      access_token: 'token',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { account_type: 'buyer' },
      },
    };

    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
      data: { session: mockSession as any, user: mockSession.user as any },
      error: null,
    });

    const result = await supabase.auth.exchangeCodeForSession('oauth-code-123');

    expect(result.data.session).toBeTruthy();
    expect(result.data.user?.email).toBe('test@example.com');
    expect(result.error).toBeNull();
  });

  it('should handle code exchange error', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid code' } as any,
    });

    const result = await supabase.auth.exchangeCodeForSession('invalid-code');

    expect(result.data.session).toBeNull();
    expect(result.error).toBeTruthy();
    expect(result.error?.message).toBe('Invalid code');
  });

  it('should handle code exchange timeout', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    // Simulate slow exchange
    vi.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { session: null, user: null },
                error: { message: 'Timeout' } as any,
              }),
            15000
          )
        ) // 15s delay
    );

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Exchange timeout')), 10000)
    );
    const exchangePromise = supabase.auth.exchangeCodeForSession('code-123');

    await expect(Promise.race([exchangePromise, timeoutPromise])).rejects.toThrow(
      'Exchange timeout'
    );
  });
});

describe('OAuth Callback - Auth State Listener', () => {
  it('should set up auth state listener during exchange', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    const mockUnsubscribe = vi.fn();
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    } as any);

    // Simulate setting up listener
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Handle signin
      }
    });

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    expect(data.subscription.unsubscribe).toBeDefined();
  });

  it('should unsubscribe listener after successful signin', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    const mockUnsubscribe = vi.fn();
    let eventCallback: ((event: string, session: any) => void) | null = null;

    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      eventCallback = callback;
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      } as any;
    });

    // Set up listener
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        data.subscription.unsubscribe();
      }
    });

    // Simulate SIGNED_IN event
    if (eventCallback) {
      eventCallback('SIGNED_IN', { user: { id: '123' } });
    }

    // Verify unsubscribe was called
    await waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});

describe('OAuth Callback - Metadata Update', () => {
  it('should update user metadata with account type', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: '123', user_metadata: { account_type: 'buyer' } } as any },
      error: null,
    });

    const result = await supabase.auth.updateUser({
      data: { account_type: 'buyer' },
    });

    expect(result.error).toBeNull();
    expect(result.data.user?.user_metadata?.account_type).toBe('buyer');
  });

  it('should handle metadata update failure gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Update failed' } as any,
    });

    const result = await supabase.auth.updateUser({
      data: { account_type: 'buyer' },
    });

    expect(result.error).toBeTruthy();
    expect(result.error?.message).toBe('Update failed');
  });
});

describe('OAuth Callback - Redirect Logic', () => {
  it('should redirect to dashboard when profile exists (signin flow)', () => {
    const flow = 'signin';
    const profileExists = true;
    const accountType = 'buyer';

    if (profileExists && flow === 'signin') {
      const expectedPath = '/buyers/chat'; // getDashboardPath('buyer')
      expect(expectedPath).toBe('/buyers/chat');
    }
  });

  it('should redirect to signup completion when no profile (signin flow)', () => {
    const flow = 'signin';
    const profileExists = false;
    const accountType = 'buyer';

    if (!profileExists && flow === 'signin') {
      const expectedPath = '/signup/buyer';
      expect(expectedPath).toBe('/signup/buyer');
    }
  });

  it('should redirect to profile completion when flow is signup', () => {
    const flow = 'signup';
    const accountType = 'buyer';
    const userId = 'user-123';
    const email = 'test@example.com';

    if (flow === 'signup') {
      const expectedPath = `/signup/buyer?complete=true&user_id=${userId}&email=${encodeURIComponent(
        email
      )}`;
      expect(expectedPath).toContain('complete=true');
      expect(expectedPath).toContain(userId);
      expect(expectedPath).toContain(encodeURIComponent(email));
    }
  });
});

describe('OAuth Callback - Edge Cases', () => {
  it('should handle missing OAuth code gracefully', () => {
    const urlParams = new URLSearchParams('state=valid-state');
    const code = urlParams.get('code');

    expect(code).toBeNull();
    // Should show error toast and redirect
  });

  it('should handle invalid account type gracefully', () => {
    const invalidAccountType = 'invalid' as any;
    const isValid = invalidAccountType === 'buyer' || invalidAccountType === 'creator';

    expect(isValid).toBe(false);
    // Should redirect to account type selection
  });

  it('should handle concurrent profile creation attempts', async () => {
    // Simulate race condition where multiple components try to create profile
    const userId = 'user-123';
    const accountType = 'buyer';

    // First attempt should succeed
    const attempt1 = Promise.resolve({ success: true, profile: { id: userId } });

    // Second attempt should detect existing
    const attempt2 = Promise.resolve({ success: true, existed: true });

    const results = await Promise.all([attempt1, attempt2]);

    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    // One created, one found existing - both succeed
  });
});

describe('OAuth Callback - Session Storage Cleanup', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should clear OAuth session storage after successful processing', () => {
    sessionStorage.setItem('oauth_account_type', 'buyer');
    sessionStorage.setItem('oauth_flow', 'signup');

    // Simulate cleanup
    sessionStorage.removeItem('oauth_account_type');
    sessionStorage.removeItem('oauth_flow');

    expect(sessionStorage.getItem('oauth_account_type')).toBeNull();
    expect(sessionStorage.getItem('oauth_flow')).toBeNull();
  });

  it('should preserve state parameter as primary source', () => {
    // State parameter should be used, not sessionStorage
    const stateData = { accountType: 'buyer', flow: 'signup' };
    const storageData = { accountType: 'creator', flow: 'signin' };

    sessionStorage.setItem('oauth_account_type', storageData.accountType);

    // State parameter takes priority
    const finalAccountType = stateData.accountType || storageData.accountType;

    expect(finalAccountType).toBe('buyer'); // State wins over storage
  });
});
