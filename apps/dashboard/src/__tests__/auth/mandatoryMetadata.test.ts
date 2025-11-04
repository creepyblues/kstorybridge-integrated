/**
 * Non-Blocking Metadata Test Suite (Updated for PR #9)
 *
 * NEW STRATEGY (since PR #9):
 * - Metadata updates are NON-BLOCKING (fire-and-forget pattern)
 * - Signup SUCCEEDS even if metadata write fails
 * - RootRedirect has fallback logic to write metadata lazily if initial write fails
 *
 * This eliminates false timeouts while maintaining eventual metadata consistency.
 *
 * Related files:
 * - signupService.ts: completeOAuthProfile function (lines 114-138, 225-249)
 * - RootRedirect.tsx: Lazy metadata write fallback
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
const mockUpdateUser = vi.fn();
const mockCreateOAuthProfileViaEdgeFunction = vi.fn();
const mockCreateBuyerProfileAtomic = vi.fn();
const mockCreateCreatorProfileAtomic = vi.fn();
const mockSendWelcomeEmail = vi.fn();
const mockNotifyBuyerSignup = vi.fn();
const mockNotifyCreatorSignup = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: mockUpdateUser,
    },
  },
}));

// Mock other services
vi.mock('@/services/auth', () => ({
  authService: {
    signInWithOAuth: vi.fn(),
  },
}));

vi.mock('@/utils/atomicProfileCreator', () => ({
  createBuyerProfileAtomic: mockCreateBuyerProfileAtomic,
  createCreatorProfileAtomic: mockCreateCreatorProfileAtomic,
}));

vi.mock('@/services/oauthProfileEdgeFunction', () => ({
  createOAuthProfileViaEdgeFunction: mockCreateOAuthProfileViaEdgeFunction,
}));

vi.mock('@/services/emailService', () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

vi.mock('@/utils/slack', () => ({
  notifyBuyerSignup: mockNotifyBuyerSignup,
  notifyCreatorSignup: mockNotifyCreatorSignup,
}));

// Import after mocking
const { completeOAuthProfile } = await import('@/components/auth/signupService');

describe('Non-Blocking Metadata - OAuth Signup (PR #9)', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {},
  };

  const mockSession = {
    access_token: 'test-access-token',
    user: mockUser,
  };

  const buyerFormData = {
    email: 'test@example.com',
    password: '',
    full_name: 'Test Buyer',
    buyer_company: 'Test Company',
    buyer_role: 'producer',
    linkedin_url: '',
    tier: 'basic' as const,
  };

  const creatorFormData = {
    email: 'test@example.com',
    password: '',
    full_name: 'Test Creator',
    pen_name: 'Test Pen Name',
    ip_owner_role: 'author',
    ip_owner_company: '',
    website_url: '',
    invitation_status: 'invited' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock return values
    mockCreateOAuthProfileViaEdgeFunction.mockResolvedValue({
      success: true,
      profile: { id: 'test-user-id' }
    });

    mockCreateBuyerProfileAtomic.mockResolvedValue({
      success: true,
      profile: { id: 'test-user-id' }
    });

    mockCreateCreatorProfileAtomic.mockResolvedValue({
      success: true,
      profile: { id: 'test-user-id' }
    });

    mockUpdateUser.mockResolvedValue({ error: null });

    mockSendWelcomeEmail.mockResolvedValue(undefined);
    mockNotifyBuyerSignup.mockResolvedValue(undefined);
    mockNotifyCreatorSignup.mockResolvedValue(undefined);
  });

  describe('Non-Blocking Metadata Updates', () => {
    it('should attempt metadata write for buyer signup (non-blocking)', async () => {
      // Mock successful metadata write
      mockUpdateUser.mockResolvedValue({ error: null });

      const result = await completeOAuthProfile(buyerFormData, mockUser, mockSession);

      // Signup should succeed (profile created)
      expect(result.success).toBe(true);

      // Metadata update should be called (but not awaited)
      // Note: We can't verify .then() was used, but we verify updateUser was called
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: { account_type: 'buyer' },
      });
    });

    // Creator test removed - dashboard app now only handles buyer auth (creator auth moved to creator app)

    it('should SUCCEED signup even if metadata write fails (buyer)', async () => {
      // Mock metadata write failure
      mockUpdateUser.mockResolvedValue({
        error: new Error('Metadata update failed'),
      });

      const result = await completeOAuthProfile(buyerFormData, mockUser, mockSession);

      // NEW BEHAVIOR: Signup succeeds even if metadata fails
      // RootRedirect will write metadata lazily later
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    // Creator tests removed - dashboard app now only handles buyer auth

    it('should SUCCEED signup even if metadata write throws exception (buyer)', async () => {
      // Mock metadata write exception (network timeout, etc.)
      mockUpdateUser.mockRejectedValue(new Error('Network timeout'));

      const result = await completeOAuthProfile(buyerFormData, mockUser, mockSession);

      // NEW BEHAVIOR: Signup succeeds even if metadata times out
      // This prevents false failures from Supabase auth.updateUser() timeouts
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Signup Returns Immediately After Profile Creation', () => {
    it('should return success without waiting for metadata write (buyer)', async () => {
      // Mock slow metadata write (1 second delay)
      mockUpdateUser.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { error: null };
      });

      const startTime = Date.now();
      const result = await completeOAuthProfile(buyerFormData, mockUser, mockSession);
      const duration = Date.now() - startTime;

      // Should return quickly (< 500ms), not wait for 1-second metadata write
      expect(duration).toBeLessThan(500);
      expect(result.success).toBe(true);
    });

    // Creator test removed - dashboard app now only handles buyer auth
  });

  describe('Metadata Optimization (Fast Path)', () => {
    it('should attempt immediate metadata write for performance optimization', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      await completeOAuthProfile(buyerFormData, mockUser, mockSession);

      // Verify metadata write is attempted (optimization for fast path)
      // If successful, user has metadata immediately without waiting for RootRedirect
      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: { account_type: 'buyer' },
      });
    });
  });

  describe('RootRedirect Fallback Documentation', () => {
    it('documents that RootRedirect writes metadata if initial write fails', async () => {
      // This test documents the fallback behavior (tested in RootRedirect tests)
      mockUpdateUser.mockResolvedValue({
        error: new Error('Timeout'),
      });

      const result = await completeOAuthProfile(buyerFormData, mockUser, mockSession);

      // Signup succeeds without metadata
      expect(result.success).toBe(true);

      // DOCUMENTED BEHAVIOR (not tested here):
      // When user visits root URL, RootRedirect.tsx:
      // 1. Checks user metadata for account_type
      // 2. If missing, checks database tables (user_buyers/user_creators)
      // 3. Writes metadata from database (lazy fallback)
      // 4. Redirects to appropriate dashboard
      //
      // See: RootRedirect.tsx lines 46-82 (buyer), 84-127 (creator)
    });
  });

  describe('Profile Creation Failure (Still Blocks Signup)', () => {
    it('should FAIL signup if profile creation fails (buyer)', async () => {
      // Mock both edge function and atomic creator to fail
      mockCreateOAuthProfileViaEdgeFunction.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });
      mockCreateBuyerProfileAtomic.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      const result = await completeOAuthProfile(buyerFormData, mockUser, mockSession);

      // Profile creation failure BLOCKS signup (this is correct)
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Metadata update should NOT be called if profile creation fails
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    // Creator test removed - dashboard app now only handles buyer auth
  });
});
