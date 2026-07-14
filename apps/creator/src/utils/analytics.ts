/**
 * Analytics Utility - GA4 Event Tracking for Creator App
 *
 * Provides comprehensive event tracking for user journey analytics.
 * Uses direct GA4 implementation (same pattern as dashboard app).
 *
 * @module analytics
 */

import {
  ANALYTICS_EVENT_NAMES,
  AUTH_EVENT_NAMES,
  getAuthEventName,
  normalizeFailureReason,
  type AuthFailureReason,
  type AuthMethod,
  type AuthStage,
  type CreatorTitleEntryMethod,
} from '@kstorybridge/analytics';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// Environment-based configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const IS_DEV = import.meta.env.DEV;
const PRODUCTION_ANALYTICS_HOSTS = new Set(['creator.kstorybridge.com']);
const NON_PRODUCTION_OVERRIDE_KEY = 'ksb_enable_non_production_analytics';

export const isAnalyticsCollectionAllowed = (
  hostname: string,
  allowNonProduction = false
): boolean => PRODUCTION_ANALYTICS_HOSTS.has(hostname.toLowerCase()) || allowNonProduction;

const hasRuntimeAnalyticsOverride = (): boolean => {
  if (typeof window === 'undefined') return false;

  const requested = new URLSearchParams(window.location.search).get('analytics_debug') === '1';
  if (requested) {
    window.sessionStorage.setItem(NON_PRODUCTION_OVERRIDE_KEY, 'true');
  }

  return requested || window.sessionStorage.getItem(NON_PRODUCTION_OVERRIDE_KEY) === 'true';
};

const ALLOW_NON_PRODUCTION_ANALYTICS =
  import.meta.env.VITE_ENABLE_NON_PRODUCTION_ANALYTICS === 'true' || hasRuntimeAnalyticsOverride();
const IS_ANALYTICS_ENABLED =
  !!GA_MEASUREMENT_ID &&
  typeof window !== 'undefined' &&
  isAnalyticsCollectionAllowed(window.location.hostname, ALLOW_NON_PRODUCTION_ANALYTICS);

const isInternalHost = (): boolean =>
  typeof window !== 'undefined' &&
  (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ||
    window.location.hostname.includes('-staging.'));

export const isInternalTrafficMetadata = (
  appMetadata?: Record<string, unknown> | null
): boolean => appMetadata?.internal_traffic === true;

type AnalyticsTrafficType = 'external' | 'internal';
type PendingAnalyticsEvent = { eventName: string; params: Record<string, unknown> };

let analyticsIdentityResolved = false;
let analyticsTrafficType: AnalyticsTrafficType = isInternalHost() ? 'internal' : 'external';
const pendingAnalyticsEvents: PendingAnalyticsEvent[] = [];
const MAX_PENDING_ANALYTICS_EVENTS = 100;

const flushPendingAnalyticsEvents = (): void => {
  if (!IS_ANALYTICS_ENABLED || !analyticsIdentityResolved || typeof window.gtag !== 'function') {
    return;
  }

  for (const event of pendingAnalyticsEvents.splice(0)) {
    window.gtag('event', event.eventName, {
      ...event.params,
      traffic_type: analyticsTrafficType,
    });
  }
};

/**
 * Initialize Google Analytics 4
 * Call this once in your app's entry point (main.tsx)
 */
export const initializeAnalytics = (): void => {
  if (!IS_ANALYTICS_ENABLED) {
    if (IS_DEV) {
      console.log('[Analytics] GA4 disabled for this environment', {
        measurementConfigured: !!GA_MEASUREMENT_ID,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
        overrideEnabled: ALLOW_NON_PRODUCTION_ANALYTICS,
      });
    }
    return;
  }

  // Load gtag.js script dynamically
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag - must use 'arguments' object, not spread args
  // This is the standard gtag pattern required by gtag.js
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    // Route-level tracking sends page views after auth classification.
    send_page_view: false,
    traffic_type: analyticsTrafficType,
  });

  if (IS_DEV) {
    console.log(`[Analytics] Creator GA4 initialized (${GA_MEASUREMENT_ID})`);
  }
};

/**
 * Set authenticated user for GA4 cross-session tracking
 * Call this when user logs in to enable user-level analytics
 *
 * @param userId - Supabase user UUID (not email for privacy)
 * @param userProperties - Optional user properties for segmentation
 *
 * @example
 * setAnalyticsUser(user.id, { type: 'creator' })
 */
