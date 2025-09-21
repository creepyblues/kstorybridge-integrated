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

import { supabase, withRetry, isNetworkError, performSupabaseHealthCheck } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

// Session integrity and corruption detection
const SESSION_INTEGRITY_CHECKS = {
  minTokenLength: 20,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  requiredFields: ['access_token', 'user'],
  suspiciousPatterns: ['undefined', 'null', 'NaN', '{}', '[]']
};

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
  performIntegrityCheck?: boolean;
  attemptRecovery?: boolean;
}

export interface SessionOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  retryCount?: number;
  recoveryAttempted?: boolean;
  performanceMetrics?: {
    duration: number;
    retries: number;
  };
}

/**
 * Enhanced session integrity validator
 */
export function validateSessionIntegrity(session: Session | null): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!session) {
    issues.push('No session provided');
    recommendations.push('User should sign in');
    return { isValid: false, issues, recommendations };
  }

  // Check access token
  if (!session.access_token || session.access_token.length < SESSION_INTEGRITY_CHECKS.minTokenLength) {
    issues.push('Invalid or missing access token');
    recommendations.push('Session should be refreshed or user re-authenticated');
  }

  // Check for suspicious token content
  const hasSuspiciousContent = SESSION_INTEGRITY_CHECKS.suspiciousPatterns.some(pattern => 
    session.access_token.includes(pattern)
  );
  if (hasSuspiciousContent) {
    issues.push('Access token contains suspicious patterns');
    recommendations.push('Clear session storage and re-authenticate');
  }

  // Check user object
  if (!session.user) {
    issues.push('Session missing user data');
    recommendations.push('Session is corrupted, user should sign in again');
  } else {
    if (!session.user.id || !session.user.email) {
      issues.push('User data incomplete (missing id or email)');
      recommendations.push('Session corruption detected, re-authentication required');
    }
  }

  // Check expiration
  if (session.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = session.expires_at - now;
    
    if (timeUntilExpiry < 0) {
      issues.push(`Session expired ${Math.abs(timeUntilExpiry)} seconds ago`);
      recommendations.push('Refresh session or re-authenticate');
    } else if (timeUntilExpiry < 300) { // Less than 5 minutes
      issues.push(`Session expires soon (${timeUntilExpiry} seconds)`);
      recommendations.push('Proactive session refresh recommended');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
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
 * Atomic session operations with proper locking
 */
const sessionOperationLocks = new Map<string, Promise<any>>();

/**
 * Performs atomic session cleanup
 */
export async function performSessionCleanup(): Promise<{
  cleaned: boolean;
  itemsRemoved: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let itemsRemoved = 0;
  
  try {
    console.log('🧹 Session Manager: Starting comprehensive session cleanup');
    const isAuthCallback = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback');
    
    // Clear localStorage items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const isSupabaseToken = key.startsWith('sb-') && key.endsWith('-auth-token');
      if (isAuthCallback && isSupabaseToken) {
        console.log('🛡️ Session Manager: Preserving PKCE storage during auth callback:', key);
        continue;
      }
      if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        itemsRemoved++;
      } catch (error) {
        errors.push(`Failed to remove localStorage key ${key}: ${error}`);
      }
    });
    
    // Clear sessionStorage items
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('oauth'))) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key);
        itemsRemoved++;
      } catch (error) {
        errors.push(`Failed to remove sessionStorage key ${key}: ${error}`);
      }
    });
    
    // Clear any auth-related cookies
    try {
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          itemsRemoved++;
        }
      });
    } catch (error) {
      errors.push(`Failed to clear cookies: ${error}`);
    }
    
    console.log(`✅ Session Manager: Cleanup completed - removed ${itemsRemoved} items`);
    
    return {
      cleaned: true,
      itemsRemoved,
      errors
    };
  } catch (error) {
    errors.push(`General cleanup error: ${error}`);
    return {
      cleaned: false,
      itemsRemoved,
      errors
    };
  }
}

/**
 * Enhanced session recovery with atomic operations
 */
