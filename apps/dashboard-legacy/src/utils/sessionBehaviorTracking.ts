import { supabase } from '@/integrations/supabase/client';
import { sendSlackNotification } from './slack';

const BEHAVIOR_KEY = 'kstorybridge_session_behavior';
const SESSION_END_KEY = 'kstorybridge_session_end_notified';
const NOTIFICATION_COOLDOWN_KEY = 'kstorybridge_notification_cooldown';
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity = session end
const MIN_SESSION_DURATION = 2000; // Don't track sessions shorter than 2 seconds
const NOTIFICATION_COOLDOWN = 10 * 60 * 1000; // 10 minutes cooldown between duplicate notifications

interface PageVisit {
  url: string;
  timestamp: number;
  duration?: number;
  title?: string;
}

interface SessionBehavior {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  userEmail?: string;
  isLoggedIn: boolean;
  deviceType: string;
  browser: string;
  referrer: string;
  pages: PageVisit[];
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  
  if (/mobile|android|iphone|ipod/.test(userAgent)) {
    return 'Mobile';
  }
  
  if (/ipad|tablet/.test(userAgent) || (screenWidth >= 768 && screenWidth <= 1024 && /touch/.test(userAgent))) {
    return 'Tablet';
  }
  
  return 'Desktop';
}

function getBrowserInfo(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
    return 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
    return 'Safari';
  } else if (userAgent.indexOf('Firefox') > -1) {
    return 'Firefox';
  } else if (userAgent.indexOf('Edg') > -1) {
    return 'Edge';
  } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
    return 'Opera';
  }
  
  return 'Other';
}

export function initializeSessionBehavior(): SessionBehavior {
  const existingSession = sessionStorage.getItem(BEHAVIOR_KEY);
  
  if (existingSession) {
    return JSON.parse(existingSession);
  }
  
  const newSession: SessionBehavior = {
    sessionId: generateSessionId(),
    startTime: Date.now(),
    lastActivity: Date.now(),
    isLoggedIn: false,
    deviceType: getDeviceType(),
    browser: getBrowserInfo(),
    referrer: document.referrer || 'Direct',
    pages: []
  };
  
  sessionStorage.setItem(BEHAVIOR_KEY, JSON.stringify(newSession));
  return newSession;
}

export async function trackPageVisit(url?: string) {
  try {
    const session = initializeSessionBehavior();
    const now = Date.now();
    
    // Update the duration of the previous page if it exists
    if (session.pages.length > 0) {
      const lastPage = session.pages[session.pages.length - 1];
      lastPage.duration = (now - lastPage.timestamp) / 1000; // Convert to seconds
    }
    
    // Add the new page visit
    const currentUrl = url || window.location.href;
    session.pages.push({
      url: currentUrl,
      timestamp: now,
      title: document.title || 'Untitled Page'
    });
    
    // Update session activity time
    session.lastActivity = now;
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      session.isLoggedIn = true;
      session.userEmail = user.email;
    }
    
    sessionStorage.setItem(BEHAVIOR_KEY, JSON.stringify(session));
    
    // Check for session end due to inactivity
    scheduleInactivityCheck();
    
  } catch (error) {
    console.error('Error tracking page visit:', error);
  }
}

let inactivityTimer: NodeJS.Timeout | null = null;

function scheduleInactivityCheck() {
  // Clear existing timer
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  // Set new timer
  inactivityTimer = setTimeout(() => {
    endSession('inactivity');
  }, INACTIVITY_TIMEOUT);
}

