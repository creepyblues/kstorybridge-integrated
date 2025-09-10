/**
 * Robust Session Management Utility
 * 
 * This module provides comprehensive session management with proper error handling,
 * recovery mechanisms, and validation to prevent common session-related failures.
 * 
 * Key Features:
 * - Robust URL token validation
 * - Session recovery mechanisms
 * - Token expiry handling
 * - Race condition protection
 * - Graceful error recovery
 */

import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export interface SessionData {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sessionData?: SessionData;
}

export interface SessionRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackToRefresh?: boolean;
  clearUrlOnFailure?: boolean;
}

/**
 * Validates session tokens from URL parameters
 */
export function validateSessionTokens(urlParams: URLSearchParams): SessionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const accessToken = urlParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token');
  const expiresAtStr = urlParams.get('expires_at');
  const tokenType = urlParams.get('token_type');

  // Validate access token
  if (!accessToken) {
    errors.push('Missing access_token parameter');
    return { isValid: false, errors, warnings };
  }

  // Enhanced access token validation
  if (accessToken.length < 20) {
    errors.push('Access token appears too short (possibly corrupted)');
  }

  // Validate token format (JWT should have 3 parts separated by dots)
  const tokenParts = accessToken.split('.');
  if (tokenParts.length !== 3) {
    errors.push('Access token does not appear to be a valid JWT format');
  }

  // Check for suspicious characters or encoding issues
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken)) {
    warnings.push('Access token contains unexpected characters');
  }

  // Validate expiration
  if (expiresAtStr) {
    const expiresAt = parseInt(expiresAtStr);
    if (isNaN(expiresAt)) {
      warnings.push('Invalid expires_at parameter format');
    } else {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 0) {
        errors.push(`Token expired ${Math.abs(timeUntilExpiry)} seconds ago`);
      } else if (timeUntilExpiry < 300) { // Less than 5 minutes
        warnings.push(`Token expires soon (${timeUntilExpiry} seconds)`);
      }
    }
  }

  // Validate refresh token if present
  if (refreshToken && refreshToken.length < 20) {
    warnings.push('Refresh token appears unusually short');
  }

  // Validate token type
  if (tokenType && tokenType.toLowerCase() !== 'bearer') {
    warnings.push(`Unexpected token type: ${tokenType}`);
  }

  const sessionData: SessionData = {
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
    expires_at: expiresAtStr ? parseInt(expiresAtStr) : undefined,
    token_type: tokenType || 'bearer'
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sessionData
  };
}

/**
 * Attempts to set session with retry and recovery mechanisms
 */
export async function setSessionWithRecovery(
  sessionData: SessionData,
  options: SessionRecoveryOptions = {}
): Promise<{ success: boolean; session?: Session; error?: string }> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    fallbackToRefresh = true,
    clearUrlOnFailure = true
  } = options;

  let lastError: string | undefined;

  // Attempt to set session with retries
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Session Manager: Attempt ${attempt}/${maxRetries} to set session`);
      
      const { data: { session }, error } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token || ''
      });

      if (error) {
        lastError = error.message;
        console.warn(`⚠️ Session Manager: Attempt ${attempt} failed:`, error.message);
        
        // If this is the last attempt or not a retryable error, break
        if (attempt === maxRetries || !isRetryableError(error.message)) {
          break;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        continue;
      }

      if (session?.user) {
        console.log('✅ Session Manager: Successfully set session for user:', session.user.email);
        return { success: true, session };
      } else {
        lastError = 'No session or user returned from setSession';
        console.warn(`⚠️ Session Manager: Attempt ${attempt} - no session returned`);
      }

    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ Session Manager: Attempt ${attempt} threw exception:`, err);
    }

    // Wait before retry (except on last attempt)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }

  // If all retries failed, try refresh token as fallback
  if (fallbackToRefresh && sessionData.refresh_token) {
    console.log('🔄 Session Manager: Attempting refresh token fallback');
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession({
        refresh_token: sessionData.refresh_token
      });

      if (!error && session?.user) {
        console.log('✅ Session Manager: Successfully recovered session using refresh token');
        return { success: true, session };
      } else {
        console.warn('⚠️ Session Manager: Refresh token fallback failed:', error?.message);
      }
    } catch (err) {
      console.error('❌ Session Manager: Refresh token fallback threw exception:', err);
    }
  }

  // Clear URL parameters if requested
  if (clearUrlOnFailure) {
    console.log('🧹 Session Manager: Clearing URL parameters after failure');
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  return { success: false, error: lastError || 'Unknown session error' };
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(errorMessage: string): boolean {
  const retryableErrors = [
    'network',
    'timeout',
    'connection',
    'temporary',
    'rate limit',
    'server error',
    '500',
    '502',
    '503',
    '504'
  ];

  const message = errorMessage.toLowerCase();
  return retryableErrors.some(error => message.includes(error));
}

/**
 * Checks if the current session is expired or about to expire
 */
export function isSessionExpiredOrExpiring(session: Session | null, bufferMinutes = 5): boolean {
  if (!session) return true;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  const bufferSeconds = bufferMinutes * 60;
  
  return (expiresAt - now) <= bufferSeconds;
}

/**
 * Attempts to refresh session if it's expired or about to expire
 */
export async function refreshSessionIfNeeded(
  session: Session | null
): Promise<{ refreshed: boolean; session?: Session; error?: string }> {
  if (!session) {
    return { refreshed: false, error: 'No session to refresh' };
  }

  if (!isSessionExpiredOrExpiring(session)) {
    return { refreshed: false, session }; // No refresh needed
  }

  console.log('🔄 Session Manager: Session is expired/expiring, attempting refresh...');

  try {
    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('❌ Session Manager: Failed to refresh session:', error.message);
      return { refreshed: false, error: error.message };
    }

    if (refreshedSession?.user) {
      console.log('✅ Session Manager: Successfully refreshed session');
      return { refreshed: true, session: refreshedSession };
    }

    return { refreshed: false, error: 'No refreshed session returned' };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown refresh error';
    console.error('❌ Session Manager: Exception during refresh:', err);
    return { refreshed: false, error: errorMessage };
  }
}

