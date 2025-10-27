import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageVisit, initializeSessionBehavior } from '@/utils/sessionBehaviorTracking';

export default function SessionTracker() {
  const location = useLocation();

  useEffect(() => {
    // Initialize session behavior tracking on mount
    initializeSessionBehavior();
  }, []);

  // Track page changes
  useEffect(() => {
    // Track page visit whenever location changes
    trackPageVisit();
  }, [location]);

  // This component doesn't render anything
  return null;
}