export async function endSession(reason: 'inactivity' | 'navigation' | 'close' = 'close') {
  try {
    const session = sessionStorage.getItem(BEHAVIOR_KEY);
    if (!session) return;
    
    const sessionData: SessionBehavior = JSON.parse(session);
    const now = Date.now();
    
    // Update the duration of the last page
    if (sessionData.pages.length > 0) {
      const lastPage = sessionData.pages[sessionData.pages.length - 1];
      lastPage.duration = (now - lastPage.timestamp) / 1000;
    }
    
    // Calculate total session duration
    const totalDuration = (now - sessionData.startTime) / 1000; // in seconds
    
    // Don't send notification for very short sessions
    if (totalDuration < MIN_SESSION_DURATION / 1000) {
      console.log('Session too short to track:', totalDuration);
      return;
    }
    
    // Check if we've already sent end notification for this session
    const endNotified = sessionStorage.getItem(SESSION_END_KEY);
    if (endNotified === sessionData.sessionId) {
      // Session end already processed - guard prevents duplicate notifications
      return;
    }
    
    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    // Determine user type based on account_type
    let userType: 'buyer' | 'creator' | 'anonymous' = 'anonymous';
    if (user) {
      const accountType = user.user_metadata?.account_type;
      if (accountType === 'creator') {
        userType = 'creator';
      } else {
        userType = 'buyer'; // Default to buyer for authenticated users
      }
    }
    
    // Check notification cooldown to prevent spam
    const userEmail = user ? user.email! : sessionData.userEmail || 'not-logged-in@anonymous.user';
    const cooldownKey = `${NOTIFICATION_COOLDOWN_KEY}_${userEmail}`;
    const lastNotificationTime = localStorage.getItem(cooldownKey);

    if (lastNotificationTime && (now - parseInt(lastNotificationTime)) < NOTIFICATION_COOLDOWN) {
      console.log('🔇 Skipping duplicate session end notification (within cooldown period)');
      return;
    }

    // TEMPORARILY PAUSED: User Session Ended notifications
    // Uncomment the block below to re-enable session end notifications
    /*
    // Send notification using centralized Slack utility (includes blacklist filtering)
    try {
      await sendSlackNotification({
        event: 'User Session Ended',
        userType: userType === 'anonymous' ? 'buyer' : userType, // Convert to required type
        fullName: user ? (user.user_metadata?.full_name || 'User') : 'Anonymous User',
        email: userEmail,
        additionalInfo: {
          sessionId: sessionData.sessionId,
          reason,
          totalDuration: `${Math.round(totalDuration)}s`,
          pageCount: sessionData.pages.length,
          deviceType: sessionData.deviceType,
          browser: sessionData.browser,
          referrer: sessionData.referrer,
          isLoggedIn: sessionData.isLoggedIn,
          behavior: sessionData.pages.map((page, index) => ({
            order: index + 1,
            url: page.url,
            title: page.title,
            duration: page.duration ? `${page.duration.toFixed(1)}s` : 'ongoing'
          }))
        }
      });

      // Mark session end as notified and update cooldown
      sessionStorage.setItem(SESSION_END_KEY, sessionData.sessionId);
      localStorage.setItem(cooldownKey, now.toString());
      console.log('✅ Session end notification sent to Slack');

      // Clear session data if ending due to navigation or close
      if (reason !== 'inactivity') {
        sessionStorage.removeItem(BEHAVIOR_KEY);
      }
    } catch (error) {
      console.error('Failed to send session end notification:', error);
    }
    */

    // Session tracking still happens, just notifications are paused
    console.log('📊 Session ended (notifications paused):', {
      sessionId: sessionData.sessionId,
      reason,
      totalDuration: `${Math.round(totalDuration)}s`,
      pageCount: sessionData.pages.length
    });

    // Still mark session as processed to avoid duplicate processing
    sessionStorage.setItem(SESSION_END_KEY, sessionData.sessionId);
    localStorage.setItem(cooldownKey, now.toString());

    // Clear session data if ending due to navigation or close
    if (reason !== 'inactivity') {
      sessionStorage.removeItem(BEHAVIOR_KEY);
    }
  } catch (error) {
    console.error('Error ending session:', error);
  }
}

// Listen for page visibility changes (tab switching, minimizing)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden, could be end of session
    endSession('navigation');
  } else {
    // Page is visible again, track as new page visit
    trackPageVisit();
  }
});

// Listen for page unload (closing tab/window)
window.addEventListener('beforeunload', () => {
  endSession('close');
});

// Track user activity to reset inactivity timer
['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, () => {
    const session = sessionStorage.getItem(BEHAVIOR_KEY);
    if (session) {
      const sessionData = JSON.parse(session);
      sessionData.lastActivity = Date.now();
      sessionStorage.setItem(BEHAVIOR_KEY, JSON.stringify(sessionData));
      scheduleInactivityCheck();
    }
  }, { passive: true });
});

// Export function to manually clear session (useful for testing)
export function clearSessionBehavior() {
  sessionStorage.removeItem(BEHAVIOR_KEY);
  sessionStorage.removeItem(SESSION_END_KEY);
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  console.log('Session behavior tracking cleared');
}