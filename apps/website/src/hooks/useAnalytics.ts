import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/analytics';

// React hook for tracking page views and other analytics
export const useAnalytics = () => {
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    // Small delay to ensure page title is updated
    const timeout = setTimeout(() => {
      trackPageView(location.pathname, document.title);
    }, 100);

    return () => clearTimeout(timeout);
  }, [location]);

  return null;
};