/**
 * Handles session initialization from URL parameters with comprehensive error handling
 */
export async function initializeSessionFromUrl(): Promise<{
  success: boolean;
  session?: Session;
  error?: string;
  shouldClearUrl?: boolean;
}> {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (!urlParams.has('access_token')) {
    return { success: false, error: 'No access token in URL' };
  }

  console.log('🔍 Session Manager: Found access token in URL, validating...');

  // Validate tokens
  const validation = validateSessionTokens(urlParams);
  
  // Log validation results
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Session Manager: Token validation warnings:', validation.warnings);
  }
  
  if (!validation.isValid) {
    console.error('❌ Session Manager: Token validation failed:', validation.errors);
    return { 
      success: false, 
      error: `Invalid tokens: ${validation.errors.join(', ')}`,
      shouldClearUrl: true
    };
  }

  // Attempt to set session with recovery
  const result = await setSessionWithRecovery(validation.sessionData!, {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackToRefresh: true,
    clearUrlOnFailure: true
  });

  if (result.success && result.session) {
    // Clear URL parameters on success
    window.history.replaceState({}, document.title, window.location.pathname);
    console.log('🧹 Session Manager: Cleaned up URL after successful session initialization');
  }

  return {
    success: result.success,
    session: result.session,
    error: result.error,
    shouldClearUrl: !result.success
  };
}

/**
 * Safe session getter with automatic refresh
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;

    // Check if session needs refresh
    const refreshResult = await refreshSessionIfNeeded(session);
    
    return refreshResult.session || session;
  } catch (error) {
    console.error('❌ Session Manager: Error getting current session:', error);
    return null;
  }
}

/**
 * Session health check - validates current session status
 */
export async function performSessionHealthCheck(): Promise<{
  healthy: boolean;
  session?: Session;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    const session = await getCurrentSession();

    if (!session) {
      issues.push('No active session found');
      recommendations.push('User should sign in again');
      return { healthy: false, issues, recommendations };
    }

    if (!session.user) {
      issues.push('Session exists but no user data');
      recommendations.push('Session may be corrupted, should re-authenticate');
      return { healthy: false, session, issues, recommendations };
    }

    // Check expiration
    if (isSessionExpiredOrExpiring(session, 10)) { // 10-minute buffer
      issues.push('Session is expired or expiring soon');
      recommendations.push('Session should be refreshed');
    }

    // Check access token validity
    if (!session.access_token || session.access_token.length < 20) {
      issues.push('Access token appears invalid or corrupted');
      recommendations.push('User should sign in again');
      return { healthy: false, session, issues, recommendations };
    }

    const healthy = issues.length === 0;
    
    console.log(`🏥 Session Manager: Health check ${healthy ? 'PASSED' : 'FAILED'}`, {
      healthy,
      userId: session.user.id,
      email: session.user.email,
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
      issues,
      recommendations
    });

    return { healthy, session, issues, recommendations };
  } catch (error) {
    issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    recommendations.push('System error occurred, check logs and retry');
    return { healthy: false, issues, recommendations };
  }
}