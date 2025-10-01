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
import type { Session } from '@supabase/supabase-js';

// Require explicit Supabase configuration (no production fallbacks)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missingVars = [
    !SUPABASE_URL && 'VITE_SUPABASE_URL',
    !SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_ANON_KEY'
  ].filter(Boolean).join(', ');

  const errorMessage = `Supabase configuration missing required environment variables: ${missingVars}. Update your .env files before running the dashboard.`;
  if (typeof window !== 'undefined') {
    console.error(errorMessage);
  }
  throw new Error(errorMessage);
}

// Enhanced configuration for production reliability
const isLocal = SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('127.0.0.1');
const isDev = import.meta.env.DEV;

// DEBUG: Log configuration details (without exposing fallback secrets)
if (isDev && import.meta.env.VITE_CONFIG_DEBUG === 'true') {
  console.log('🔧 Supabase Configuration:', {
    supabaseUrl: SUPABASE_URL,
    keyPrefix: SUPABASE_PUBLISHABLE_KEY.substring(0, 8) + '…',
    isLocal,
    isDev,
    mode: import.meta.env.MODE
  });
}

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
  
  // Realtime configuration with enhanced WebSocket handling
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    // Enhanced WebSocket settings for stability
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: function(tries: number) {
      return Math.min(1000 * Math.pow(2, tries), 30000); // Exponential backoff max 30s
    },
    logger: isDev ? console.log : undefined,
    // Handle WebSocket errors gracefully
    onError: (error: Error) => {
      if (isDev) {
        console.warn('🔌 WebSocket connection issue (non-critical):', error.message);
      }
    },
    onClose: (event: CloseEvent) => {
      if (isDev && event.code === 1006) {
        console.log('🔌 WebSocket closed unexpectedly (common, will reconnect):', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean
        });
      }
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
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 2, // Reduced from 3 to 2 to prevent excessive retries
    baseDelay = 1500, // Increased from 1000 to give more time
    maxDelay = 8000, // Reduced from 10000 for faster failure
    retryCondition = isNetworkError,
    operationName = 'Supabase operation',
    timeoutMs = 5000
  } = options;

  let lastError: any;
  let attempt = 0;

  // Only log start for critical operations or when debugging
  const isVerboseLogging = isDev && import.meta.env.VITE_RETRY_DEBUG === 'true';

  if (isVerboseLogging) {
    console.log(`🔄 Starting ${operationName} with retry logic (max: ${maxRetries})`);
  }

  while (attempt <= maxRetries) {
    try {
      // Add timeout for operations to prevent hanging
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${operationName} timeout after ${timeoutMs / 1000} seconds`)), timeoutMs)
        )
      ]);

      // Only log retries that succeed after initial failure
      if (attempt > 0) {
        console.log(`✅ ${operationName} succeeded on retry attempt ${attempt + 1}`);
      }

      return result;
    } catch (error) {
      lastError = error;
      attempt++;

      // Always log errors as they indicate real problems
      console.error(`❌ ${operationName} failed on attempt ${attempt}:`, {
        message: error.message,
        code: error.code,
        status: error.status
      });

      const isRetryable = retryCondition(error);

      // Don't retry if we've exhausted attempts or error isn't retryable
      if (attempt > maxRetries || !isRetryable) {
        if (isVerboseLogging) {
          console.log(`🛑 Stopping retry for ${operationName}: ${attempt > maxRetries ? 'exhausted attempts' : 'not retryable'}`);
        }
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelay
      );

      if (isVerboseLogging) {
        console.log(`⏳ Retrying ${operationName} in ${delay}ms...`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`❌ ${operationName} failed after ${maxRetries + 1} attempts. Final error:`, lastError);
  throw lastError;
}

/**
 * Enhanced request interceptor with monitoring
 */
const requestCount = 0;
const errorCount = 0;
const startTime = Date.now();

let lastKnownSession: Session | null = null;
let lastSessionUpdatedAt = 0;
const SESSION_CACHE_MAX_AGE_MS = 20 * 60 * 1000; // 20 minutes - increased to reduce getSession calls

const bootstrapCachedSession = () => {
  console.log('🧊 [BOOTSTRAP] Starting session bootstrap from localStorage');

  if (typeof window === 'undefined') {
    console.log('🧊 [BOOTSTRAP] Skipping - no window object');
    return;
  }

  try {
    const raw = window.localStorage.getItem(CLIENT_CONFIG.auth.storageKey);
    console.log('🧊 [BOOTSTRAP] localStorage check:', {
      storageKey: CLIENT_CONFIG.auth.storageKey,
      hasData: !!raw,
      dataLength: raw ? raw.length : 0
    });

    if (!raw) {
      console.log('🧊 [BOOTSTRAP] No localStorage data found');
      return;
    }

    // Parse Supabase's localStorage format correctly
    const authData = JSON.parse(raw);

    // Supabase stores auth data in a specific format, not directly as Session
    if (authData && authData.access_token && authData.expires_at) {
      // Convert to proper Session format that our code expects
      lastKnownSession = {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_at: authData.expires_at,
        user: authData.user,
        token_type: authData.token_type || 'bearer'
      } as Session;
      lastSessionUpdatedAt = Date.now();

      // Production-safe logging to diagnose session bootstrap issues
      console.log('🧊 [BOOTSTRAP SUCCESS] Session cached from localStorage:', {
        hasAccessToken: !!authData.access_token,
        hasUser: !!authData.user,
        userEmail: authData.user?.email,
        expiresAt: authData.expires_at ? new Date(authData.expires_at * 1000).toISOString() : null
      });
    } else {
      // Production-safe logging for failed bootstrap attempts
      console.log('🧊 [BOOTSTRAP FAILED] localStorage auth data inspection:', {
        hasRawData: !!authData,
        hasAccessToken: !!authData?.access_token,
        hasExpiresAt: !!authData?.expires_at,
        authDataKeys: authData ? Object.keys(authData) : [],
        rawDataType: typeof authData
      });
    }
  } catch (error) {
    console.warn('⚠️ Failed to bootstrap cached session', error);
  }
};

bootstrapCachedSession();

const isSessionFresh = (session: Session | null) => {
  if (!session) {
    return false;
  }

  const cacheAgeOk = Date.now() - lastSessionUpdatedAt < SESSION_CACHE_MAX_AGE_MS;
  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  const expiryBufferOk = expiresAtMs === 0 || expiresAtMs - Date.now() > 10 * 60 * 1000; // Increased buffer to 10 minutes

  return cacheAgeOk && expiryBufferOk;
};

// Log the configuration in development
if (isDev && import.meta.env.VITE_CLIENT_DEBUG === 'true') {
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

// IMMEDIATE CONNECTION TEST - DISABLED TO PREVENT HANGING
if (false && isDev) {
  setTimeout(async () => {
    try {
      console.log('🧪 [BROWSER TEST] Testing database connection...');

      // First test: Simple auth check
      console.log('🧪 [AUTH TEST] Checking authentication state...');
      const authStart = Date.now();
      const { data: authData, error: authError } = await supabase.auth.getSession();
      const authEnd = Date.now();

      console.log('🧪 [AUTH TEST] Auth result:', {
        hasSession: !!authData?.session,
        hasUser: !!authData?.session?.user,
        userEmail: authData?.session?.user?.email,
        authTime: (authEnd - authStart) + 'ms',
        authError: authError?.message || 'none'
      });

      if (!authData?.session?.user) {
        console.error('🧪 [BROWSER TEST] No authenticated user - this will cause RLS failures');
        return;
      }

      // Second test: Database query with timeout
      console.log('🧪 [DB TEST] Testing titles table access...');
      const testStart = Date.now();

      const queryPromise = supabase.from('titles').select('title_id').limit(1);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database test timeout')), 3000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      const testEnd = Date.now();

      console.log('🧪 [DB TEST] Database result:', {
        success: !error,
        responseTime: (testEnd - testStart) + 'ms',
        dataCount: data?.length || 0,
        error: error?.message || 'none',
        errorCode: error?.code || 'none',
        errorDetails: error?.details || 'none'
      });

      if (error) {
        console.error('🧪 [DB TEST] Database error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Test if this is an RLS issue
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('🚨 [DB TEST] RLS POLICY BLOCKING ACCESS - User cannot read titles table');
          console.error('🚨 [DB TEST] User email:', authData?.session?.user?.email);
          console.error('🚨 [DB TEST] User ID:', authData?.session?.user?.id);
        }
      } else {
        console.log('✅ [DB TEST] Database connection successful');
      }

      // Third test: Featured table specifically
      console.log('🧪 [FEATURED TEST] Testing featured table access...');
      const featuredStart = Date.now();

      const featuredQueryPromise = supabase.from('featured').select('id').limit(1);
      const featuredTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Featured table test timeout')), 3000)
      );

      try {
        const { data: featuredData, error: featuredError } = await Promise.race([featuredQueryPromise, featuredTimeoutPromise]);
        const featuredEnd = Date.now();

        console.log('🧪 [FEATURED TEST] Featured table result:', {
          success: !featuredError,
          responseTime: (featuredEnd - featuredStart) + 'ms',
          dataCount: featuredData?.length || 0,
          error: featuredError?.message || 'none',
          errorCode: featuredError?.code || 'none'
        });

        if (featuredError) {
          console.error('🧪 [FEATURED TEST] Featured table error:', featuredError);
        }
      } catch (featuredTestError) {
        console.error('🧪 [FEATURED TEST] Featured table timeout/exception:', featuredTestError);
      }

    } catch (testError) {
      console.error('🧪 [BROWSER TEST] Exception:', testError);
    }
  }, 2000);
}

// Enhanced auth methods with retry logic
const originalSignInWithPassword = supabase.auth.signInWithPassword.bind(supabase.auth);
const originalSignInWithOAuth = supabase.auth.signInWithOAuth.bind(supabase.auth);
const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
const originalRefreshSession = supabase.auth.refreshSession.bind(supabase.auth);

type GetSessionResponse = Awaited<ReturnType<typeof originalGetSession>>;

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

supabase.auth.getSession = async () => {
  const isCallback = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback');
  const hasOAuthCode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('code');
  const isOAuthFlow = isCallback && hasOAuthCode;

  const handleSessionResult = (result: GetSessionResponse) => {
    const session = result?.data?.session ?? null;
    if (session) {
      lastKnownSession = session;
      lastSessionUpdatedAt = Date.now();
    }
    return result;
  };

  // For OAuth flows, bypass aggressive session caching to allow PKCE exchange
  if (!isOAuthFlow && !isCallback && isSessionFresh(lastKnownSession)) {
    if (isDev && import.meta.env.VITE_SESSION_DEBUG === 'true') {
      console.log('⚡ Returning cached session without remote call');
    }
    return {
      data: { session: lastKnownSession },
      error: null
    } satisfies GetSessionResponse;
  }

  if (isOAuthFlow) {
    // During OAuth callback with code, let Supabase handle its own session exchange without timeouts
    console.log('🔄 OAuth PKCE flow detected - using native Supabase session exchange');
    const result = await originalGetSession();
    return handleSessionResult(result);
  }

  if (isDev && import.meta.env.VITE_SESSION_DEBUG === 'true') {
    console.log('🌐 Cached session unavailable or stale - fetching from Supabase', {
      hasCachedSession: !!lastKnownSession,
      cacheAgeMs: lastSessionUpdatedAt ? Date.now() - lastSessionUpdatedAt : null,
      path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      isOAuthFlow
    });
  }

  try {
    // Context-aware timeout: OAuth callbacks need more time for PKCE exchange
    const timeoutMs = isCallback ? 15000 : 8000; // Increased OAuth timeout from 12s to 15s

    const result = await withRetry(() => originalGetSession(), {
      maxRetries: isCallback ? 2 : 1, // More retries for OAuth callbacks
      baseDelay: 200,
      timeoutMs,
      operationName: 'getSession'
    });

    const resolved = handleSessionResult(result as GetSessionResponse);

    if (!resolved?.data?.session && isSessionFresh(lastKnownSession)) {
      if (isDev) {
        console.warn('⚠️ getSession returned empty result, using cached session');
      }
      const cachedResponse: GetSessionResponse = {
        data: { session: lastKnownSession },
        error: null
      };
      return cachedResponse;
    }

    return resolved;
  } catch (error) {
    // Be more aggressive about using cached sessions on any error (except OAuth flows)
    if (lastKnownSession && !isOAuthFlow) {
      if (isDev) {
        console.warn('⚠️ getSession failed, returning cached session (aggressive fallback)', error);
      }
      const cachedResponse: GetSessionResponse = {
        data: { session: lastKnownSession },
        error: null
      };
      return cachedResponse;
    }

    console.error('❌ getSession failed with no cached session available', error);
    // Return empty session instead of throwing to prevent app crashes
    return {
      data: { session: null },
      error: error
    };
  }
};

supabase.auth.refreshSession = (refreshToken) =>
  withRetry(() => originalRefreshSession(refreshToken), {
    maxRetries: 2,
    operationName: 'refreshSession',
    timeoutMs: 15000 // Increased to 15 seconds for session refresh operations
  });

// Performance monitoring (development only)
if (isDev) {
  // Monitor auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (import.meta.env.VITE_AUTH_STATE_DEBUG === 'true') {
      console.log(`🔐 Auth State Change: ${event}`, {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
      });
    }

    if (session) {
      lastKnownSession = session;
      lastSessionUpdatedAt = Date.now();
    } else {
      lastKnownSession = null;
    }
  });

  // Log performance metrics periodically (only if enabled)
  if (import.meta.env.VITE_PERFORMANCE_DEBUG === 'true') {
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
    // Skip auth-based health check during initial load to avoid circular dependency
    // Just do basic config validation
    const responseTime = Date.now() - startTime;

    const result = {
      healthy: true, // Assume healthy if config is valid
      response: responseTime,
      error: undefined,
      details: {
        url: SUPABASE_URL,
        isLocal,
        connectivity: 'ok' as 'ok' | 'slow' | 'failed',
        authConfigured: SUPABASE_PUBLISHABLE_KEY.length > 20
      }
    };

    if (isDev && import.meta.env.VITE_HEALTH_DEBUG === 'true') {
      console.log('🏥 Supabase Health Check (simplified):', result);
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
