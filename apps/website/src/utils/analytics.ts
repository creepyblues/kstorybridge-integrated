// Google Tag Manager utility functions for the website

import {
  ANALYTICS_EVENT_NAMES,
  sanitizeAnalyticsEventParams,
} from '@kstorybridge/analytics';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    KSB_ANALYTICS_ENABLED?: boolean;
    KSB_ANALYTICS_INTERNAL?: boolean;
  }
}

// Google Tag Manager Container ID
const GTM_CONTAINER_ID = 'GTM-PZBC4XQT';

export const isAnalyticsCollectionAllowed = (
  hostname: string,
  allowNonProduction = false
): boolean => /^(www\.)?kstorybridge\.com$/i.test(hostname) || allowNonProduction;

const isAnalyticsEnabled = (): boolean =>
  typeof window !== 'undefined' && window.KSB_ANALYTICS_ENABLED === true;

const pushAnalyticsEvent = (event: string, params: Record<string, unknown>): void => {
  if (!isAnalyticsEnabled() || !window.dataLayer) return;
  window.dataLayer.push({
    event,
    ...sanitizeAnalyticsEventParams(event, params),
  });
};

export interface EmailCampaignAttribution {
  campaignSource: string;
  campaignMedium: string;
  campaignName: string;
}

const sanitizeCampaignValue = (value: string | null): string =>
  (value || 'not_set')
    .trim()
    .slice(0, 100)
    .replace(/[^a-zA-Z0-9._-]+/g, '_');

/**
 * Returns only campaign-level attribution. Recipient IDs, email addresses,
 * arbitrary query parameters, and utm_content are intentionally excluded.
 */
export const getEmailCampaignAttribution = (
  search: string
): EmailCampaignAttribution | null => {
  const params = new URLSearchParams(search);
  const source = (params.get('utm_source') || '').toLowerCase();
  const medium = (params.get('utm_medium') || '').toLowerCase();
  const isEmailCampaign =
    medium === 'email' ||
    medium === 'newsletter' ||
    /(^|[-_.])(email|newsletter|brevo|sendinblue)([-_.]|$)/.test(source);

  if (!isEmailCampaign) return null;

  return {
    campaignSource: sanitizeCampaignValue(source),
    campaignMedium: sanitizeCampaignValue(medium),
    campaignName: sanitizeCampaignValue(params.get('utm_campaign')),
  };
};

/**
 * Records a conservative human-email-engagement signal only after a trusted
 * pointer, keyboard, or scroll interaction on an email-attributed landing.
 * A scanner page load by itself never satisfies this measure.
 */
export const initializeEmailLandingEngagement = (): (() => void) => {
  if (!isAnalyticsEnabled() || typeof window === 'undefined' || !window.dataLayer) {
    return () => undefined;
  }

  const attribution = getEmailCampaignAttribution(window.location.search);
  if (!attribution) return () => undefined;

  let recorded = false;
  const eventTypes: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll'];

  const recordEngagement = (event: Event): void => {
    if (recorded || !event.isTrusted) return;
    recorded = true;

    pushAnalyticsEvent(ANALYTICS_EVENT_NAMES.emailLandingEngaged, {
      campaign_source: attribution.campaignSource,
      campaign_medium: attribution.campaignMedium,
      campaign_name: attribution.campaignName,
      landing_path: window.location.pathname,
      engagement_method: event.type,
      app_section: 'website',
      traffic_type: window.KSB_ANALYTICS_INTERNAL ? 'internal' : 'external',
    });

    eventTypes.forEach(type => window.removeEventListener(type, recordEngagement));
  };

  eventTypes.forEach(type => window.addEventListener(type, recordEngagement, { passive: true }));

  return () => {
    eventTypes.forEach(type => window.removeEventListener(type, recordEngagement));
  };
};

// Initialize Google Tag Manager (GTM is loaded directly in HTML)
export const initGA = () => {
  if (isAnalyticsEnabled() && window.dataLayer) {
    // GTM is initialized via the script in HTML
    // Push initial configuration to dataLayer
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      'event': 'gtm.js',
      'app_name': 'website',
      'app_version': '1.0.0'
    });
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  pushAnalyticsEvent('page_view', {
    page_title: title || document.title,
    page_location: window.location.href,
    page_path: path,
    app_section: 'website',
  });
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  pushAnalyticsEvent('custom_event', {
    event_action: action,
    event_category: category,
    event_label: label,
    event_value: value,
    app_section: 'website',
  });
};

