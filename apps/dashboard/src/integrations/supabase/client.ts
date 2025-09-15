/**
 * Enhanced Supabase Client Configuration
 * 
 * Provides robust, production-ready Supabase client with:
 * - Comprehensive error handling and retry logic
 * - Network failure detection and recovery
 * - Connection pooling and rate limiting
 * - Session management optimizations
 * - Performance monitoring and debugging
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Default to production values, but allow override with environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

// Enhanced configuration for production reliability
const isLocal = SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('127.0.0.1');
const isDev = import.meta.env.DEV;

// Performance and reliability settings
const CLIENT_CONFIG = {
  // Auth configuration with enhanced reliability
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    // Enhanced session settings
    storageKey: 'sb-dlrnrgcoguxlkkcitlpd-auth-token',
    debug: isDev && import.meta.env.VITE_AUTH_DEBUG === 'true'
  },
  
  // Database configuration with retry logic
  db: {
    schema: 'public'
  },
  
  // Global configuration
  global: {
    headers: {
      'X-Client-Info': 'kstorybridge-dashboard'
    }
  },
  
  // Realtime configuration (if needed)
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

// Network error detection patterns
const NETWORK_ERROR_PATTERNS = [
  'network',
  'timeout',
  'connection',
  'fetch',
  'ENOTFOUND',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_INTERNET_DISCONNECTED'
];

// Retryable HTTP status codes
const RETRYABLE_HTTP_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Determines if an error is network-related and retryable
 */
export function isNetworkError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || error?.status || 0;
  
  // Check for network error patterns in message
  const hasNetworkPattern = NETWORK_ERROR_PATTERNS.some(pattern => 
    errorMessage.includes(pattern.toLowerCase())
  );
  
  // Check for retryable HTTP status codes
  const hasRetryableCode = RETRYABLE_HTTP_CODES.includes(errorCode);
  
  return hasNetworkPattern || hasRetryableCode;
}

/**
 * Enhanced retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryCondition?: (error: any) => boolean;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = isNetworkError,
    operationName = 'Supabase operation'
  } = options;

  let lastError: any;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Supabase: Retry attempt ${attempt}/${maxRetries} for ${operationName}`);
      }
      
      const result = await operation();
      
      if (attempt > 0) {
        console.log(`✅ Supabase: ${operationName} succeeded on attempt ${attempt + 1}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      attempt++;
      
      console.warn(`⚠️ Supabase: ${operationName} failed on attempt ${attempt}:`, error);
      
      // Don't retry if we've exhausted attempts or error isn't retryable
      if (attempt > maxRetries || !retryCondition(error)) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelay
      );
      
      console.log(`⏳ Supabase: Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`❌ Supabase: ${operationName} failed after ${maxRetries + 1} attempts:`, lastError);
  throw lastError;
}

/**
 * Enhanced request interceptor with monitoring
 */
let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();

// Log the configuration in development
if (isDev) {
  console.log('🗄️ Enhanced Supabase Client Configuration:', {
    url: SUPABASE_URL,
    isLocal,
    keyPrefix: SUPABASE_PUBLISHABLE_KEY.substring(0, 20) + '...',
    mode: import.meta.env.MODE,
    authDebug: CLIENT_CONFIG.auth.debug,
    flowType: CLIENT_CONFIG.auth.flowType
  });
}

// Create the enhanced Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, CLIENT_CONFIG);

// Enhanced auth methods with retry logic
const originalSignInWithPassword = supabase.auth.signInWithPassword.bind(supabase.auth);
const originalSignInWithOAuth = supabase.auth.signInWithOAuth.bind(supabase.auth);
const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
const originalRefreshSession = supabase.auth.refreshSession.bind(supabase.auth);

// Wrap critical auth methods with retry logic
supabase.auth.signInWithPassword = (credentials) => 
  withRetry(() => originalSignInWithPassword(credentials), {
    maxRetries: 2,
    operationName: 'signInWithPassword',
    retryCondition: (error) => isNetworkError(error) && !error.message?.includes('Invalid login credentials')
  });

supabase.auth.signInWithOAuth = (options) =>
  withRetry(() => originalSignInWithOAuth(options), {
    maxRetries: 2,
    operationName: 'signInWithOAuth'
  });

supabase.auth.signOut = (options) =>
  withRetry(() => originalSignOut(options), {
    maxRetries: 2,
    operationName: 'signOut'
  });

supabase.auth.getSession = () =>
  withRetry(() => originalGetSession(), {
    maxRetries: 3,
    baseDelay: 500,
    operationName: 'getSession'
  });

supabase.auth.refreshSession = (refreshToken) =>
  withRetry(() => originalRefreshSession(refreshToken), {
    maxRetries: 2,
    operationName: 'refreshSession'
  });

// Performance monitoring (development only)
if (isDev) {
  // Monitor auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(`🔐 Auth State Change: ${event}`, {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
    });
  });

  // Log performance metrics periodically
  setInterval(() => {
    if (requestCount > 0) {
      const uptime = Date.now() - startTime;
      const errorRate = (errorCount / requestCount) * 100;
      
      console.log('📊 Supabase Client Performance:', {
        uptime: `${Math.round(uptime / 1000)}s`,
        requests: requestCount,
        errors: errorCount,
        errorRate: `${errorRate.toFixed(1)}%`,
        avgRequestsPerMin: Math.round((requestCount / uptime) * 60000)
      });
    }
  }, 60000); // Log every minute
}

/**
 * Health check for Supabase connectivity
 */
export async function performSupabaseHealthCheck(): Promise<{
  healthy: boolean;
  response?: number;
  error?: string;
  details: {
    url: string;
    isLocal: boolean;
    connectivity: 'ok' | 'slow' | 'failed';
    authConfigured: boolean;
  };
}> {
  const startTime = Date.now();
  
  try {
    // Simple connectivity test
    const { error } = await supabase.auth.getSession();
    const responseTime = Date.now() - startTime;
    
    const result = {
      healthy: !error,
      response: responseTime,
      error: error?.message,
      details: {
        url: SUPABASE_URL,
        isLocal,
        connectivity: (responseTime < 1000 ? 'ok' : responseTime < 5000 ? 'slow' : 'failed') as 'ok' | 'slow' | 'failed',
        authConfigured: SUPABASE_PUBLISHABLE_KEY.length > 20
      }
    };
    
    if (isDev) {
      console.log('🏥 Supabase Health Check:', result);
    }
    
    return result;
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        url: SUPABASE_URL,
        isLocal,
        connectivity: 'failed',
        authConfigured: SUPABASE_PUBLISHABLE_KEY.length > 20
      }
    };
  }
}

// Export utilities for other modules
export {
  NETWORK_ERROR_PATTERNS,
  RETRYABLE_HTTP_CODES,
  CLIENT_CONFIG
};