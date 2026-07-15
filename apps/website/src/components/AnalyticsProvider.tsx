import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { initGA, initializeEmailLandingEngagement } from '@/utils/analytics';

export default function AnalyticsProvider() {
  // Initialize analytics on mount
  useEffect(() => {
    initGA();
    const cleanupEmailEngagement = initializeEmailLandingEngagement();
    console.log('📊 Website analytics initialized');

    return cleanupEmailEngagement;
  }, []);

  // Use the analytics hook to track page views
  useAnalytics();

  // This component doesn't render anything
  return null;
}
