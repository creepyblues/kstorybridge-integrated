import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getEmailCampaignAttribution,
  initializeEmailLandingEngagement,
  isAnalyticsCollectionAllowed,
  trackError,
  trackAudiencePathSelected,
  trackCreatorInquiryFailed,
  trackCreatorInquiryStarted,
  trackCreatorInquirySubmitted,
  trackFeaturePromoSelected,
  trackPageView,
  trackSigninCtaClicked,
  trackSignupCtaClicked,
  trackTrialCtaClicked,
  trackWebsiteEvent,
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

describe('website analytics privacy boundary', () => {
  it('strips page query strings and page titles', () => {
    trackPageView('/buyers?recipient=secret', 'Private Page Title');

    expect(window.dataLayer).toEqual([{
      event: 'page_view',
      page_location: `${window.location.origin}/buyers`,
      page_path: '/buyers',
      app_section: 'website',
    }]);
  });

  it('emits directly queryable acquisition events with controlled fields', () => {
    trackAudiencePathSelected('creator', 'hero');
    trackFeaturePromoSelected('comps_navigator');
    trackTrialCtaClicked('hero', 'chatbot');
    trackSignupCtaClicked('final_cta', 'producers_page');
    trackSigninCtaClicked('buyer', 'header_mobile');
    trackCreatorInquiryStarted('final_cta');
    trackCreatorInquirySubmitted();
    trackCreatorInquiryFailed();

    expect(window.dataLayer).toEqual([
      {
        event: 'audience_path_selected',
        account_type: 'creator',
        cta_position: 'hero',
        app_section: 'website',
      },
      {
        event: 'feature_promo_selected',
        account_type: 'buyer',
        feature_name: 'comps_navigator',
        cta_position: 'discovery_tools',
        app_section: 'website',
      },
      {
        event: 'trial_cta_clicked',
        account_type: 'buyer',
        cta_position: 'hero',
        source: 'chatbot',
        app_section: 'website',
      },
      {
        event: 'signup_cta_clicked',
        account_type: 'buyer',
        cta_position: 'final_cta',
        source: 'producers_page',
        app_section: 'website',
      },
      {
        event: 'signin_cta_clicked',
        account_type: 'buyer',
        cta_position: 'header_mobile',
        app_section: 'website',
      },
      {
        event: 'creator_inquiry_started',
        account_type: 'creator',
        cta_position: 'final_cta',
        source: 'creators_page',
        app_section: 'website',
      },
      {
        event: 'creator_inquiry_submitted',
        account_type: 'creator',
        source: 'creators_page_contact_form',
        app_section: 'website',
      },
      {
        event: 'creator_inquiry_failed',
        account_type: 'creator',
        source: 'creators_page_contact_form',
        app_section: 'website',
      },
    ]);
  });

  it('emits real website events while dropping slugs, names, and raw errors', () => {
    trackWebsiteEvent('title_page_view', {
      title_id: 'title-uuid',
      title_slug: 'confidential-working-title',
      title_name: 'Confidential Working Title',
      user_state: 'anonymous',
    });
    trackError('person@example.com failed at a private URL', 'public_title');

    expect(window.dataLayer).toEqual([
      {
        event: 'title_page_view',
        title_id: 'title-uuid',
        user_state: 'anonymous',
        app_section: 'website',
      },
      {
        event: 'custom_event',
        event_action: 'error',
        event_category: 'technical_issues',
        app_section: 'website',
      },
    ]);
    expect(JSON.stringify(window.dataLayer)).not.toContain('@');
    expect(JSON.stringify(window.dataLayer)).not.toContain('confidential');
  });
});
