import { describe, expect, it } from 'vitest';
import { isAnalyticsCollectionAllowed, isInternalTrafficMetadata } from './analytics';

describe('isAnalyticsCollectionAllowed', () => {
  it('allows the creator production host', () => {
    expect(isAnalyticsCollectionAllowed('creator.kstorybridge.com')).toBe(true);
  });

  it.each([
    'localhost',
    '127.0.0.1',
    'creator-staging.kstorybridge.com',
    'kstorybridge-creator.vercel.app',
  ])('blocks non-production host %s by default', hostname => {
    expect(isAnalyticsCollectionAllowed(hostname)).toBe(false);
  });

  it('allows an explicit non-production override', () => {
    expect(isAnalyticsCollectionAllowed('localhost', true)).toBe(true);
  });
});

describe('isInternalTrafficMetadata', () => {
  it('trusts only the explicit boolean app_metadata flag', () => {
    expect(isInternalTrafficMetadata({ internal_traffic: true })).toBe(true);
    expect(isInternalTrafficMetadata({ internal_traffic: 'true' })).toBe(false);
    expect(isInternalTrafficMetadata({})).toBe(false);
    expect(isInternalTrafficMetadata(null)).toBe(false);
  });
});
