/**
 * Slack notification utility for signup failures and other critical events
 */

// Email addresses and domains to exclude from Slack notifications
const EXCLUDED_EMAILS = [
  'kevin@sandstoneartists.com',
  'creepyblues@gmail.com', 
  'sungho101@gmail.com'
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

interface SignupFailureData {
  email?: string;
  accountType?: string;
  errorMessage: string;
  errorCode?: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  additionalContext?: Record<string, any>;
}

interface SlackMessage {
  text: string;
  blocks?: Array<any>;
  attachments?: Array<{
    color: string;
    fields: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
    footer?: string;
    ts?: number;
  }>;
}

/**
 * Send a notification to Slack about a failed signup attempt using Supabase proxy
 */
export async function notifySignupFailure(data: SignupFailureData): Promise<void> {
  // Check if email should be excluded from notifications
  if (data.email && shouldExcludeEmail(data.email)) {
    return;
  }

  // Skip in development unless explicitly enabled
  const isDevelopment = import.meta.env.DEV;
  const enableDevNotifications = import.meta.env.VITE_SLACK_ENABLE_DEV === 'true';
  
  if (isDevelopment && !enableDevNotifications) {
    console.log('Slack notifications disabled in development. Set VITE_SLACK_ENABLE_DEV=true to enable.');
    return;
  }

  try {
    const environment = import.meta.env.MODE || 'unknown';
    const appUrl = window.location.origin;
    
    // Sanitize email for privacy (show partial)
    const sanitizedEmail = data.email ? 
      data.email.replace(/^(.{2}).*(@.*)$/, '$1***$2') : 
      'Not provided';

    // Prepare notification data for the Supabase proxy
    const notificationData = {
      event: 'Signup Failure',
      userType: data.accountType || 'unknown',
      fullName: 'Failed Signup Attempt',
      email: sanitizedEmail,
      authType: data.additionalContext?.authType || 'unknown',
      timestamp: data.timestamp,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      additionalInfo: {
        errorMessage: data.errorMessage,
        errorCode: data.errorCode,
        environment,
        appUrl,
        userAgent: data.userAgent?.substring(0, 200),
        possibleReason: data.additionalContext?.possibleReason,
        suggestedAction: data.additionalContext?.suggestedAction,
        severity: data.additionalContext?.severity,
        fullContext: data.additionalContext
      }
    };

    // Use the same Supabase proxy as existing notifications
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
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Failed to send signup failure notification via proxy:', response.status, response.statusText);
      console.error('Response body:', responseText);
    }
  } catch (error) {
    // Don't throw - we don't want Slack notification failures to affect the app
    console.error('Error sending signup failure notification via proxy:', error);
  }
}

/**
 * Analyze common signup failure patterns
 */
export function analyzeSignupFailure(error: any): {
  possibleReason: string;
  suggestedAction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';

  // Supabase specific error patterns
  if (errorCode === 'user_already_exists' || errorMessage.includes('already registered')) {
    return {
      possibleReason: 'User attempted to sign up with an existing email',
      suggestedAction: 'User should try logging in or resetting password',
      severity: 'low'
    };
  }

  if (errorMessage.includes('invalid email') || errorMessage.includes('email_not_valid')) {
    return {
      possibleReason: 'Invalid email format provided',
      suggestedAction: 'Validate email format on frontend',
      severity: 'low'
    };
  }

  if (errorMessage.includes('password') && errorMessage.includes('weak')) {
    return {
      possibleReason: 'Password does not meet security requirements',
      suggestedAction: 'Show password requirements clearly',
      severity: 'low'
    };
  }

  if (errorMessage.includes('rate limit') || errorCode === '429') {
    return {
      possibleReason: 'Too many signup attempts (rate limiting)',
      suggestedAction: 'Possible spam or bot activity - investigate IP',
      severity: 'medium'
    };
  }

  if (errorMessage.includes('database') || errorMessage.includes('connection')) {
    return {
      possibleReason: 'Database connection or query error',
      suggestedAction: 'Check Supabase service status and logs',
      severity: 'critical'
    };
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      possibleReason: 'Network connectivity issue',
      suggestedAction: 'Could be user connection or API availability',
      severity: 'medium'
    };
  }

  if (errorMessage.includes('unauthorized') || errorCode === '401') {
    return {
      possibleReason: 'Authentication configuration issue',
      suggestedAction: 'Check Supabase API keys and auth settings',
      severity: 'high'
    };
  }

  if (errorMessage.includes('timeout')) {
    return {
      possibleReason: 'Request timeout - slow network or server',
      suggestedAction: 'Monitor server performance and response times',
      severity: 'medium'
    };
  }

  // Default case for unknown errors
  return {
    possibleReason: 'Unknown error occurred during signup',
    suggestedAction: 'Review full error logs for more details',
    severity: 'medium'
  };
}

/**
 * Helper to get user's IP address (if available through a service)
 * Note: This requires a backend service or third-party API
 */
export async function getUserIpAddress(): Promise<string> {
  try {
    // You can use a service like ipify or implement your own
    // For now, returning a placeholder
    return 'IP detection not implemented';
  } catch {
    return 'Unknown';
  }
}