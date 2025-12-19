import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * AnalyticsProvider - Tracks page views across the Creator app
 *
 * This component should be placed inside a Router context to enable
 * automatic page view tracking on route changes.
 *
 * Note: GA4 initialization is now handled in main.tsx via initializeAnalytics()
 * This component only handles page view tracking.
 */
export default function AnalyticsProvider() {
  // Use the analytics hook to track page views
  useAnalytics();

  // This component doesn't render anything
  return null;
}
