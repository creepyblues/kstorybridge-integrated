/**
 * Utility functions for sending Slack notifications
 */

// Email addresses and domains to exclude from Slack notifications
const EXCLUDED_EMAILS = [
  'kevin@sandstoneartists.com',
  'sungho@kstorybridge.com',
  'creepyblues@gmail.com'
];

const EXCLUDED_DOMAINS = [
  'dadble.com',
  'kstorybridge.com'
];

/**
 * Check if an email should be excluded from Slack notifications
 */
const shouldExcludeEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailLower = email.toLowerCase();
  
  // Check exact email matches
  if (EXCLUDED_EMAILS.some(excluded => excluded.toLowerCase() === emailLower)) {
    console.log(`🚫 Skipping Slack notification for excluded email: ${email}`);
    return true;
  }
  
  // Check domain matches  
  const domain = emailLower.split('@')[1];
  if (domain && EXCLUDED_DOMAINS.includes(domain)) {
    console.log(`🚫 Skipping Slack notification for excluded domain: ${domain}`);
    return true;
  }
  
  return false;
};

export interface SlackNotificationData {
  event: string;
  userType: 'buyer' | 'creator';
  fullName: string;
  email: string;
  company?: string;
  authType?: 'email' | 'google' | 'oauth';
  timestamp?: string;
  timezone?: string;
  additionalInfo?: Record<string, unknown>;
}

export const sendSlackNotification = async (data: SlackNotificationData): Promise<void> => {
  // Check if email should be excluded from notifications
  if (shouldExcludeEmail(data.email)) {
    return;
  }

  // Use Supabase Edge Function to proxy the Slack webhook request
  // This avoids CORS issues when making requests directly from the browser
  const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_Xvhpwj9CpHUOIeFAJHm3ZQ_WdQvqJDS";
  
  const proxyUrl = `${SUPABASE_URL}/functions/v1/slack-webhook-proxy`;
  
  console.log('🔍 Debug: Using Slack proxy endpoint');
  console.log('🔍 Debug: Notification data:', data);
  
  try {
    console.log('🔍 Debug: Sending to proxy endpoint:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(data),
    });
    
    console.log('🔍 Debug: Proxy response status:', response.status);
    console.log('🔍 Debug: Proxy response ok:', response.ok);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('❌ Failed to send Slack notification via proxy:', response.status, response.statusText);
      console.error('❌ Response body:', responseText);
    } else {
      const result = await response.json();
      console.log('✅ Slack notification sent successfully via proxy!', result);
    }
  } catch (error) {
    console.error('❌ Error sending Slack notification via proxy:', error);
  }
};


// Test function for debugging
export const testSlackNotification = async () => {
  console.log('🧪 Testing Slack notification...');
  await sendSlackNotification({
    event: 'Test Notification',
    userType: 'buyer',
    fullName: 'Test User',
    email: 'test@example.com',
    company: 'Test Company',
    additionalInfo: {
      note: 'This is a test message from KStoryBridge'
    }
  });
};

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as typeof window & { testSlackNotification: typeof testSlackNotification }).testSlackNotification = testSlackNotification;
}