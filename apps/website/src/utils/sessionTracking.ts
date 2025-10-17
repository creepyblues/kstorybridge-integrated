import { supabase } from '@/integrations/supabase/client';
import { sendSlackNotification } from './slack';

const SESSION_KEY = 'kstorybridge_session_notified';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  url: string;
  timestamp: number;
}

function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  
  // Check for mobile devices
  if (/mobile|android|iphone|ipod/.test(userAgent)) {
    return 'Mobile';
  }
  
  // Check for tablets
  if (/ipad|tablet/.test(userAgent) || (screenWidth >= 768 && screenWidth <= 1024 && /touch/.test(userAgent))) {
    return 'Tablet';
  }
  
  // Default to desktop
  return 'Desktop';
}

function getBrowserInfo(): string {
  const userAgent = navigator.userAgent;
  
  // Check for common browsers
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

export async function notifySessionStart() {
  try {
    // Check if we've already sent a notification for this session
    const existingSession = sessionStorage.getItem(SESSION_KEY);
    if (existingSession) {
      const sessionData: SessionData = JSON.parse(existingSession);
      const now = Date.now();
      
      // If session is still valid (within 30 minutes), don't send another notification
      if (now - sessionData.timestamp < SESSION_DURATION) {
        console.log('Session notification already sent within the last 30 minutes');
        return;
      }
    }

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Determine user type based on account_type
    let userType: 'buyer' | 'creator' = 'buyer'; // Default to buyer
    if (user && user.user_metadata?.account_type === 'creator') {
      userType = 'creator';
    }

    // Get current URL
    const currentUrl = window.location.href;

    // TEMPORARILY PAUSED: User Session Started notifications
    // Uncomment the block below to re-enable session start notifications
    /*
    // Send notification using centralized Slack utility (includes blacklist filtering)
    try {
      await sendSlackNotification({
        event: 'User Session Started',
        userType,
        fullName: user ? (user.user_metadata?.full_name || 'User') : 'Anonymous User',
        email: user ? user.email! : 'not-logged-in@anonymous.user',
        additionalInfo: {
          url: currentUrl,
          referrer: document.referrer || 'Direct',
          deviceType: getDeviceType(),
          browser: getBrowserInfo(),
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          isLoggedIn: !!user
        }
      });

      // Mark session as notified
      const sessionData: SessionData = {
        url: currentUrl,
        timestamp: Date.now()
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      console.log('✅ Session start notification sent to Slack');
    } catch (error) {
      console.error('Failed to send session notification:', error);
    }
    */

    // Session tracking still happens, just notifications are paused
    console.log('📊 Session started (notifications paused):', {
      url: currentUrl,
      isLoggedIn: !!user,
      deviceType: getDeviceType(),
      browser: getBrowserInfo()
    });

    // Still mark session as processed to avoid duplicate processing
    const sessionData: SessionData = {
      url: currentUrl,
      timestamp: Date.now()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    // Don't throw - we don't want notification failures to affect the app
    console.error('Error sending session notification:', error);
  }
}

// Function to clear session notification (useful for testing)
export function clearSessionNotification() {
  sessionStorage.removeItem(SESSION_KEY);
  console.log('Session notification cleared');
}