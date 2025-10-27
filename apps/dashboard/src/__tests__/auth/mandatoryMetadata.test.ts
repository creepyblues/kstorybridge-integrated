/**
 * Mandatory Metadata Test Suite
 *
 * CRITICAL REQUIREMENT: Users MUST have account_type metadata after signup
 * If metadata write fails, signup MUST fail (no orphaned profiles)
 *
 * Related files:
 * - signupService.ts: completeOAuthProfile function
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
const mockUpdateUser = vi.fn();
const mockAuthUpdateUser = vi.fn();

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
  createBuyerProfileAtomic: vi.fn(),
  createCreatorProfileAtomic: vi.fn(),
}));

vi.mock('@/services/oauthProfileEdgeFunction', () => ({
  createOAuthProfileViaEdgeFunction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/services/emailService', () => ({
  sendWelcomeEmail: vi.fn(),
}));

vi.mock('@/utils/slack', () => ({
  notifyBuyerSignup: vi.fn(),
  notifyCreatorSignup: vi.fn(),
}));

// Import after mocking
const { completeOAuthProfile } = await import('@/components/auth/signupService');

describe('Mandatory Metadata - OAuth Signup', () => {
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
  });

  describe('CRITICAL: Metadata Write Must Succeed', () => {
    it('should BLOCK and AWAIT metadata write for buyer signup', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      const result = await completeOAuthProfile('buyer', buyerFormData, mockUser, mockSession);

      // Metadata update should be called
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: { account_type: 'buyer' },
      });

      // Should succeed after metadata write
      expect(result.success).toBe(true);
    });

    it('should BLOCK and AWAIT metadata write for creator signup', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      const result = await completeOAuthProfile('creator', creatorFormData, mockUser, mockSession);

      // Metadata update should be called
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: { account_type: 'creator' },
      });

      // Should succeed after metadata write
      expect(result.success).toBe(true);
    });

    it('should FAIL signup if metadata write fails (buyer)', async () => {
      // Mock metadata write failure
      mockUpdateUser.mockResolvedValue({
        error: new Error('Metadata update failed'),
      });

      const result = await completeOAuthProfile('buyer', buyerFormData, mockUser, mockSession);

      // Signup MUST fail
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to set account_type metadata');
      expect(result.error).toContain('signup aborted');
    });

    it('should FAIL signup if metadata write fails (creator)', async () => {
      // Mock metadata write failure
      mockUpdateUser.mockResolvedValue({
        error: new Error('Metadata update failed'),
      });

      const result = await completeOAuthProfile('creator', creatorFormData, mockUser, mockSession);

      // Signup MUST fail
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to set account_type metadata');
      expect(result.error).toContain('signup aborted');
    });

    it('should FAIL signup if metadata write throws exception (buyer)', async () => {
      // Mock metadata write exception
      mockUpdateUser.mockRejectedValue(new Error('Network error'));

      const result = await completeOAuthProfile('buyer', buyerFormData, mockUser, mockSession);

      // Signup MUST fail
      expect(result.success).toBe(false);
      expect(result.error).toContain('Exception during metadata write');
      expect(result.error).toContain('signup aborted');
    });

    it('should FAIL signup if metadata write throws exception (creator)', async () => {
      // Mock metadata write exception
      mockUpdateUser.mockRejectedValue(new Error('Network error'));

      const result = await completeOAuthProfile('creator', creatorFormData, mockUser, mockSession);

      // Signup MUST fail
      expect(result.success).toBe(false);
      expect(result.error).toContain('Exception during metadata write');
      expect(result.error).toContain('signup aborted');
    });
  });

  describe('CRITICAL: No Session = Signup Failure', () => {
    it('should FAIL buyer signup if no session available', async () => {
      // No session
      const result = await completeOAuthProfile('buyer', buyerFormData, mockUser, null);

      // Signup MUST fail
      expect(result.success).toBe(false);
      expect(result.error).toContain('OAuth session invalid');
      expect(result.error).toContain('cannot complete signup without account_type metadata');

      // Metadata update should NOT be called
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should FAIL creator signup if no session available', async () => {
      // No session
      const result = await completeOAuthProfile('creator', creatorFormData, mockUser, null);

      // Signup MUST fail
      expect(result.success).toBe(false);
      expect(result.error).toContain('OAuth session invalid');
      expect(result.error).toContain('cannot complete signup without account_type metadata');

      // Metadata update should NOT be called
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should FAIL buyer signup if session has no access token', async () => {
      // Session without access token
      const invalidSession = { user: mockUser };

      const result = await completeOAuthProfile('buyer', buyerFormData, mockUser, invalidSession as any);

      // Signup MUST fail
      expect(result.success).toBe(false);
      expect(result.error).toContain('OAuth session invalid');

      // Metadata update should NOT be called
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should FAIL creator signup if session has no access token', async () => {
      // Session without access token
      const invalidSession = { user: mockUser };

      const result = await completeOAuthProfile('creator', creatorFormData, mockUser, invalidSession as any);

      // Signup MUST fail
      expect(result.success).toBe(false);
      expect(result.error).toContain('OAuth session invalid');

      // Metadata update should NOT be called
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  describe('Success Only After Metadata Write', () => {
    it('should NOT return success until metadata is written (buyer)', async () => {
      let metadataWritten = false;

      mockUpdateUser.mockImplementation(async () => {
        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, 100));
        metadataWritten = true;
        return { error: null };
      });

      const result = await completeOAuthProfile('buyer', buyerFormData, mockUser, mockSession);

      // Verify metadata was written BEFORE success returned
      expect(metadataWritten).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should NOT return success until metadata is written (creator)', async () => {
      let metadataWritten = false;

      mockUpdateUser.mockImplementation(async () => {
        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, 100));
        metadataWritten = true;
        return { error: null };
      });

      const result = await completeOAuthProfile('creator', creatorFormData, mockUser, mockSession);

      // Verify metadata was written BEFORE success returned
      expect(metadataWritten).toBe(true);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error message for metadata write failure', async () => {
      mockUpdateUser.mockResolvedValue({
        error: new Error('Database connection lost'),
      });

      const result = await completeOAuthProfile('buyer', buyerFormData, mockUser, mockSession);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to set account_type metadata');
      expect(result.error).toContain('signup aborted to prevent orphaned profile');
    });

    it('should provide clear error message for missing session', async () => {
      const result = await completeOAuthProfile('creator', creatorFormData, mockUser, null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('OAuth session invalid');
      expect(result.error).toContain('cannot complete signup without account_type metadata');
    });

    it('should provide clear error message for exception', async () => {
      mockUpdateUser.mockRejectedValue(new Error('Unexpected error'));

      const result = await completeOAuthProfile('buyer', buyerFormData, mockUser, mockSession);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Exception during metadata write');
      expect(result.error).toContain('signup aborted to prevent orphaned profile');
    });
  });

  describe('No Orphaned Profiles', () => {
    it('should prevent orphaned profiles by failing before success', async () => {
      mockUpdateUser.mockResolvedValue({
        error: new Error('Metadata service unavailable'),
      });

      const result = await completeOAuthProfile('buyer', buyerFormData, mockUser, mockSession);

      // Profile may exist in database, but signup reports failure
      // This allows cleanup/retry logic
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should ensure metadata exists before completing signup', async () => {
      const metadataUpdates: string[] = [];

      mockUpdateUser.mockImplementation(async (options: any) => {
        metadataUpdates.push(options.data.account_type);
        return { error: null };
      });

      await completeOAuthProfile('buyer', buyerFormData, mockUser, mockSession);

      // Verify metadata was written
      expect(metadataUpdates).toContain('buyer');
      expect(metadataUpdates.length).toBeGreaterThan(0);
    });
  });
});
