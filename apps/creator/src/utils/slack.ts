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
  const SUPABASE_ANON_KEY = "sb_publishable_Xvhpwj9CpHUOIeFAJHm3ZQ_WdQvqJDS";

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

/**
 * Notify Slack of a creator returning to the app after >12h idle.
 * Fired by useActivityBeacon on app load when the gap between visits exceeds
 * the threshold. Distinct from "Creator Signin" so persisted-session returns
 * are visible separately from real sign-ins.
 */
export interface CreatorReturnData {
  email: string;
  fullName?: string;
  penName?: string;
  idleHours: number;
  lastActiveAt: string;
}

export const notifyCreatorReturn = async (data: CreatorReturnData): Promise<void> => {
  await sendSlackNotification({
    event: 'Creator Returned',
    userType: 'creator',
    fullName: data.fullName || '',
    email: data.email,
    additionalInfo: {
      idle_hours: formatIdleHours(data.idleHours),
      last_active_at: data.lastActiveAt,
      pen_name: data.penName,
    },
  });
};

const formatIdleHours = (hours: number): string => {
  const rounded = Math.round(hours);
  if (rounded < 24) return `${rounded}h`;
  const days = Math.floor(rounded / 24);
  const remainder = rounded % 24;
  return remainder === 0 ? `${days}d` : `${days}d ${remainder}h`;
};
