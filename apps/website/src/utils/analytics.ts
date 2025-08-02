// Google Tag Manager utility functions for the website

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Tag Manager Container ID
const GTM_CONTAINER_ID = 'GTM-PZBC4XQT';

// Initialize Google Tag Manager (GTM is loaded directly in HTML)
export const initGA = () => {
  if (typeof window !== 'undefined' && window.dataLayer) {
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
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'page_view',
      'page_title': title || document.title,
      'page_location': window.location.href,
      'page_path': path,
      'app_section': 'website'
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
      'app_section': 'website'
    });
  }
};

// Track user interactions specific to website
export const trackWebsiteEvent = (action: string, details?: Record<string, any>) => {
  trackEvent(action, 'website_interaction', JSON.stringify(details));
};

// Track navigation events
export const trackNavigation = (destination: string, source?: string) => {
  trackEvent('navigation', 'user_flow', `${source || 'unknown'} -> ${destination}`);
};

// Track button clicks
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('button_click', 'engagement', `${buttonName} (${location})`);
};

// Track signup events
export const trackSignup = (userType: 'buyer' | 'creator', method?: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'sign_up',
      'method': method || 'email',
      'user_type': userType,
      'app_section': 'website'
    });
  }
};

// Track login events
export const trackLogin = (method?: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'login',
      'method': method || 'email',
      'app_section': 'website'
    });
  }
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