export async function recoverCorruptedSession(): Promise<{
  recovered: boolean;
  method: 'refresh' | 'cleanup' | 'none';
  error?: string;
}> {
  try {
    console.log('🔧 Session Manager: Starting session recovery process');
    
    // First, try to get current session and validate it
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const integrity = validateSessionIntegrity(session);
      
      if (integrity.isValid) {
        console.log('✅ Session Manager: Session is valid, no recovery needed');
        return { recovered: true, method: 'none' };
      }
      
      console.log('⚠️ Session Manager: Session integrity issues detected:', integrity.issues);
      
      // Try refresh first if token exists
      if (session.refresh_token) {
        console.log('🔄 Session Manager: Attempting session refresh');
        const refreshResult = await refreshSessionIfNeeded(session);
        
        if (refreshResult.refreshed && refreshResult.session) {
          const newIntegrity = validateSessionIntegrity(refreshResult.session);
          if (newIntegrity.isValid) {
            console.log('✅ Session Manager: Session successfully recovered via refresh');
            return { recovered: true, method: 'refresh' };
          }
        }
      }
    }
    
    // If refresh failed or no session, perform cleanup
    console.log('🧹 Session Manager: Attempting recovery via cleanup');
    const cleanup = await performSessionCleanup();
    
    if (cleanup.cleaned) {
      console.log('✅ Session Manager: Session recovered via cleanup');
      return { recovered: true, method: 'cleanup' };
    } else {
      return {
        recovered: false,
        method: 'cleanup',
        error: `Cleanup failed: ${cleanup.errors.join(', ')}`
      };
    }
  } catch (error) {
    console.error('❌ Session Manager: Recovery failed:', error);
    return {
      recovered: false,
      method: 'none',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
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
 * Enhanced session getter with integrity validation and atomic operations
 */
export async function getCurrentSession(): Promise<Session | null> {
  const lockKey = 'getCurrentSession';
  const isAuthCallback = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback');
  
  // Prevent concurrent session operations
  if (sessionOperationLocks.has(lockKey)) {
    try {
      return await sessionOperationLocks.get(lockKey);
    } catch (error) {
      console.warn('⚠️ Session Manager: Concurrent session operation failed, proceeding with new one');
      sessionOperationLocks.delete(lockKey);
    }
  }

  const operation = async (): Promise<Session | null> => {
    try {
      console.log('🔍 Session Manager: Getting current session with enhanced validation');
      
      // Use enhanced Supabase client with retry logic
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session Manager: Error getting session:', error);
        
        // If error is due to corrupted session, attempt recovery
        if (!isAuthCallback && (error.message?.includes('invalid') || error.message?.includes('corrupt'))) {
          console.log('🔧 Session Manager: Attempting session recovery due to error');
          const recovery = await recoverCorruptedSession();
          if (recovery.recovered) {
            // Retry getting session after recovery
            const { data: { session: recoveredSession } } = await supabase.auth.getSession();
            return recoveredSession;
          }
        }
        return null;
      }
      
      if (!session) {
        console.log('ℹ️ Session Manager: No active session found');
        return null;
      }

      // Validate session integrity
      const integrity = validateSessionIntegrity(session);
      
      if (!integrity.isValid) {
        console.warn('⚠️ Session Manager: Session integrity issues:', integrity.issues);
        
        // Attempt recovery for corrupted session
        if (!isAuthCallback) {
          const recovery = await recoverCorruptedSession();
          if (!recovery.recovered) {
            console.error('❌ Session Manager: Session recovery failed');
            return null;
          }
          
          // Get session again after recovery
          const { data: { session: recoveredSession } } = await supabase.auth.getSession();
          return recoveredSession;
        }
        return session;
      }

      // Check if session needs refresh
      const refreshResult = await refreshSessionIfNeeded(session);
      const finalSession = refreshResult.session || session;
      
      // Final integrity check
      const finalIntegrity = validateSessionIntegrity(finalSession);
      if (!finalIntegrity.isValid) {
        console.error('❌ Session Manager: Final session integrity check failed');
        return null;
      }
      
      console.log('✅ Session Manager: Retrieved valid session for user:', finalSession?.user?.email);
      return finalSession;
    } catch (error) {
      console.error('❌ Session Manager: Exception in getCurrentSession:', error);
      
      // If it's a network error, attempt recovery
      if (!isAuthCallback && isNetworkError(error)) {
        console.log('🔧 Session Manager: Network error detected, attempting recovery');
        try {
          const recovery = await recoverCorruptedSession();
          if (recovery.recovered) {
            const { data: { session } } = await supabase.auth.getSession();
            return session;
          }
        } catch (recoveryError) {
          console.error('❌ Session Manager: Recovery attempt failed:', recoveryError);
        }
      }
      
      return null;
    }
  };

  // Store operation in lock map
  sessionOperationLocks.set(lockKey, operation());
  
  try {
    const result = await sessionOperationLocks.get(lockKey);
    return result;
  } finally {
    sessionOperationLocks.delete(lockKey);
  }
}

/**
 * Comprehensive session health check with detailed diagnostics
 */
export async function performSessionHealthCheck(): Promise<{
  healthy: boolean;
  session?: Session;
  issues: string[];
  recommendations: string[];
  diagnostics: {
    supabaseHealth: any;
    sessionIntegrity: any;
    performanceMetrics: {
      responseTime: number;
      networkConnectivity: 'ok' | 'slow' | 'failed';
    };
  };
}> {
  const startTime = Date.now();
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    console.log('🏥 Session Manager: Starting comprehensive health check');
    
    // Check Supabase connectivity first
    const supabaseHealth = await performSupabaseHealthCheck();
    
    if (!supabaseHealth.healthy) {
      issues.push(`Supabase connectivity issue: ${supabaseHealth.error}`);
      recommendations.push('Check network connection and Supabase status');
    }
    
    // Get session with enhanced validation
    const session = await getCurrentSession();

    if (!session) {
      issues.push('No active session found');
      recommendations.push('User should sign in again');
      
      const responseTime = Date.now() - startTime;
      return {
        healthy: false,
        issues,
        recommendations,
        diagnostics: {
          supabaseHealth,
          sessionIntegrity: null,
          performanceMetrics: {
            responseTime,
            networkConnectivity: responseTime < 1000 ? 'ok' : responseTime < 5000 ? 'slow' : 'failed'
          }
        }
      };
    }

    // Comprehensive session integrity check
    const sessionIntegrity = validateSessionIntegrity(session);
    
    if (!sessionIntegrity.isValid) {
      issues.push(...sessionIntegrity.issues);
      recommendations.push(...sessionIntegrity.recommendations);
    }

    // Additional health checks
    
    // Check expiration with multiple time windows
    if (isSessionExpiredOrExpiring(session, 1)) { // 1-minute buffer - critical
      issues.push('Session expired or expires within 1 minute (CRITICAL)');
      recommendations.push('Immediate session refresh or re-authentication required');
    } else if (isSessionExpiredOrExpiring(session, 5)) { // 5-minute buffer - warning
      issues.push('Session expires within 5 minutes (WARNING)');
      recommendations.push('Proactive session refresh recommended');
    } else if (isSessionExpiredOrExpiring(session, 15)) { // 15-minute buffer - info
      issues.push('Session expires within 15 minutes (INFO)');
      recommendations.push('Consider refreshing session soon');
    }

    // Check user data completeness
    if (session.user) {
      if (!session.user.id || session.user.id.length < 10) {
        issues.push('User ID missing or invalid');
        recommendations.push('Session corruption detected, re-authentication required');
      }
      
      if (!session.user.email || !session.user.email.includes('@')) {
        issues.push('User email missing or invalid');
        recommendations.push('Session corruption detected, re-authentication required');
      }
      
      if (session.user.email_confirmed_at === null) {
        issues.push('User email not verified');
        recommendations.push('Email verification may be required');
      }
    }
    
    // Check for account type metadata
    const accountType = session.user?.user_metadata?.account_type;
    if (!accountType) {
      issues.push('Account type metadata missing');
      recommendations.push('Account type detection may fail, consider re-authentication');
    } else if (accountType !== 'buyer' && accountType !== 'creator') {
      issues.push(`Invalid account type: ${accountType}`);
      recommendations.push('Account type metadata corrupted, consider re-authentication');
    }

    const responseTime = Date.now() - startTime;
    const healthy = issues.filter(issue => !issue.includes('INFO')).length === 0;
    
    const result = {
      healthy,
      session,
      issues,
      recommendations,
      diagnostics: {
        supabaseHealth,
        sessionIntegrity,
        performanceMetrics: {
          responseTime,
          networkConnectivity: (responseTime < 1000 ? 'ok' : responseTime < 5000 ? 'slow' : 'failed') as 'ok' | 'slow' | 'failed'
        }
      }
    };
    
    console.log(`🏥 Session Manager: Health check ${healthy ? 'PASSED' : 'FAILED'}`, {
      healthy,
      userId: session.user?.id,
      email: session.user?.email,
      accountType,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
      responseTime: `${responseTime}ms`,
      issueCount: issues.length,
      criticalIssues: issues.filter(i => i.includes('CRITICAL')).length
    });

    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    issues.push(`Health check exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    recommendations.push('System error occurred, check logs and attempt session recovery');
    
    console.error('❌ Session Manager: Health check failed with exception:', error);
    
    return {
      healthy: false,
      issues,
      recommendations,
      diagnostics: {
        supabaseHealth: { healthy: false, error: 'Health check failed' },
        sessionIntegrity: null,
        performanceMetrics: {
          responseTime,
          networkConnectivity: 'failed'
        }
      }
    };
  }
}