// Track user interactions specific to website
export const trackWebsiteEvent = (action: string, details?: Record<string, unknown>) => {
  pushAnalyticsEvent(action, {
    ...details,
    app_section: 'website',
  });
};

// Track navigation events
export const trackNavigation = (destination: string, source?: string) => {
  trackEvent('navigation', 'user_flow', `${source || 'unknown'} -> ${destination}`);
};

// Track button clicks
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('button_click', 'engagement', `${buttonName} (${location})`);
};

export type WebsiteAudience = 'buyer' | 'creator';
export type WebsiteCtaPosition =
  | 'header_desktop'
  | 'header_mobile'
  | 'hero'
  | 'final_cta';
export type WebsiteFeature = 'chatbot' | 'comps_navigator' | 'mandate_matcher';

export const trackAudiencePathSelected = (
  accountType: WebsiteAudience,
  ctaPosition: WebsiteCtaPosition
) => {
  trackWebsiteEvent(ANALYTICS_EVENT_NAMES.audiencePathSelected, {
    account_type: accountType,
    cta_position: ctaPosition,
  });
};

export const trackFeaturePromoSelected = (featureName: WebsiteFeature) => {
  trackWebsiteEvent(ANALYTICS_EVENT_NAMES.featurePromoSelected, {
    account_type: 'buyer',
    feature_name: featureName,
    cta_position: 'discovery_tools',
  });
};

export const trackTrialCtaClicked = (
  ctaPosition: Extract<WebsiteCtaPosition, 'hero' | 'final_cta'>,
  source: 'producers_page' | WebsiteFeature
) => {
  trackWebsiteEvent(ANALYTICS_EVENT_NAMES.trialCtaClicked, {
    account_type: 'buyer',
    cta_position: ctaPosition,
    source,
  });
};

export const trackSignupCtaClicked = (
  ctaPosition: Extract<WebsiteCtaPosition, 'hero' | 'final_cta'>,
  source: 'producers_page' | WebsiteFeature
) => {
  trackWebsiteEvent(ANALYTICS_EVENT_NAMES.signupCtaClicked, {
    account_type: 'buyer',
    cta_position: ctaPosition,
    source,
  });
};

export const trackSigninCtaClicked = (
  accountType: WebsiteAudience,
  ctaPosition: Extract<WebsiteCtaPosition, 'header_desktop' | 'header_mobile'>
) => {
  trackWebsiteEvent(ANALYTICS_EVENT_NAMES.signinCtaClicked, {
    account_type: accountType,
    cta_position: ctaPosition,
  });
};

export const trackCreatorInquiryStarted = (
  ctaPosition: Extract<WebsiteCtaPosition, 'hero' | 'final_cta'>
) => {
  trackWebsiteEvent(ANALYTICS_EVENT_NAMES.creatorInquiryStarted, {
    account_type: 'creator',
    cta_position: ctaPosition,
    source: 'creators_page',
  });
};

export const trackCreatorInquirySubmitted = () => {
  trackWebsiteEvent(ANALYTICS_EVENT_NAMES.creatorInquirySubmitted, {
    account_type: 'creator',
    source: 'creators_page_contact_form',
  });
};

export const trackCreatorInquiryFailed = () => {
  trackWebsiteEvent(ANALYTICS_EVENT_NAMES.creatorInquiryFailed, {
    account_type: 'creator',
    source: 'creators_page_contact_form',
  });
};

// Track signup events
export const trackSignup = (userType: 'buyer' | 'creator', method?: string) => {
  pushAnalyticsEvent('sign_up', {
    method: method || 'email',
    user_type: userType,
    app_section: 'website',
  });
};

// Track login events
export const trackLogin = (method?: string) => {
  pushAnalyticsEvent('login', {
    method: method || 'email',
    app_section: 'website',
  });
};

// Track language changes
export const trackLanguageChange = (from: string, to: string) => {
  trackEvent('language_change', 'user_preference', `${from} -> ${to}`);
};

// Track form submissions
export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent('form_submit', 'conversion', formName, success ? 1 : 0);
};

// Track link clicks (external)
export const trackExternalLink = (url: string, linkText?: string) => {
  trackEvent('external_link_click', 'outbound', linkText || url);
};

// Track scroll depth
export const trackScrollDepth = (percentage: number) => {
  trackEvent('scroll_depth', 'engagement', `${percentage}%`, percentage);
};

// Track errors
export const trackError = (errorMessage: string, errorLocation: string) => {
  trackEvent('error', 'technical_issues', `${errorLocation}: ${errorMessage}`);
};
