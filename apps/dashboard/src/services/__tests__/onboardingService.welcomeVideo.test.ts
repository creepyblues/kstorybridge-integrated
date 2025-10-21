/**
 * Unit Tests for Welcome Video Feature in OnboardingService
 *
 * Tests the new shouldShowWelcomeVideo() and markWelcomeVideoAsSeen() methods
 * to ensure they work correctly without breaking existing functionality.
 *
 * Test Coverage:
 * - New user sees video (no onboarding record)
 * - User who hasn't seen video sees it (has_seen_welcome_video = false)
 * - User who has seen video doesn't see it again (has_seen_welcome_video = true)
 * - markWelcomeVideoAsSeen() creates onboarding record if needed
 * - markWelcomeVideoAsSeen() updates existing record correctly
 * - Error handling for database failures
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OnboardingService } from '../onboardingService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('OnboardingService - Welcome Video Feature', () => {
  const mockUserId = 'test-user-123';
  const mockUserEmail = 'test@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('shouldShowWelcomeVideo()', () => {
    it('should return true for new user with no onboarding record', async () => {
      // Mock: No onboarding record exists
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });
      (supabase.from as any) = mockFrom;

      const result = await OnboardingService.shouldShowWelcomeVideo(mockUserId);

      expect(result).toBe(true);
    });

    it('should return true when has_seen_welcome_video is false', async () => {
      // Mock: Onboarding record exists, video not seen
      const mockStatus = {
        id: 'status-1',
        user_id: mockUserId,
        user_email: mockUserEmail,
        has_seen_welcome_video: false,
        onboarding_completed: false,
        skipped: false
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockStatus, error: null })
          })
        })
      });
      (supabase.from as any) = mockFrom;

      const result = await OnboardingService.shouldShowWelcomeVideo(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false when has_seen_welcome_video is true', async () => {
      // Mock: Onboarding record exists, video already seen
      const mockStatus = {
        id: 'status-1',
        user_id: mockUserId,
        user_email: mockUserEmail,
        has_seen_welcome_video: true,
        onboarding_completed: false,
        skipped: false
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockStatus, error: null })
          })
        })
      });
      (supabase.from as any) = mockFrom;

      const result = await OnboardingService.shouldShowWelcomeVideo(mockUserId);

      expect(result).toBe(false);
    });

    it('should return true when has_seen_welcome_video is undefined (migration not run)', async () => {
      // Mock: Onboarding record exists but doesn't have has_seen_welcome_video field yet
      const mockStatus = {
        id: 'status-1',
        user_id: mockUserId,
        user_email: mockUserEmail,
        onboarding_completed: false,
        skipped: false
        // has_seen_welcome_video is undefined (column doesn't exist yet)
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockStatus, error: null })
          })
        })
      });
      (supabase.from as any) = mockFrom;

      const result = await OnboardingService.shouldShowWelcomeVideo(mockUserId);

      // Should default to true (show video) when field is undefined
      expect(result).toBe(true);
    });

    it('should return false and log error on database failure', async () => {
      // Mock: Database error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      });
      (supabase.from as any) = mockFrom;

      const result = await OnboardingService.shouldShowWelcomeVideo(mockUserId);

      // Should return false on error (safer to not show)
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('markWelcomeVideoAsSeen()', () => {
    it('should update existing onboarding record', async () => {
      // Mock: Onboarding record exists
      const mockStatus = {
        id: 'status-1',
        user_id: mockUserId,
        user_email: mockUserEmail,
        has_seen_welcome_video: false
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'user_onboarding') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockStatus, error: null })
              })
            }),
            update: mockUpdate
          };
        }
        return {};
      });

      (supabase.from as any) = mockFrom;

      const result = await OnboardingService.markWelcomeVideoAsSeen(mockUserId, mockUserEmail);

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ has_seen_welcome_video: true });
    });

    it('should create onboarding record if it does not exist', async () => {
      // Mock: No onboarding record exists, need to create one
      let recordCreated = false;

      const mockFrom = vi.fn((table: string) => {
        if (table === 'user_onboarding') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: recordCreated ? { id: 'new-status', user_id: mockUserId } : null,
                  error: null
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockImplementation(() => {
                  recordCreated = true;
                  return Promise.resolve({
                    data: { id: 'new-status', user_id: mockUserId, user_email: mockUserEmail },
                    error: null
                  });
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          };
        }
        return {};
      });

      (supabase.from as any) = mockFrom;

      const result = await OnboardingService.markWelcomeVideoAsSeen(mockUserId, mockUserEmail);

      expect(result).toBe(true);
      expect(recordCreated).toBe(true);
    });

    it('should return false on database error', async () => {
      // Mock: Database error when updating
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'status-1', user_id: mockUserId },
              error: null
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Update failed' }
          })
        })
      });

      (supabase.from as any) = mockFrom;

      const result = await OnboardingService.markWelcomeVideoAsSeen(mockUserId, mockUserEmail);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Integration with existing onboarding methods', () => {
    it('should not break shouldShowOnboarding() when has_seen_welcome_video is added', async () => {
      // Mock: Onboarding record with new field
      const mockStatus = {
        id: 'status-1',
        user_id: mockUserId,
        user_email: mockUserEmail,
        has_seen_welcome_video: true, // New field
        onboarding_completed: false,
        skipped: false
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockStatus, error: null })
          })
        })
      });
      (supabase.from as any) = mockFrom;

      // This should still work correctly
      const result = await OnboardingService.shouldShowOnboarding(mockUserId);

      // Should show onboarding because not completed and not skipped
      expect(result).toBe(true);
    });
  });
});
