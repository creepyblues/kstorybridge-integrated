/**
 * Utility functions for sending Slack notifications
 */

// Email addresses and domains to exclude from Slack notifications
const EXCLUDED_EMAILS = [
  'kevin@sandstoneartists.com',
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
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";
  
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

// Convenience functions for common events
export const notifyBuyerSignup = async (userData: {
  fullName: string;
  email: string;  
  company?: string;
  role?: string;
  linkedinUrl?: string;
  authType?: 'email' | 'google' | 'oauth';
  success?: boolean;
  errorMessage?: string;
  tier?: string;
}) => {
  // Get current timestamp and timezone
  const now = new Date();
  const timestamp = now.toISOString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const event = userData.success !== false ? 'New Buyer Signup' : 'Failed Buyer Signup';
  
  await sendSlackNotification({
    event,
    userType: 'buyer',
    fullName: userData.fullName,
    email: userData.email,
    company: userData.company,
    authType: userData.authType || 'email',
    timestamp: timestamp,
    timezone: timezone,
    additionalInfo: {
      role: userData.role,
      linkedinUrl: userData.linkedinUrl,
      success: userData.success !== false,
      errorMessage: userData.errorMessage,
      tier: userData.tier,
      signupStep: userData.success !== false ? 'completed' : 'failed'
    }
  });
};

export const notifyCreatorSignup = async (userData: {
  fullName: string;
  email: string;
  penName?: string;
  company?: string;
  role?: string;
  websiteUrl?: string;
  authType?: 'email' | 'google' | 'oauth';
  success?: boolean;
  errorMessage?: string;
  invitationStatus?: string;
}) => {
  // Get current timestamp and timezone
  const now = new Date();
  const timestamp = now.toISOString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const event = userData.success !== false ? 'New Creator Signup' : 'Failed Creator Signup';
  
  await sendSlackNotification({
    event,
    userType: 'creator',
    fullName: userData.fullName,
    email: userData.email,
    company: userData.company,
    authType: userData.authType || 'email',
    timestamp: timestamp,
    timezone: timezone,
    additionalInfo: {
      penName: userData.penName,
      role: userData.role,
      websiteUrl: userData.websiteUrl,
      success: userData.success !== false,
      errorMessage: userData.errorMessage,
      invitationStatus: userData.invitationStatus,
      signupStep: userData.success !== false ? 'completed' : 'failed'
    }
  });
};

// New signin notification functions
export const notifyUserSignin = async (userData: {
  fullName?: string;
  email: string;
  accountType?: 'buyer' | 'creator' | 'unknown';
  authType?: 'email' | 'google' | 'oauth';
  success?: boolean;
  errorMessage?: string;
  redirectedTo?: string;
  tier?: string;
  invitationStatus?: string;
  sessionId?: string;
}) => {
  // Get current timestamp and timezone
  const now = new Date();
  const timestamp = now.toISOString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const event = userData.success !== false ? 'User Signin Success' : 'User Signin Failed';
  const userType = userData.accountType || 'unknown';
  
  await sendSlackNotification({
    event,
    userType: userType === 'unknown' ? 'buyer' : userType as 'buyer' | 'creator', // Fallback for typing
    fullName: userData.fullName || 'Unknown User',
    email: userData.email,
    authType: userData.authType || 'email',
    timestamp: timestamp,
    timezone: timezone,
    additionalInfo: {
      accountType: userData.accountType,
      success: userData.success !== false,
      errorMessage: userData.errorMessage,
      redirectedTo: userData.redirectedTo,
      tier: userData.tier,
      invitationStatus: userData.invitationStatus,
      sessionId: userData.sessionId?.substring(0, 8) + '...', // Only show first 8 chars for privacy
      signinAttempt: userData.success !== false ? 'successful' : 'failed',
      userAgent: navigator.userAgent?.substring(0, 100) // Truncated user agent
    }
  });
};

// Specific signin notification functions
export const notifyBuyerSignin = async (userData: {
  fullName?: string;
  email: string;
  authType?: 'email' | 'google' | 'oauth';
  success?: boolean;
  errorMessage?: string;
  tier?: string;
  redirectedTo?: string;
  company?: string;
}) => {
  await notifyUserSignin({
    ...userData,
    accountType: 'buyer',
  });
};

export const notifyCreatorSignin = async (userData: {
  fullName?: string;
  email: string;
  authType?: 'email' | 'google' | 'oauth';
  success?: boolean;
  errorMessage?: string;
  invitationStatus?: string;
  redirectedTo?: string;
  penName?: string;
}) => {
  await notifyUserSignin({
    ...userData,
    accountType: 'creator',
  });
};