export const setAnalyticsUser = (
  userId: string,
  userProperties?: {
    tier?: string;
    type?: string;
    internal?: boolean;
  }
): void => {
  if (!IS_ANALYTICS_ENABLED) {
    if (IS_DEV) {
      console.log('[Analytics] setAnalyticsUser skipped (GA4 not configured)');
    }
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    analyticsTrafficType = userProperties?.internal ? 'internal' : 'external';
    analyticsIdentityResolved = true;

    // The Supabase UUID is non-PII. Internal classification comes from
    // service-role-controlled app_metadata, never from an email in the bundle.
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
      traffic_type: analyticsTrafficType,
    });

    // Set user properties for segmentation in reports
    if (userProperties) {
      window.gtag('set', 'user_properties', {
        user_tier: userProperties.tier || 'unknown',
        user_type: userProperties.type || 'unknown',
      });
    }

    if (IS_DEV) {
      console.log(`[Analytics] User set: ${userId.substring(0, 8)}...`, userProperties);
    }

    flushPendingAnalyticsEvents();
  }
};

/**
 * Clear user identity on sign out
 * Call this when user logs out to reset GA4 user tracking
 */
export const clearAnalyticsUser = (): void => {
  if (!IS_ANALYTICS_ENABLED) {
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    analyticsTrafficType = isInternalHost() ? 'internal' : 'external';
    analyticsIdentityResolved = true;

    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: undefined,
      traffic_type: analyticsTrafficType,
    });

    if (IS_DEV) {
      console.log('[Analytics] User cleared');
    }

    flushPendingAnalyticsEvents();
  }
};

/**
 * Generic event tracking helper
 */
const trackEvent = (eventName: string, params: Record<string, unknown>): void => {
  // Add app_section to all events for segmentation
  const enrichedParams = {
    ...params,
    app_section: 'creator',
  };

  if (IS_DEV) {
    console.log(`[Analytics] ${eventName}`, enrichedParams);
  }

  if (!IS_ANALYTICS_ENABLED) {
    return;
  }

  if (!analyticsIdentityResolved) {
    if (pendingAnalyticsEvents.length < MAX_PENDING_ANALYTICS_EVENTS) {
      pendingAnalyticsEvents.push({ eventName, params: enrichedParams });
    }
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...enrichedParams,
      traffic_type: analyticsTrafficType,
    });
  }
};

// ============================================
// Page View Tracking
// ============================================

/**
 * Track page views
 */
export const trackPageView = (path: string, title?: string): void => {
  trackEvent('page_view', {
    page_title: title || document.title,
    page_location: window.location.href,
    page_path: path,
  });
};

// ============================================
// Authentication Events
// ============================================

export const trackSignup = (
  stage: AuthStage,
  method: AuthMethod,
  failureReason?: AuthFailureReason
): void => {
  trackEvent(getAuthEventName('signup', stage), {
    method,
    account_type: 'creator',
    ...(failureReason
      ? { failure_reason: normalizeFailureReason(failureReason) }
      : {}),
  });
};

export const trackSignin = (
  stage: AuthStage,
  method: AuthMethod,
  failureReason?: AuthFailureReason
): void => {
  trackEvent(getAuthEventName('signin', stage), {
    method,
    account_type: 'creator',
    ...(failureReason
      ? { failure_reason: normalizeFailureReason(failureReason) }
      : {}),
  });
};

export const trackLogout = (): void => {
  trackEvent('logout', {
    event_category: 'authentication',
    event_label: 'creator_logout',
  });
};

export const trackOAuthComplete = (provider: string): void => {
  trackEvent('oauth_complete', {
    event_category: 'authentication',
    provider: provider,
  });
};

export const trackCreatorProfileCompleted = (): void => {
  trackEvent(AUTH_EVENT_NAMES.creatorProfileCompleted, {
    account_type: 'creator',
  });
};

// ============================================
// Title Management Events
// ============================================

export const trackTitleCreate = (titleId: string, format?: string): void => {
  trackEvent('title_create', {
    title_id: titleId,
    content_format: format,
  });
};

export const trackTitleDraftCreated = (
  draftId: string,
  entryMethod: CreatorTitleEntryMethod
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.titleDraftCreated, {
    draft_id: draftId,
    entry_method: entryMethod,
  });
};

export const trackTitleSubmitted = (
  draftId: string,
  entryMethod: CreatorTitleEntryMethod
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.titleSubmitted, {
    draft_id: draftId,
    entry_method: entryMethod,
  });
};

export const trackTitleEdit = (titleId: string): void => {
  trackEvent('title_edit', {
    event_category: 'title_management',
    title_id: titleId,
  });
};

