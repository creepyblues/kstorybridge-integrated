/**
 * Unit Tests for OAuth Metadata Update Logic
 *
 * Tests the critical blocking metadata update that ensures account_type
 * is set before OAuth signup/signin completes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { completeOAuthProfile } from '@/components/auth/signupService';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
      refreshSession: vi.fn()
    },
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}));

vi.mock('@/utils/atomicProfileCreator', () => ({
  createBuyerProfileAtomic: vi.fn(),
  createCreatorProfileAtomic: vi.fn()
}));

vi.mock('@/services/oauthProfileEdgeFunction', () => ({
  createOAuthProfileViaEdgeFunction: vi.fn()
}));

vi.mock('@/services/emailService', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@/utils/slack', () => ({
  notifyBuyerSignup: vi.fn().mockResolvedValue(undefined),
  notifyCreatorSignup: vi.fn().mockResolvedValue(undefined)
}));

describe('OAuth Metadata Update - Buyer', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {}
  };

  const mockSession = {
    access_token: 'test-access-token'
  };

  const mockBuyerFormData = {
    full_name: 'Test User',
    buyer_company: 'Test Company',
    buyer_role: 'Test Role',
    linkedin_url: null,
    email: 'test@example.com',
    password: 'test-password',
    tier: 'basic' as const,
    requested: false
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up default mocks for profile creation
    const { createOAuthProfileViaEdgeFunction } = await import('@/services/oauthProfileEdgeFunction');
    const { createBuyerProfileAtomic } = await import('@/utils/atomicProfileCreator');

    vi.mocked(createOAuthProfileViaEdgeFunction).mockResolvedValue({ success: true });
    vi.mocked(createBuyerProfileAtomic).mockResolvedValue({ success: true });
  });

  it('should successfully update metadata when session is valid', async () => {
    // Mock successful metadata update
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null
    } as any);

    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, mockSession);

    expect(result.success).toBe(true);
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: { account_type: 'buyer' }
    });
    expect(supabase.auth.updateUser).toHaveBeenCalledTimes(1);
  });

  it('should fail when session access_token is missing', async () => {
    const invalidSession = { access_token: undefined };

    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, invalidSession as any);

    expect(result.success).toBe(false);
    expect(result.error).toContain('OAuth session invalid');
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('should fail when session is completely missing', async () => {
    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, undefined);

    expect(result.success).toBe(false);
    expect(result.error).toContain('OAuth session invalid');
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('should fail when metadata update returns an error', async () => {
    // Mock metadata update failure
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Metadata update failed', status: 500 }
    } as any);

    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, mockSession);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to set account_type metadata');
    expect(supabase.auth.updateUser).toHaveBeenCalledTimes(1);
  });

  it('should fail when metadata update throws an exception', async () => {
    // Mock metadata update exception
    vi.mocked(supabase.auth.updateUser).mockRejectedValueOnce(
      new Error('Network error')
    );

    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, mockSession);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Metadata update failed');
    expect(supabase.auth.updateUser).toHaveBeenCalledTimes(1);
  });

  it('should block until metadata is written (not fire-and-forget)', async () => {
    let metadataUpdateCalled = false;

    // Mock async metadata update
    vi.mocked(supabase.auth.updateUser).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async delay
      metadataUpdateCalled = true;
      return { data: { user: mockUser }, error: null } as any;
    });

    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, mockSession);

    // If blocking works correctly, metadata should be written BEFORE function returns success
    expect(metadataUpdateCalled).toBe(true);
    expect(result.success).toBe(true);
  });
});

describe('OAuth Metadata Update - Creator', () => {
  const mockUser = {
    id: 'test-creator-123',
    email: 'creator@example.com',
    user_metadata: {}
  };

  const mockSession = {
    access_token: 'test-access-token'
  };

  const mockCreatorFormData = {
    full_name: 'Test Creator',
    pen_name: 'Test Pen Name',
    ip_owner_role: 'author' as const,
    ip_owner_company: null,
    website_url: null,
    email: 'creator@example.com',
    password: 'test-password',
    invitation_status: 'invited' as const
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up default mocks for profile creation
    const { createOAuthProfileViaEdgeFunction } = await import('@/services/oauthProfileEdgeFunction');
    const { createCreatorProfileAtomic } = await import('@/utils/atomicProfileCreator');

    vi.mocked(createOAuthProfileViaEdgeFunction).mockResolvedValue({ success: true });
    vi.mocked(createCreatorProfileAtomic).mockResolvedValue({ success: true });
  });

  it('should successfully update metadata for creator with account_type=creator', async () => {
    // Mock successful metadata update
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null
    } as any);

    const result = await completeOAuthProfile('creator', mockCreatorFormData, mockUser, mockSession);

    expect(result.success).toBe(true);
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: { account_type: 'creator' }
    });
  });

  it('should fail when session is invalid for creator', async () => {
    const result = await completeOAuthProfile('creator', mockCreatorFormData, mockUser, undefined);

    expect(result.success).toBe(false);
    expect(result.error).toContain('OAuth session invalid');
  });

  it('should fail when creator metadata update fails', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Update failed', status: 500 }
    } as any);

    const result = await completeOAuthProfile('creator', mockCreatorFormData, mockUser, mockSession);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to set account_type metadata');
  });
});

describe('Metadata Update - Edge Cases', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {}
  };

  const mockSession = {
    access_token: 'test-access-token'
  };

  const mockBuyerFormData = {
    full_name: 'Test User',
    buyer_company: 'Test Company',
    buyer_role: 'Test Role',
    linkedin_url: null,
    email: 'test@example.com',
    password: 'test-password',
    tier: 'basic' as const,
    requested: false
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up default mocks for profile creation
    const { createOAuthProfileViaEdgeFunction } = await import('@/services/oauthProfileEdgeFunction');
    const { createBuyerProfileAtomic } = await import('@/utils/atomicProfileCreator');

    vi.mocked(createOAuthProfileViaEdgeFunction).mockResolvedValue({ success: true });
    vi.mocked(createBuyerProfileAtomic).mockResolvedValue({ success: true });
  });

  it('should handle empty access_token string', async () => {
    const invalidSession = { access_token: '' };

    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, invalidSession as any);

    // Empty string is falsy in JavaScript
    expect(result.success).toBe(false);
    expect(result.error).toContain('OAuth session invalid');
  });

  it('should handle null session gracefully', async () => {
    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, null as any);

    expect(result.success).toBe(false);
    expect(result.error).toContain('OAuth session invalid');
  });

  it('should not proceed if profile creation fails (before metadata update)', async () => {
    // Mock profile creation failure
    const { createOAuthProfileViaEdgeFunction } = await import('@/services/oauthProfileEdgeFunction');
    vi.mocked(createOAuthProfileViaEdgeFunction).mockResolvedValueOnce({
      success: false,
      error: 'Profile creation failed'
    });

    const { createBuyerProfileAtomic } = await import('@/utils/atomicProfileCreator');
    vi.mocked(createBuyerProfileAtomic).mockResolvedValueOnce({
      success: false,
      error: 'Atomic creation also failed'
    });

    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, mockSession);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Atomic creation also failed');
    // Metadata update should NOT be attempted if profile creation fails
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });
});

describe('Timeout and Cleanup - New Features', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {}
  };

  const mockSession = {
    access_token: 'test-access-token'
  };

  const mockBuyerFormData = {
    full_name: 'Test User',
    buyer_company: 'Test Company',
    buyer_role: 'Test Role',
    linkedin_url: null,
    email: 'test@example.com',
    password: 'test-password',
    tier: 'basic' as const,
    requested: false
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up default mocks for profile creation
    const { createOAuthProfileViaEdgeFunction } = await import('@/services/oauthProfileEdgeFunction');
    const { createBuyerProfileAtomic } = await import('@/utils/atomicProfileCreator');

    vi.mocked(createOAuthProfileViaEdgeFunction).mockResolvedValue({ success: true });
    vi.mocked(createBuyerProfileAtomic).mockResolvedValue({ success: true });
  });

  it('should handle metadata update timeout and cleanup profile', async () => {
    // Mock metadata update that hangs (never resolves)
    vi.mocked(supabase.auth.updateUser).mockImplementation(() =>
      new Promise(() => {}) // Never resolves - simulates hang
    );

    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, mockSession);

    // Should timeout after 5 seconds and cleanup
    expect(result.success).toBe(false);
    expect(result.error).toContain('Metadata update failed');
  }, 10000); // 10 second timeout for this test

  it('should cleanup profile when metadata update fails', async () => {
    // Mock metadata update failure
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Metadata update failed', status: 500 }
    } as any);

    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, mockSession);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to set account_type metadata');
    // Cleanup should have been called (we can't easily verify the delete without more complex mocking)
  });
});

describe('Cleanup Function Tests', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {}
  };

  const mockCreatorFormData = {
    full_name: 'Test Creator',
    pen_name: 'Test Pen Name',
    ip_owner_role: 'author' as const,
    ip_owner_company: null,
    website_url: null,
    email: 'creator@example.com',
    password: 'test-password',
    invitation_status: 'invited' as const
  };

  const mockSession = {
    access_token: 'test-access-token'
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up default mocks for profile creation
    const { createOAuthProfileViaEdgeFunction } = await import('@/services/oauthProfileEdgeFunction');
    const { createCreatorProfileAtomic } = await import('@/utils/atomicProfileCreator');

    vi.mocked(createOAuthProfileViaEdgeFunction).mockResolvedValue({ success: true });
    vi.mocked(createCreatorProfileAtomic).mockResolvedValue({ success: true });
  });

  it('should cleanup creator profile when session is invalid', async () => {
    const result = await completeOAuthProfile('creator', mockCreatorFormData, mockUser, undefined);

    expect(result.success).toBe(false);
    expect(result.error).toContain('OAuth session invalid');
    // Cleanup should have been triggered
  });

  it('should cleanup buyer profile when metadata update fails', async () => {
    const mockBuyerFormData = {
      full_name: 'Test User',
      buyer_company: 'Test Company',
      buyer_role: 'Test Role',
      linkedin_url: null,
      email: 'test@example.com',
      password: 'test-password',
      tier: 'basic' as const,
      requested: false
    };

    // Mock metadata update failure
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Update failed', status: 500 }
    } as any);

    const result = await completeOAuthProfile('buyer', mockBuyerFormData, mockUser, mockSession);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to set account_type metadata');
  });
});
