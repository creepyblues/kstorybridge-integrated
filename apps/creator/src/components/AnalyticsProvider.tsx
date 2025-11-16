import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { initGA } from '@/utils/analytics';

/**
 * AnalyticsProvider - Initializes Google Tag Manager and tracks page views
 *
 * This component should be placed at the root level of the app (in main.tsx)
 * to enable automatic tracking across all pages.
 *
 * Features:
 * - Initializes GTM on app mount
 * - Automatically tracks page views on route changes
 * - Uses shared GTM container (GTM-PZBC4XQT) with app_section='creator'
 */
export default function AnalyticsProvider() {
  // Initialize analytics on mount
  useEffect(() => {
    initGA();
    console.log('📊 Creator analytics initialized (GTM-PZBC4XQT)');
  }, []);

  // Use the analytics hook to track page views
  useAnalytics();

  // This component doesn't render anything
  return null;
}
