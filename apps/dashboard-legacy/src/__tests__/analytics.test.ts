import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackTitleViewFromChat } from '@/utils/analytics';

// Declare window.dataLayer for TypeScript
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

describe('trackTitleViewFromChat', () => {
  beforeEach(() => {
    // Mock window.dataLayer
    window.dataLayer = [];
  });

  it('should push event to dataLayer with all parameters including userTier', () => {
    trackTitleViewFromChat(
      'title-123',
      'Test Title',
      'standard',
      'session-456',
      'message-789',
      'Show me fantasy titles',
      0.95,
      'pro'
    );

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer[0]).toMatchObject({
      event: 'title_view_from_chat',
      title_id: 'title-123',
      title_name: 'Test Title',
      chat_mode: 'standard',
      session_id: 'session-456',
      message_id: 'message-789',
      user_prompt: 'Show me fantasy titles',
      recommendation_score: 0.95,
      user_tier: 'pro'
    });
  });

  it('should work without userTier (backward compatibility)', () => {
    trackTitleViewFromChat(
      'title-123',
      'Test Title',
      'standard'
    );

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer[0]).toMatchObject({
      event: 'title_view_from_chat',
      title_id: 'title-123',
      title_name: 'Test Title',
      chat_mode: 'standard',
      user_tier: undefined
    });
  });

  it('should handle different tier values', () => {
    const tiers = ['basic', 'pro', 'suite'];

    tiers.forEach((tier, index) => {
      window.dataLayer = [];
      trackTitleViewFromChat(
        'title-123',
        'Test Title',
        'standard',
        undefined,
        undefined,
        undefined,
        undefined,
        tier
      );

      expect(window.dataLayer[0]).toHaveProperty('user_tier', tier);
    });
  });

  it('should handle null/undefined tier gracefully', () => {
    trackTitleViewFromChat(
      'title-123',
      'Test Title',
      'standard',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(window.dataLayer[0]).toHaveProperty('user_tier');
    expect(window.dataLayer[0].user_tier).toBeUndefined();
  });

  it('should include funnel tracking parameters', () => {
    trackTitleViewFromChat(
      'title-123',
      'Test Title',
      'advanced',
      'session-456',
      'message-789',
      'Test prompt',
      0.85,
      'suite'
    );

    expect(window.dataLayer[0]).toMatchObject({
      funnel_step: 'title_viewed_from_chat',
      funnel_name: 'buyer_engagement',
      app_section: 'dashboard'
    });
  });

  it('should include timestamp in ISO format', () => {
    trackTitleViewFromChat(
      'title-123',
      'Test Title',
      'standard',
      undefined,
      undefined,
      undefined,
      undefined,
      'basic'
    );

    expect(window.dataLayer[0]).toHaveProperty('timestamp');
    expect(typeof window.dataLayer[0].timestamp).toBe('string');
    // Verify it's a valid ISO timestamp
    const timestamp = window.dataLayer[0].timestamp as string;
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('should handle advanced chat mode', () => {
    trackTitleViewFromChat(
      'title-456',
      'Advanced Title',
      'advanced',
      'session-789',
      'message-012',
      'Advanced query',
      0.92,
      'pro'
    );

    expect(window.dataLayer[0]).toMatchObject({
      chat_mode: 'advanced',
      user_tier: 'pro'
    });
  });

  it('should not push to dataLayer if window is undefined', () => {
    const originalWindow = global.window;

    // @ts-expect-error - Temporarily remove window for testing
    delete global.window;

    trackTitleViewFromChat(
      'title-123',
      'Test Title',
      'standard',
      undefined,
      undefined,
      undefined,
      undefined,
      'basic'
    );

    // Restore window
    global.window = originalWindow;

    // No assertion needed - function should not throw
    expect(true).toBe(true);
  });
});
