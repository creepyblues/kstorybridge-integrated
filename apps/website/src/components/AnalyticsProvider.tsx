import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { initGA } from '@/utils/analytics';

export default function AnalyticsProvider() {
  // Initialize analytics on mount
  useEffect(() => {
    initGA();
    console.log('📊 Website analytics initialized');
  }, []);

  // Use the analytics hook to track page views
  useAnalytics();

  // This component doesn't render anything
  return null;
}