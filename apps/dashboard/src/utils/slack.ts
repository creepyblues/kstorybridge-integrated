/**
 * Slack notification utilities for Dashboard app
 * Sends notifications for buyer signup and signin events
 */

// Email addresses and domains to exclude from Slack notifications
const EXCLUDED_EMAILS = [
  'kevin@sandstoneartists.com',
  'sungho@dadble.com',
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
    console.log(`[Slack] Skipping notification for excluded email: ${email}`);
    return true;
  }

  // Check domain matches
  const domain = emailLower.split('@')[1];
  if (domain && EXCLUDED_DOMAINS.includes(domain)) {
    console.log(`[Slack] Skipping notification for excluded domain: ${domain}`);
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

/**
 * Send a Slack notification via the edge function proxy
 */
export const sendSlackNotification = async (data: SlackNotificationData): Promise<void> => {
  // Check if email should be excluded from notifications
  if (shouldExcludeEmail(data.email)) {
    return;
  }

  // Use Supabase Edge Function to proxy the Slack webhook request
  const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

  const proxyUrl = `${SUPABASE_URL}/functions/v1/slack-webhook-proxy`;

  try {
    console.log('[Slack] Sending notification:', data.event);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('[Slack] Failed to send notification:', response.status, responseText);
    } else {
      console.log('[Slack] Notification sent successfully');
    }
  } catch (error) {
    console.error('[Slack] Error sending notification:', error);
  }
};

/**
 * Notify Slack of a new buyer signup
 */
export interface BuyerSignupData {
  fullName: string;
  email: string;
  company?: string;
  role?: string;
  authType: 'email' | 'google';
  linkedinUrl?: string;
}

export const notifyBuyerSignup = async (data: BuyerSignupData): Promise<void> => {
  await sendSlackNotification({
    event: 'New Buyer Signup',
    userType: 'buyer',
    fullName: data.fullName,
    email: data.email,
    company: data.company,
    authType: data.authType,
    additionalInfo: {
      role: data.role,
      linkedin_url: data.linkedinUrl,
      tier: 'basic',
    },
  });
};

/**
 * Notify Slack of a buyer signin
 */
export interface UserSigninData {
  email: string;
  authType: 'email' | 'google';
  fullName?: string;
  company?: string;
  tier?: string;
}

export const notifyUserSignin = async (data: UserSigninData): Promise<void> => {
  await sendSlackNotification({
    event: 'Buyer Signin',
    userType: 'buyer',
    fullName: data.fullName || '',
    email: data.email,
    company: data.company,
    authType: data.authType,
    additionalInfo: {
      tier: data.tier,
    },
  });
};

/**
 * Test function for debugging - available in browser console
 */
export const testSlackNotification = async () => {
  console.log('[Slack] Testing notification...');
  await sendSlackNotification({
    event: 'Test Notification',
    userType: 'buyer',
    fullName: 'Test User',
    email: 'test@example.com',
    company: 'Test Company',
    additionalInfo: {
      note: 'This is a test message from Dashboard app'
    }
  });
};

// Make test function available globally in development
if (typeof window !== 'undefined') {
  (window as typeof window & { testSlackNotification: typeof testSlackNotification }).testSlackNotification = testSlackNotification;
}
