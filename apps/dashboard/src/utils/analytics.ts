// Google Analytics utility functions for the dashboard

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-LTR32L1HTF';

// Initialize Google Analytics (gtag is now loaded directly in HTML)
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      // Enhanced measurement for better tracking
      send_page_view: false, // We'll manually track page views
      anonymize_ip: true,
      allow_google_signals: true,
      allow_ad_personalization_signals: false
    });
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: title || document.title,
      page_location: window.location.href,
      page_path: path,
      custom_map: {
        dimension1: 'dashboard'
      }
    });
  }
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      custom_map: {
        dimension1: 'dashboard'
      }
    });
  }
};

// Track user interactions specific to dashboard
export const trackDashboardEvent = (action: string, details?: Record<string, any>) => {
  trackEvent(action, 'dashboard_interaction', JSON.stringify(details));
};

// Track premium feature requests
export const trackPremiumFeatureRequest = (featureName: string) => {
  trackEvent('premium_feature_request', 'premium_features', featureName);
};

// Track title views
export const trackTitleView = (titleId: string, titleName: string) => {
  trackEvent('view_title', 'content_engagement', titleName, undefined);
  
  // Also track as custom event with more details
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      item_id: titleId,
      item_name: titleName,
      item_category: 'title',
      custom_map: {
        dimension1: 'dashboard'
      }
    });
  }
};

// Track favorites actions
export const trackFavoriteAction = (action: 'add' | 'remove', titleId: string, titleName: string) => {
  trackEvent(`favorite_${action}`, 'content_engagement', titleName);
};

// Track search actions
export const trackSearch = (searchTerm: string, resultCount?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      custom_map: {
        dimension1: 'dashboard'
      }
    });
  }
};

// Track authentication events
export const trackAuth = (action: 'login' | 'logout' | 'signup') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      custom_map: {
        dimension1: 'dashboard'
      }
    });
  }
};

// Track errors
export const trackError = (errorMessage: string, errorLocation: string) => {
  trackEvent('error', 'technical_issues', `${errorLocation}: ${errorMessage}`);
};