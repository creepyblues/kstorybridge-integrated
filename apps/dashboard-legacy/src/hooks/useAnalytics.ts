import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  initGA, 
  trackPageView, 
  trackEvent, 
  trackDashboardEvent,
  trackPremiumFeatureRequest,
  trackTitleView,
  trackFavoriteAction,
  trackSearch,
  trackAuth,
  trackError
} from '@/utils/analytics';

// Hook to initialize and track page views
export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA on first load
    initGA();
  }, []);

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname);
  }, [location]);

  return {
    trackEvent,
    trackDashboardEvent,
    trackPremiumFeatureRequest,
    trackTitleView,
    trackFavoriteAction,
    trackSearch,
    trackAuth,
    trackError
  };
};