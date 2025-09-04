import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'kstorybridge_session_notified';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  url: string;
  timestamp: number;
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
    
    // Get current URL
    const currentUrl = window.location.href;
    
    // Prepare notification data
    const notificationData = {
      event: 'User Session Started',
      userType: user ? 'authenticated' : 'anonymous',
      fullName: user ? (user.user_metadata?.full_name || 'User') : 'Anonymous User',
      email: user ? user.email : 'not-logged-in@anonymous.user',
      additionalInfo: {
        url: currentUrl,
        referrer: document.referrer || 'Direct',
        isLoggedIn: !!user
      }
    };

    // Send to Slack via Supabase proxy
    const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";
    const proxyUrl = `${SUPABASE_URL}/functions/v1/slack-webhook-proxy`;
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(notificationData),
    });

    if (response.ok) {
      // Mark session as notified
      const sessionData: SessionData = {
        url: currentUrl,
        timestamp: Date.now()
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      console.log('✅ Session start notification sent to Slack');
    } else {
      console.error('Failed to send session notification:', await response.text());
    }
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