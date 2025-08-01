// Google Analytics utility functions for the dashboard

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics Measurement ID - replace with your actual GA4 measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined') {
    // Wait for gtag to be available
    const checkGtag = () => {
      if (window.gtag) {
        window.gtag('config', GA_MEASUREMENT_ID, {
          // Enhanced measurement for better tracking
          send_page_view: false, // We'll manually track page views
          anonymize_ip: true,
          allow_google_signals: true,
          allow_ad_personalization_signals: false
        });
      } else {
        // Retry after a short delay
        setTimeout(checkGtag, 100);
      }
    };
    checkGtag();
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window !== 'undefined') {
    const sendPageView = () => {
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: title || document.title,
          page_location: window.location.href,
          page_path: path,
          custom_map: {
            dimension1: 'dashboard' // Custom dimension to identify dashboard traffic
          }
        });
      } else {
        // Retry after a short delay if gtag is not ready
        setTimeout(sendPageView, 100);
      }
    };
    sendPageView();
  }
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined') {
    const sendEvent = () => {
      if (window.gtag) {
        window.gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value,
          custom_map: {
            dimension1: 'dashboard'
          }
        });
      } else {
        // Retry after a short delay if gtag is not ready
        setTimeout(sendEvent, 100);
      }
    };
    sendEvent();
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
  if (typeof window !== 'undefined') {
    const sendTitleView = () => {
      if (window.gtag) {
        window.gtag('event', 'view_item', {
          item_id: titleId,
          item_name: titleName,
          item_category: 'title',
          custom_map: {
            dimension1: 'dashboard'
          }
        });
      } else {
        setTimeout(sendTitleView, 100);
      }
    };
    sendTitleView();
  }
};

// Track favorites actions
export const trackFavoriteAction = (action: 'add' | 'remove', titleId: string, titleName: string) => {
  trackEvent(`favorite_${action}`, 'content_engagement', titleName);
};

// Track search actions
export const trackSearch = (searchTerm: string, resultCount?: number) => {
  if (typeof window !== 'undefined') {
    const sendSearch = () => {
      if (window.gtag) {
        window.gtag('event', 'search', {
          search_term: searchTerm,
          custom_map: {
            dimension1: 'dashboard'
          }
        });
      } else {
        setTimeout(sendSearch, 100);
      }
    };
    sendSearch();
  }
};

// Track authentication events
export const trackAuth = (action: 'login' | 'logout' | 'signup') => {
  if (typeof window !== 'undefined') {
    const sendAuth = () => {
      if (window.gtag) {
        window.gtag('event', action, {
          custom_map: {
            dimension1: 'dashboard'
          }
        });
      } else {
        setTimeout(sendAuth, 100);
      }
    };
    sendAuth();
  }
};

// Track errors
export const trackError = (errorMessage: string, errorLocation: string) => {
  trackEvent('error', 'technical_issues', `${errorLocation}: ${errorMessage}`);
};