import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase before importing auth module
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockInvoke = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: any[]) => mockSignUp(...args),
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signInWithOAuth: (...args: any[]) => mockSignInWithOAuth(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
      getUser: (...args: any[]) => mockGetUser(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
    },
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
  },
}));

// Import after mocks are set up
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithOAuth,
  completeOAuthProfile,
  signOut,
  lookupBuyerProfile,
  getCurrentUser,
  resetPassword,
  updatePassword,
} from './auth';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('signUpWithEmail', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const testMetadata = {
      full_name: 'Test User',
      buyer_company: 'Test Company',
      buyer_role: 'producer',
    };

    it('should successfully sign up a new user', async () => {
      const mockUser = { id: 'user-123', email: testEmail };
      const mockSession = { access_token: 'token-123' };

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      mockInvoke.mockResolvedValue({ error: null });

      const result = await signUpWithEmail(testEmail, testPassword, testMetadata);

      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);

      // Verify signUp was called with correct parameters
      expect(mockSignUp).toHaveBeenCalledWith({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            account_type: 'buyer',
            full_name: testMetadata.full_name,
            newsletter_consent: false,
          },
        },
      });

      // Verify profile creation was called
      expect(mockInvoke).toHaveBeenCalledWith('create-buyer-profile', {
        body: {
          user_id: mockUser.id,
          email: testEmail.toLowerCase(),
          full_name: testMetadata.full_name,
          buyer_company: testMetadata.buyer_company,
          buyer_role: testMetadata.buyer_role,
          linkedin_url: undefined,
          tier: 'basic',
          trial_session_id: undefined,
          newsletter_consent: false,
        },
      });
    });

    it('should throw error when signup fails', async () => {
      // A non-duplicate auth failure still throws (duplicates are handled separately below)
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Network request failed' },
      });

      await expect(signUpWithEmail(testEmail, testPassword, testMetadata)).rejects.toThrow();
    });

    it('should throw error when no user is returned', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      await expect(signUpWithEmail(testEmail, testPassword, testMetadata)).rejects.toThrow(
        'Signup failed - no user returned'
      );
    });

    it('should throw error when profile creation fails', async () => {
      const mockUser = { id: 'user-123', email: testEmail };
      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });
      mockInvoke.mockResolvedValue({
        error: { message: 'Profile creation failed' },
      });

      await expect(signUpWithEmail(testEmail, testPassword, testMetadata)).rejects.toThrow(
        'Profile creation failed'
      );
    });

    it('should allow all email domains (no work email restriction)', async () => {
      const gmailUser = { id: 'user-123', email: 'test@gmail.com' };
      mockSignUp.mockResolvedValue({
        data: { user: gmailUser, session: null },
        error: null,
      });
      mockInvoke.mockResolvedValue({ error: null });

      // Gmail should NOT throw error (no domain restriction)
      const result = await signUpWithEmail('test@gmail.com', testPassword, testMetadata);
      expect(result.user).toEqual(gmailUser);
    });
  });

  describe('signInWithEmail', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token-123' };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
    });

    it('should throw error when credentials are invalid', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(signInWithEmail('test@example.com', 'wrongpassword')).rejects.toThrow();
    });
  });

  describe('signInWithOAuth', () => {
    it('should initiate OAuth flow and store context in sessionStorage', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      await signInWithOAuth('buyer', 'signup');

      // Verify sessionStorage was set
      expect(sessionStorage.getItem('oauth_account_type')).toBe('buyer');
      expect(sessionStorage.getItem('oauth_flow')).toBe('signup');

      // Verify OAuth was called with correct parameters (no URL params per CLAUDE.md)
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      });
    });

    it('should throw error when OAuth initiation fails', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider unavailable' },
      });

      await expect(signInWithOAuth()).rejects.toThrow();
    });

    it('should use correct callback URL without parameters', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      await signInWithOAuth('buyer', 'signin');

      const callArg = mockSignInWithOAuth.mock.calls[0][0];
      const redirectUrl = callArg.options.redirectTo;

      // URL should NOT contain query parameters
      expect(redirectUrl).not.toContain('?');
      expect(redirectUrl).not.toContain('account_type');
      expect(redirectUrl).toContain('/auth/callback');
    });
  });

  describe('completeOAuthProfile', () => {
    const testUserId = 'user-123';
    const testEmail = 'test@example.com';
    const testMetadata = {
      full_name: 'Test User',
      buyer_company: 'Test Company',
      buyer_role: 'producer',
    };

    it('should create profile via edge function', async () => {
      mockInvoke.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: null });

      const result = await completeOAuthProfile(testUserId, testEmail, testMetadata, {
        access_token: 'token-123',
      });

      expect(result.success).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('create-buyer-profile', {
        body: {
          user_id: testUserId,
          email: testEmail.toLowerCase(),
          full_name: testMetadata.full_name,
          buyer_company: testMetadata.buyer_company,
          buyer_role: testMetadata.buyer_role,
          linkedin_url: undefined,
          tier: 'basic',
          trial_session_id: undefined,
          newsletter_consent: false,
        },
      });
    });

    it('should update user metadata when session is available', async () => {
      mockInvoke.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: null });

      await completeOAuthProfile(testUserId, testEmail, testMetadata, {
        access_token: 'token-123',
      });

      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: { account_type: 'buyer', newsletter_consent: false },
      });
    });

    it('should NOT update metadata when no session', async () => {
      mockInvoke.mockResolvedValue({ error: null });

      await completeOAuthProfile(testUserId, testEmail, testMetadata);

      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should handle updateUser error gracefully (non-blocking)', async () => {
      mockInvoke.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({
        error: { message: 'Failed to update user' },
      });

      // Should NOT throw - metadata update errors are logged but don't block
      const result = await completeOAuthProfile(testUserId, testEmail, testMetadata, {
        access_token: 'token-123',
      });

      expect(result.success).toBe(true);
    });

    it('should throw error when profile creation fails', async () => {
      mockInvoke.mockResolvedValue({
        error: { message: 'Profile creation failed' },
      });

      await expect(
        completeOAuthProfile(testUserId, testEmail, testMetadata)
      ).rejects.toThrow('Profile creation failed');
    });
  });

  describe('signOut', () => {
    it('should sign out user and clear sessionStorage', async () => {
      sessionStorage.setItem('oauth_account_type', 'buyer');
      sessionStorage.setItem('oauth_flow', 'signup');

      mockSignOut.mockResolvedValue({ error: null });

      await signOut();

      expect(mockSignOut).toHaveBeenCalled();
      expect(sessionStorage.getItem('oauth_account_type')).toBeNull();
      expect(sessionStorage.getItem('oauth_flow')).toBeNull();
    });

    it('should throw error when sign out fails', async () => {
      mockSignOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      await expect(signOut()).rejects.toThrow();
    });
  });

  describe('lookupBuyerProfile (three-state)', () => {
    it("returns 'exists' when the profile row is present", async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-123' }, error: null });
      expect(await lookupBuyerProfile('user-123')).toBe('exists');
    });

    it("returns 'missing' when there is no row", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      expect(await lookupBuyerProfile('user-123')).toBe('missing');
    });

    it("returns 'error' (never 'missing') on a database error", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      expect(await lookupBuyerProfile('user-123')).toBe('error');
    });

    it("returns 'error' (never 'missing') on timeout", async () => {
      vi.useFakeTimers();
      try {
        mockMaybeSingle.mockImplementation(() => new Promise(() => {})); // never resolves
        const pending = lookupBuyerProfile('user-123');
        await vi.advanceTimersByTimeAsync(10_001);
        expect(await pending).toBe('error');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('signUpWithEmail duplicate-email handling', () => {
    const meta = { full_name: 'Dup User' };

    it("returns status 'duplicate' and skips profile creation on the obfuscated fake-user response", async () => {
      // Hosted shape (enumeration protection on): random id, identities: [], no session, no error
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'fake-id', email: 'dup@example.com', identities: [] }, session: null },
        error: null,
      });

      const result = await signUpWithEmail('dup@example.com', 'password123', meta);

      expect(result.status).toBe('duplicate');
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it("returns status 'duplicate' on an explicit user_already_exists error", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: 'user_already_exists', message: 'User already registered' },
      });

      const result = await signUpWithEmail('dup@example.com', 'password123', meta);

      expect(result.status).toBe('duplicate');
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it("treats a real confirmation-required signup (identities present, no session) as 'created'", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'real-id', email: 'new@example.com', identities: [{ provider: 'email' }] }, session: null },
        error: null,
      });
      mockInvoke.mockResolvedValue({ error: null });

      const result = await signUpWithEmail('new@example.com', 'password123', meta);

      expect(result.status).toBe('created');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null when no user is logged in', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      await resetPassword('test@example.com');

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/reset-password'),
      });
    });

    it('should throw error when reset fails', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: 'Email not found' },
      });

      await expect(resetPassword('test@example.com')).rejects.toThrow();
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      await updatePassword('newpassword123');

      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });

    it('should throw error when password update fails', async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: 'Password too weak' },
      });

      await expect(updatePassword('weak')).rejects.toThrow();
    });
  });
});
