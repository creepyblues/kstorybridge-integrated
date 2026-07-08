/**
 * EmailService Unit Tests
 *
 * Tests for the email sending service including:
 * - sendEmail (core function)
 * - sendWelcomeEmail
 * - sendPitchDeckRequestEmail
 * - sendContactCreatorMessage
 * - Deduplication logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EmailService,
  emailService,
  sendWelcomeEmail,
  triggerPremiumContentEmail,
  triggerContactAttemptEmail,
  triggerFirstSaveEmail,
} from './emailService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};
vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => mockSessionStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockSessionStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockSessionStorage[key];
  },
  clear: () => {
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  },
});

// Suppress console logs during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = EmailService.getInstance();
      const instance2 = EmailService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { messageId: 'msg-123' },
        error: null,
      });

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'Hello World',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: {
          to: 'test@example.com',
          subject: 'Test Email',
          text: 'Hello World',
        },
      });
    });

    it('should handle edge function error', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Service unavailable' },
      });

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service unavailable');
    });

    it('should handle exceptions', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network error'));

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct template data', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { messageId: 'welcome-123' },
        error: null,
      });

      const result = await emailService.sendWelcomeEmail({
        userName: 'John Doe',
        userEmail: 'john@example.com',
        accountType: 'buyer',
        dashboardUrl: 'https://dashboard.example.com',
        loginUrl: 'https://dashboard.example.com/signin',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('welcome-123');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: {
          to: 'john@example.com',
          subject: 'Welcome to KStoryBridge, John Doe! 🎉',
          template: 'welcome',
          templateData: {
            userName: 'John Doe',
            userEmail: 'john@example.com',
            accountType: 'buyer',
            dashboardUrl: 'https://dashboard.example.com',
            loginUrl: 'https://dashboard.example.com/signin',
          },
          from: 'KStoryBridge Team <welcome@kstorybridge.com>',
        },
      });
    });

    it('should use default URLs when not provided', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { messageId: 'welcome-456' },
        error: null,
      });

      await emailService.sendWelcomeEmail({
        userName: 'Jane',
        userEmail: 'jane@example.com',
        accountType: 'creator',
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: expect.objectContaining({
          templateData: expect.objectContaining({
            dashboardUrl: 'https://dashboard.kstorybridge.com',
            loginUrl: 'https://dashboard.kstorybridge.com/signin',
          }),
        }),
      });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Template not found' },
      });

      const result = await emailService.sendWelcomeEmail({
        userName: 'Test',
        userEmail: 'test@example.com',
        accountType: 'buyer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template not found');
    });
  });

  describe('sendPitchDeckRequestEmail', () => {
    it('should send pitch deck request to support', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { messageId: 'pitch-123' },
        error: null,
      });

      const result = await emailService.sendPitchDeckRequestEmail({
        requestorEmail: 'buyer@example.com',
        requestorName: 'Buyer Name',
        titleName: 'Amazing Webtoon',
        titleId: 'title-123',
        requestDate: '2025-12-14',
      });

      expect(result.success).toBe(true);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: expect.objectContaining({
          to: 'support@kstorybridge.com',
          subject: 'Pitch Deck Request: Amazing Webtoon',
          from: 'KStoryBridge <noreply@kstorybridge.com>',
        }),
      });
    });
  });

  describe('sendContactCreatorMessage', () => {
    it('should send contact creator message to support', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { messageId: 'contact-123' },
        error: null,
      });

      const result = await emailService.sendContactCreatorMessage({
        requestorEmail: 'buyer@example.com',
        requestorName: 'Interested Buyer',
        titleName: 'Great Title',
        titleId: 'title-456',
        message: 'I would like to discuss licensing opportunities.',
        requestDate: '2025-12-14',
      });

      expect(result.success).toBe(true);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: expect.objectContaining({
          to: 'support@kstorybridge.com',
          subject: 'Contact Request: Great Title',
        }),
      });
    });
  });
});

describe('sendWelcomeEmail (convenience function)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  });

  it('should send welcome email and store in sessionStorage', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { messageId: 'welcome-789' },
      error: null,
    });

    const result = await sendWelcomeEmail({
      userName: 'New User',
      userEmail: 'new@example.com',
      accountType: 'buyer',
    });

    expect(result.success).toBe(true);
    expect(mockSessionStorage['welcome_email_sent_new@example.com']).toBe('true');
  });

  it('should skip sending if already sent in session (deduplication)', async () => {
    // Mark as already sent
    mockSessionStorage['welcome_email_sent_existing@example.com'] = 'true';

    const result = await sendWelcomeEmail({
      userName: 'Existing User',
      userEmail: 'existing@example.com',
      accountType: 'buyer',
    });

    expect(result.success).toBe(true);
    expect(result.error).toBe('Already sent in this session');
    // Should not call edge function
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('should handle errors without throwing', async () => {
    vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network failure'));

    const result = await sendWelcomeEmail({
      userName: 'Test',
      userEmail: 'test@example.com',
      accountType: 'buyer',
    });

    // Should return error but not throw
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network failure');
  });
});

describe('Conversion and Engagement Email Triggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('triggerPremiumContentEmail', () => {
    it('should return success (currently disabled)', async () => {
      const result = await triggerPremiumContentEmail(
        'user-123',
        'user@example.com',
        'User Name',
        'basic',
        'Premium Title'
      );

      expect(result.success).toBe(true);
      expect(result.error).toContain('will be enabled in a future update');
    });
  });

  describe('triggerContactAttemptEmail', () => {
    it('should return success (currently disabled)', async () => {
      const result = await triggerContactAttemptEmail(
        'user-123',
        'user@example.com',
        'User Name',
        'basic'
      );

      expect(result.success).toBe(true);
      expect(result.error).toContain('will be enabled in a future update');
    });
  });

  describe('triggerFirstSaveEmail', () => {
    it('sends a celebration email via the send-email edge function', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { messageId: 'msg-1' },
        error: null,
      });

      const result = await triggerFirstSaveEmail('user-123', 'user@example.com', 'User Name', 'Test Title');

      expect(result.success).toBe(true);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Test Title'),
        }),
      });
    });

    it('dedupes: does not send twice for the same email', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { messageId: 'msg-2' },
        error: null,
      });

      await triggerFirstSaveEmail('user-456', 'dedupe@example.com', 'User Name');
      const callsAfterFirst = vi.mocked(supabase.functions.invoke).mock.calls.length;
      const result = await triggerFirstSaveEmail('user-456', 'dedupe@example.com', 'User Name');

      expect(result.success).toBe(true);
      expect(vi.mocked(supabase.functions.invoke).mock.calls.length).toBe(callsAfterFirst);
    });
  });
});
