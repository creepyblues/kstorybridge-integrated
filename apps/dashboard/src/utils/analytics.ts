// Google Tag Manager utility functions for the dashboard

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Tag Manager Container ID
const GTM_CONTAINER_ID = 'GTM-PZBC4XQT';

// Initialize Google Tag Manager (GTM is now loaded directly in HTML)
export const initGA = () => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    // GTM is initialized via the script in HTML
    // Push initial configuration to dataLayer
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      'event': 'gtm.js',
      'app_name': 'dashboard',
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
      'app_section': 'dashboard'
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
      'app_section': 'dashboard'
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
  
  // Also track as ecommerce event with more details
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'view_item',
      'item_id': titleId,
      'item_name': titleName,
      'item_category': 'title',
      'app_section': 'dashboard'
    });
  }
};

// Track favorites actions
export const trackFavoriteAction = (action: 'add' | 'remove', titleId: string, titleName: string) => {
  trackEvent(`favorite_${action}`, 'content_engagement', titleName);
};

// Track search actions with enhanced context
export const trackSearch = (searchTerm: string, resultCount?: number, context?: {
  userType?: 'buyer' | 'creator';
  searchContext?: 'main' | 'favorites';
  page?: string;
}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    // Clean search term (remove context prefixes like "favorites:")
    const cleanSearchTerm = searchTerm.replace(/^(favorites|main):/i, '').trim();
    const searchContext = searchTerm.startsWith('favorites:') ? 'favorites' : 'main';
    
    window.dataLayer.push({
      'event': 'search',
      'search_term': cleanSearchTerm,
      'search_results': resultCount || 0,
      'search_context': context?.searchContext || searchContext,
      'user_type': context?.userType || 'unknown',
      'page_context': context?.page || window.location.pathname,
      'app_section': 'dashboard',
      // GA4 enhanced ecommerce parameters
      'search_id': `search_${Date.now()}`,
      'search_timestamp': new Date().toISOString()
    });

    console.log('🔍 GA4 SEARCH EVENT:', {
      searchTerm: cleanSearchTerm,
      resultCount,
      context: context?.searchContext || searchContext,
      userType: context?.userType,
      timestamp: new Date().toISOString()
    });
  }
};

// Track authentication events
export const trackAuth = (action: 'login' | 'logout' | 'signup') => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'auth_event',
      'auth_action': action,
      'app_section': 'dashboard'
    });
  }
};

// Track errors
export const trackError = (errorMessage: string, errorLocation: string) => {
  trackEvent('error', 'technical_issues', `${errorLocation}: ${errorMessage}`);
};