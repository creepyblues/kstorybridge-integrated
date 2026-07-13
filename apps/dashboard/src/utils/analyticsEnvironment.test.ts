import { describe, expect, it } from 'vitest';
import { isAnalyticsCollectionAllowed, isInternalTrafficMetadata } from './analytics';

describe('isAnalyticsCollectionAllowed', () => {
  it('allows the buyer production host', () => {
    expect(isAnalyticsCollectionAllowed('dashboard.kstorybridge.com')).toBe(true);
  });

  it.each([
    'localhost',
    '127.0.0.1',
    'dashboard-staging.kstorybridge.com',
    'kstorybridge-dashboard.vercel.app',
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
