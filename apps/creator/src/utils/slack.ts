/**
 * Slack notification utilities for Creator app
 * Sends notifications for creator signup and signin events
 */

const EXCLUDED_EMAILS = [
  'kevin@sandstoneartists.com',
  'sungho@kstorybridge.com',
  'creepyblues@gmail.com'
];

const EXCLUDED_DOMAINS = [
  'dadble.com',
  'kstorybridge.com'
];

const shouldExcludeEmail = (email: string): boolean => {
  if (!email) return false;

  const emailLower = email.toLowerCase();

  if (EXCLUDED_EMAILS.some(excluded => excluded.toLowerCase() === emailLower)) {
    console.log(`[Slack] Skipping notification for excluded email: ${email}`);
    return true;
  }

  const domain = emailLower.split('@')[1];
  if (domain && EXCLUDED_DOMAINS.includes(domain)) {
    console.log(`[Slack] Skipping notification for excluded domain: ${domain}`);
    return true;
  }

  return false;
};

interface SlackNotificationData {
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

const sendSlackNotification = async (data: SlackNotificationData): Promise<void> => {
  if (shouldExcludeEmail(data.email)) {
    return;
  }

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

export interface CreatorSignupData {
  fullName: string;
  email: string;
  penName: string;
  ipOwnerRole: string;
  company?: string;
  authType: 'email' | 'google';
}

export const notifyCreatorSignup = async (data: CreatorSignupData): Promise<void> => {
  await sendSlackNotification({
    event: 'New Creator Signup',
    userType: 'creator',
    fullName: data.fullName,
    email: data.email,
    company: data.company,
    authType: data.authType,
    additionalInfo: {
      pen_name: data.penName,
      ip_owner_role: data.ipOwnerRole,
    },
  });
};

export interface CreatorSigninData {
  email: string;
  authType: 'email' | 'google';
  fullName?: string;
}

export const notifyCreatorSignin = async (data: CreatorSigninData): Promise<void> => {
  await sendSlackNotification({
    event: 'Creator Signin',
    userType: 'creator',
    fullName: data.fullName || '',
    email: data.email,
    authType: data.authType,
  });
};