export const trackTitleDelete = (titleId: string): void => {
  trackEvent('title_delete', {
    event_category: 'title_management',
    title_id: titleId,
  });
};

export const trackTitleView = (titleId: string): void => {
  trackEvent('title_view', {
    event_category: 'title_management',
    title_id: titleId,
  });
};

export const trackTitleSaveDraft = (step: number): void => {
  trackEvent('title_save_draft', {
    event_category: 'title_management',
    event_label: `step_${step}`,
    step_number: step,
  });
};

export const trackSurveyStepComplete = (step: number, stepName: string): void => {
  trackEvent('survey_step_complete', {
    step_number: step,
    step_name: stepName,
  });
};

export const trackDocumentUpload = (documentType: string, titleId?: string): void => {
  trackEvent('document_upload', {
    event_category: 'title_management',
    document_type: documentType,
    title_id: titleId,
  });
};

// ============================================
// Subscription & Billing Events
// ============================================

export const trackPlanView = (): void => {
  trackEvent('plan_view', {
    event_category: 'subscription',
    event_label: 'pricing_page',
  });
};

export const trackCheckoutStart = (
  planType: 'packaging' | 'premium',
  billingPeriod: 'monthly' | 'yearly'
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.checkoutStarted, {
    account_type: 'creator',
    plan_type: planType,
    billing_period: billingPeriod,
  });
};

export const trackBillingView = (): void => {
  trackEvent('billing_view', {
    event_category: 'subscription',
    event_label: 'billing_page',
  });
};

export const trackSubscriptionCancel = (subscriptionId: string): void => {
  trackEvent('subscription_cancel', {
    event_category: 'subscription',
    subscription_id: subscriptionId,
  });
};

// ============================================
// Profile & Settings Events
// ============================================

export const trackProfileUpdate = (fields: string[]): void => {
  trackEvent('profile_update', {
    event_category: 'user_settings',
    fields_updated: fields.join(', '),
  });
};

export const trackProfileView = (): void => {
  trackEvent('profile_view', {
    event_category: 'user_settings',
    event_label: 'profile_page',
  });
};

// ============================================
// Content & Navigation Events
// ============================================

export const trackNewsView = (postId: string, title?: string): void => {
  trackEvent('news_view', {
    event_category: 'content_engagement',
    post_id: postId,
    post_title: title,
  });
};

export const trackLearningCenterView = (postId: string, title?: string): void => {
  trackEvent('learning_center_view', {
    event_category: 'content_engagement',
    post_id: postId,
    post_title: title,
  });
};

export const trackNavigation = (destination: string, source?: string): void => {
  trackEvent('navigation', {
    event_category: 'user_flow',
    destination: destination,
    source: source || 'unknown',
  });
};

export const trackButtonClick = (buttonName: string, location: string): void => {
  trackEvent('button_click', {
    event_category: 'engagement',
    button_name: buttonName,
    location: location,
  });
};

export const trackExternalLink = (url: string, linkText?: string): void => {
  trackEvent('external_link_click', {
    event_category: 'outbound',
    url: url,
    link_text: linkText,
  });
};

// ============================================
// Error Tracking
// ============================================

export const trackError = (errorMessage: string, errorLocation: string, errorCode?: string): void => {
  trackEvent('error', {
    error_message: errorMessage,
    error_location: errorLocation,
    error_code: errorCode,
  });
};

export const trackAuthError = (errorMessage: string, method?: string): void => {
  trackError(errorMessage, 'authentication', method);
};

export const trackApiError = (endpoint: string, errorMessage: string, statusCode?: number): void => {
  trackError(errorMessage, `api_${endpoint}`, statusCode?.toString());
};

// ============================================
// Form Events
// ============================================

export const trackFormSubmission = (formName: string, success: boolean): void => {
  trackEvent('form_submit', {
    event_category: 'conversion',
    form_name: formName,
    success: success,
  });
};

export const trackFormError = (formName: string, fieldName: string, errorMessage: string): void => {
  trackEvent('form_error', {
    event_category: 'validation',
    form_name: formName,
    field_name: fieldName,
    error_message: errorMessage,
  });
};

// ============================================
// Legacy Exports (for backward compatibility)
// ============================================

/**
 * @deprecated Use initializeAnalytics() instead
 */
export const initGA = initializeAnalytics;

/**
 * Generic custom event tracker (for backward compatibility)
 */
export const trackCustomEvent = (action: string, category: string, label?: string, value?: number): void => {
  trackEvent('custom_event', {
    event_action: action,
    event_category: category,
    event_label: label,
    event_value: value,
  });
};
