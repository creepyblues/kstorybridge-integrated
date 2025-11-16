// Google Tag Manager utility functions for the Creator app

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Tag Manager Container ID (shared with Dashboard and Website)
const GTM_CONTAINER_ID = 'GTM-PZBC4XQT';

// Initialize Google Tag Manager (GTM is loaded directly in HTML)
export const initGA = () => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    // GTM is initialized via the script in HTML
    // Push initial configuration to dataLayer
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      'event': 'gtm.js',
      'app_name': 'creator',
      'app_version': '2.0.0'
    });
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'page_view',
      'page_title': title || document.title,
      'page_location': window.location.href,
      'page_path': path,
      'app_section': 'creator'
    });
  }
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'custom_event',
      'event_action': action,
      'event_category': category,
      'event_label': label,
      'event_value': value,
      'app_section': 'creator'
    });
  }
};

// ============================================
// Authentication Events
// ============================================

export const trackSignup = (method: 'email' | 'google') => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'sign_up',
      'method': method,
      'user_type': 'creator',
      'app_section': 'creator'
    });
  }
};

export const trackLogin = (method: 'email' | 'google') => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'login',
      'method': method,
      'user_type': 'creator',
      'app_section': 'creator'
    });
  }
};

export const trackLogout = () => {
  trackEvent('logout', 'authentication', 'creator_logout');
};

export const trackOAuthComplete = (provider: string) => {
  trackEvent('oauth_complete', 'authentication', provider);
};

export const trackProfileComplete = () => {
  trackEvent('profile_complete', 'authentication', 'creator_profile_setup');
};

// ============================================
// Title Management Events
// ============================================

export const trackTitleCreate = (titleId: string, format?: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'title_create',
      'title_id': titleId,
      'content_format': format,
      'app_section': 'creator'
    });
  }
};

export const trackTitleEdit = (titleId: string) => {
  trackEvent('title_edit', 'title_management', titleId);
};

export const trackTitleDelete = (titleId: string) => {
  trackEvent('title_delete', 'title_management', titleId);
};

export const trackTitleView = (titleId: string) => {
  trackEvent('title_view', 'title_management', titleId);
};

export const trackTitleSaveDraft = (step: number) => {
  trackEvent('title_save_draft', 'title_management', `step_${step}`, step);
};

export const trackSurveyStepComplete = (step: number, stepName: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'survey_step_complete',
      'step_number': step,
      'step_name': stepName,
      'app_section': 'creator'
    });
  }
};

export const trackDocumentUpload = (documentType: string, titleId?: string) => {
  trackEvent('document_upload', 'title_management', documentType, titleId ? 1 : 0);
};

// ============================================
// Subscription & Billing Events
// ============================================

export const trackPlanView = () => {
  trackEvent('plan_view', 'subscription', 'pricing_page');
};

export const trackCheckoutStart = (plan: string, billingPeriod: 'monthly' | 'yearly', titleId?: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'begin_checkout',
      'plan_type': plan,
      'billing_period': billingPeriod,
      'title_id': titleId,
      'app_section': 'creator'
    });
  }
};

export const trackPaymentSuccess = (plan: string, billingPeriod: string, amount?: number) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'purchase',
      'plan_type': plan,
      'billing_period': billingPeriod,
      'value': amount,
      'currency': 'USD',
      'app_section': 'creator'
    });
  }
};

export const trackBillingView = () => {
  trackEvent('billing_view', 'subscription', 'billing_page');
};

export const trackSubscriptionCancel = (subscriptionId: string) => {
  trackEvent('subscription_cancel', 'subscription', subscriptionId);
};

// ============================================
// Profile & Settings Events
// ============================================

export const trackProfileUpdate = (fields: string[]) => {
  trackEvent('profile_update', 'user_settings', fields.join(', '));
};

export const trackProfileView = () => {
  trackEvent('profile_view', 'user_settings', 'profile_page');
};

// ============================================
// Content & Navigation Events
// ============================================

export const trackNewsView = (postId: string, title?: string) => {
  trackEvent('news_view', 'content_engagement', title || postId);
};

export const trackLearningCenterView = (postId: string, title?: string) => {
  trackEvent('learning_center_view', 'content_engagement', title || postId);
};

export const trackNavigation = (destination: string, source?: string) => {
  trackEvent('navigation', 'user_flow', `${source || 'unknown'} -> ${destination}`);
};

export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('button_click', 'engagement', `${buttonName} (${location})`);
};

export const trackExternalLink = (url: string, linkText?: string) => {
  trackEvent('external_link_click', 'outbound', linkText || url);
};

// ============================================
// Error Tracking
// ============================================

export const trackError = (errorMessage: string, errorLocation: string, errorCode?: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'error',
      'error_message': errorMessage,
      'error_location': errorLocation,
      'error_code': errorCode,
      'app_section': 'creator'
    });
  }
};

export const trackAuthError = (errorMessage: string, method?: string) => {
  trackError(errorMessage, 'authentication', method);
};

export const trackApiError = (endpoint: string, errorMessage: string, statusCode?: number) => {
  trackError(errorMessage, `api_${endpoint}`, statusCode?.toString());
};

// ============================================
// Form Events
// ============================================

export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent('form_submit', 'conversion', formName, success ? 1 : 0);
};

export const trackFormError = (formName: string, fieldName: string, errorMessage: string) => {
  trackEvent('form_error', 'validation', `${formName}: ${fieldName} - ${errorMessage}`);
};
