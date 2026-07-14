import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getEmailCampaignAttribution,
  initializeEmailLandingEngagement,
  isAnalyticsCollectionAllowed,
} from './analytics';

beforeEach(() => {
  window.KSB_ANALYTICS_ENABLED = true;
  window.KSB_ANALYTICS_INTERNAL = false;
  window.dataLayer = [];
  window.history.replaceState({}, '', '/buyers?utm_source=brevo&utm_medium=email&utm_campaign=july_buyers');
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.KSB_ANALYTICS_ENABLED;
  delete window.KSB_ANALYTICS_INTERNAL;
  delete window.dataLayer;
});

describe('isAnalyticsCollectionAllowed', () => {
  it.each(['kstorybridge.com', 'www.kstorybridge.com'])(
    'allows website production host %s',
    hostname => {
      expect(isAnalyticsCollectionAllowed(hostname)).toBe(true);
    }
  );

  it.each([
    'localhost',
    '127.0.0.1',
    'website-staging.kstorybridge.com',
    'kstorybridge-website.vercel.app',
  ])('blocks non-production host %s by default', hostname => {
    expect(isAnalyticsCollectionAllowed(hostname)).toBe(false);
  });

  it('allows an explicit non-production override', () => {
    expect(isAnalyticsCollectionAllowed('localhost', true)).toBe(true);
  });
});

describe('getEmailCampaignAttribution', () => {
  it('recognizes an explicitly tagged email campaign', () => {
    expect(
      getEmailCampaignAttribution(
        '?utm_source=brevo&utm_medium=email&utm_campaign=buyer-weekly'
      )
    ).toEqual({
      campaignSource: 'brevo',
      campaignMedium: 'email',
      campaignName: 'buyer-weekly',
    });
  });

  it('does not classify ordinary referral or paid traffic as email', () => {
    expect(getEmailCampaignAttribution('?utm_source=linkedin&utm_medium=social')).toBeNull();
    expect(getEmailCampaignAttribution('?utm_source=google&utm_medium=cpc')).toBeNull();
  });

  it('does not return recipient identifiers or arbitrary campaign parameters', () => {
    const attribution = getEmailCampaignAttribution(
      '?utm_source=newsletter&utm_medium=email&utm_campaign=July%20Buyers' +
        '&utm_content=person@example.com&contact_id=secret'
    );

    expect(attribution).toEqual({
      campaignSource: 'newsletter',
      campaignMedium: 'email',
      campaignName: 'July_Buyers',
    });
    expect(JSON.stringify(attribution)).not.toContain('example.com');
    expect(JSON.stringify(attribution)).not.toContain('secret');
  });
});

describe('initializeEmailLandingEngagement', () => {
  it('does not emit merely because an email landing page loaded', () => {
    const cleanup = initializeEmailLandingEngagement();

    expect(window.dataLayer).toEqual([]);
    cleanup();
  });

  it('ignores untrusted scanner-like activity', () => {
    const listeners = new Map<string, EventListener>();
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      listeners.set(type, listener as EventListener);
    });

    const cleanup = initializeEmailLandingEngagement();
    listeners.get('pointerdown')?.(new Event('pointerdown'));

    expect(window.dataLayer).toEqual([]);
    cleanup();
  });

  it('emits once for the first trusted interaction with campaign-only metadata', () => {
    const listeners = new Map<string, EventListener>();
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      listeners.set(type, listener as EventListener);
    });

    const cleanup = initializeEmailLandingEngagement();
    const trustedPointer = { isTrusted: true, type: 'pointerdown' } as Event;
    listeners.get('pointerdown')?.(trustedPointer);
    listeners.get('keydown')?.({ isTrusted: true, type: 'keydown' } as Event);

    expect(window.dataLayer).toEqual([{
      event: 'email_landing_engaged',
      campaign_source: 'brevo',
      campaign_medium: 'email',
      campaign_name: 'july_buyers',
      landing_path: '/buyers',
      engagement_method: 'pointerdown',
      app_section: 'website',
      traffic_type: 'external',
    }]);
    expect(JSON.stringify(window.dataLayer)).not.toContain('@');
    expect(JSON.stringify(window.dataLayer)).not.toContain('recipient');
    expect(JSON.stringify(window.dataLayer)).not.toContain('contact_id');
    cleanup();
  });
});
