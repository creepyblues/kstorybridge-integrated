/**
 * Auth Error Tracking Service
 *
 * Comprehensive error tracking for all authentication failures across:
 * - Email signup/signin
 * - OAuth signup/signin
 * - Profile creation
 * - Session management
 * - OAuth callbacks
 */

import { sendSlackNotification } from '@/utils/slack';

export type AuthFailureType =
  | 'signup_email'
  | 'signup_oauth'
  | 'signin_email'
  | 'signin_oauth'
  | 'oauth_callback'
  | 'profile_creation'
  | 'session_init'
  | 'password_reset';

export type AuthStage =
  | 'validation'
  | 'supabase_auth'
  | 'profile_creation'
  | 'session_init'
  | 'callback_exchange'
  | 'account_type_detection'
  | 'metadata_update'
  | 'email_verification';

export interface AuthErrorContext {
  // User Information
  email?: string;
  fullName?: string;
  accountType?: 'buyer' | 'creator';
  company?: string;

  // Error Details
  failureType: AuthFailureType;
  stage: AuthStage;
  errorCode?: string;
  errorMessage: string;

  // Technical Context
  oauthProvider?: 'google' | 'discord';
  browserInfo?: string;
  deviceType?: string;
  redirectUrl?: string;

  // Recovery Context
  recoveryAttempted?: boolean;
  recoveryMethod?: 'signin_redirect' | 'profile_retry' | 'manual_verification';

  // Additional Debug Info
  supabaseError?: any;
  profileExists?: boolean;
  sessionValid?: boolean;
  timestamp?: string;
  dashboardUrl?: string;
  referrer?: string;
}

/**
 * Get browser information for error context
 */
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

/**
 * Get device type for error context
 */
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

/**
 * Format error for better readability
 */
function formatErrorForSlack(context: AuthErrorContext): string {
  const lines: string[] = [];

  // Main error info
  lines.push(`🚨 *Auth Failure: ${context.failureType.replace(/_/g, ' ').toUpperCase()}*`);
  lines.push(`📍 Stage: ${context.stage.replace(/_/g, ' ')}`);
  lines.push(`❌ Error: ${context.errorMessage}`);

  if (context.errorCode) {
    lines.push(`🔢 Error Code: ${context.errorCode}`);
  }

  // User info
  lines.push('');
  lines.push('*User Information:*');
  lines.push(`• Email: ${context.email || 'Not provided'}`);
  lines.push(`• Name: ${context.fullName || 'Not provided'}`);
  lines.push(`• Account Type: ${context.accountType || 'Not determined'}`);
  if (context.company) {
    lines.push(`• Company: ${context.company}`);
  }

  // Technical details
  lines.push('');
  lines.push('*Technical Context:*');
  lines.push(`• Browser: ${context.browserInfo}`);
  lines.push(`• Device: ${context.deviceType}`);
  if (context.oauthProvider) {
    lines.push(`• OAuth Provider: ${context.oauthProvider}`);
  }
  if (context.profileExists !== undefined) {
    lines.push(`• Profile Exists: ${context.profileExists ? 'Yes' : 'No'}`);
  }
  if (context.sessionValid !== undefined) {
    lines.push(`• Session Valid: ${context.sessionValid ? 'Yes' : 'No'}`);
  }

  // Recovery info
  if (context.recoveryAttempted) {
    lines.push('');
    lines.push('*Recovery Attempted:*');
    lines.push(`• Method: ${context.recoveryMethod || 'Unknown'}`);
  }

  // URLs for debugging
  lines.push('');
  lines.push('*Debug URLs:*');
  lines.push(`• Dashboard: ${context.dashboardUrl}`);
  if (context.referrer) {
    lines.push(`• Referrer: ${context.referrer}`);
  }
  if (context.redirectUrl) {
    lines.push(`• Redirect URL: ${context.redirectUrl}`);
  }

  return lines.join('\n');
}

/**
 * Track and report authentication failure to Slack
 */
export async function trackAuthError(
  error: Error | unknown,
  context: Partial<AuthErrorContext>
): Promise<void> {
  try {
    // Ensure we have required fields
    const fullContext: AuthErrorContext = {
      failureType: context.failureType || 'signin_email',
      stage: context.stage || 'supabase_auth',
      errorMessage: error instanceof Error ? error.message : String(error),
      ...context,

      // Add automatic context
      browserInfo: context.browserInfo || getBrowserInfo(),
      deviceType: context.deviceType || getDeviceType(),
      timestamp: new Date().toISOString(),
      dashboardUrl: window.location.href,
      referrer: document.referrer || 'Direct'
    };

    // Extract error code if available
    if (error && typeof error === 'object' && 'code' in error) {
      fullContext.errorCode = String((error as any).code);
    }

    // Store raw Supabase error for debugging
    if (error && typeof error === 'object') {
      fullContext.supabaseError = error;
    }

    console.error('🚨 Auth Error Tracked:', fullContext);

    // Send to Slack (with blacklist filtering)
    await sendSlackNotification({
      event: 'Auth Failure Alert 🚨',
      userType: fullContext.accountType || 'buyer',
      fullName: fullContext.fullName || 'Unknown User',
      email: fullContext.email || 'unknown@error.auth',
      additionalInfo: {
        formatted_message: formatErrorForSlack(fullContext),
        ...fullContext
      }
    });

  } catch (trackingError) {
    // Don't let tracking errors break the auth flow
    console.error('Failed to track auth error:', trackingError);
  }
}

/**
 * Helper function for signup errors
 */
export async function trackSignupError(
  error: Error | unknown,
  email: string,
  accountType: 'buyer' | 'creator',
  isOAuth: boolean,
  additionalContext?: Partial<AuthErrorContext>
): Promise<void> {
  return trackAuthError(error, {
    email,
    accountType,
    failureType: isOAuth ? 'signup_oauth' : 'signup_email',
    ...additionalContext
  });
}

/**
 * Helper function for signin errors
 */
export async function trackSigninError(
  error: Error | unknown,
  email: string,
  isOAuth: boolean,
  additionalContext?: Partial<AuthErrorContext>
): Promise<void> {
  return trackAuthError(error, {
    email,
    failureType: isOAuth ? 'signin_oauth' : 'signin_email',
    ...additionalContext
  });
}

/**
 * Helper function for OAuth callback errors
 */
export async function trackOAuthCallbackError(
  error: Error | unknown,
  stage: AuthStage,
  additionalContext?: Partial<AuthErrorContext>
): Promise<void> {
  return trackAuthError(error, {
    failureType: 'oauth_callback',
    stage,
    ...additionalContext
  });
}

/**
 * Helper function for profile creation errors
 */
export async function trackProfileCreationError(
  error: Error | unknown,
  email: string,
  accountType: 'buyer' | 'creator',
  additionalContext?: Partial<AuthErrorContext>
): Promise<void> {
  return trackAuthError(error, {
    email,
    accountType,
    failureType: 'profile_creation',
    stage: 'profile_creation',
    ...additionalContext
  });
}

/**
 * Helper function for validation errors (before hitting Supabase)
 */
export async function trackValidationError(
  errorMessage: string,
  email: string,
  accountType?: 'buyer' | 'creator',
  additionalContext?: Partial<AuthErrorContext>
): Promise<void> {
  return trackAuthError(new Error(errorMessage), {
    email,
    accountType,
    stage: 'validation',
    ...additionalContext
  });
}