import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { notifySessionStart } from '@/utils/sessionTracking';
import { trackPageVisit, initializeSessionBehavior } from '@/utils/sessionBehaviorTracking';
import { supabase } from '@/integrations/supabase/client';

export default function SessionTracker() {
  const location = useLocation();

  useEffect(() => {
    // Function to handle session notification
    const handleSessionNotification = async () => {
      // Only send notification in production or if explicitly enabled in dev
      const isDevelopment = import.meta.env.DEV;
      const enableDevNotifications = import.meta.env.VITE_SLACK_ENABLE_DEV === 'true';
      
      if (!isDevelopment || enableDevNotifications) {
        await notifySessionStart();
      } else {
        console.log('Session tracking disabled in development. Set VITE_SLACK_ENABLE_DEV=true to enable.');
      }
    };

    // Initialize session behavior tracking
    initializeSessionBehavior();
    
    // Send notification on initial load
    handleSessionNotification();

    // Also listen for auth state changes to notify when user logs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just logged in, send a new notification
        sessionStorage.removeItem('kstorybridge_session_notified');
        handleSessionNotification();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Only run on mount

  // Track page changes
  useEffect(() => {
    // Track page visit whenever location changes
    trackPageVisit();
  }, [location]);

  // This component doesn't render anything
  return null;
}