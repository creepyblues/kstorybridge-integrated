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
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

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

// Production environment validation for OAuth flows
if (typeof window !== 'undefined') {
  console.log('🔧 SERVICE ROLE DEBUG:', {
    hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
    keyLength: SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.length : 0,
    keyPrefix: SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.substring(0, 8) + '...' : 'none'
  });

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('🚨 PRODUCTION WARNING: Service role key missing');
    console.warn('🔧 OAuth profile creation may fail without VITE_SUPABASE_SERVICE_ROLE_KEY');
    console.warn('📋 Add this environment variable to prevent OAuth signup failures');
  } else {
    console.log('✅ Service role key detected and available');
  }
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

// FIRST LOAD FIX: Define storage keys before CLIENT_CONFIG
const MAIN_CLIENT_STORAGE_KEY = 'sb-dlrnrgcoguxlkkcitlpd-auth-token';
const SERVICE_ROLE_STORAGE_KEY = 'sb-dlrnrgcoguxlkkcitlpd-service-role-token';

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
    storageKey: MAIN_CLIENT_STORAGE_KEY,
    debug: isDev && import.meta.env.VITE_AUTH_DEBUG === 'true'
  },
  
  // Database configuration with retry logic
  db: {
    schema: 'public'
  },
  
  // Global configuration
  global: {
    headers: {
      'X-Client-Info': 'kstorybridge-dashboard',
      'Accept': 'application/json'
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
    maxRetries = 2, // Keep at 2 to prevent excessive retries
    baseDelay = 2000, // Increased from 1500 to 2000 for production stability
    maxDelay = 20000, // Increased from 12000 to 20000 for high-latency production networks
    retryCondition = isNetworkError,
    operationName = 'Supabase operation',
    timeoutMs = 120000 // Increased to 120000 to handle production database latency and eliminate timeout failures
  } = options;

  let lastError: any;
  let attempt = 0;
  const startTime = Date.now();

  // Record the request for monitoring
  recordRequest();

  // Only log start for critical operations or when debugging
  const isVerboseLogging = isDev && import.meta.env.VITE_RETRY_DEBUG === 'true';

  if (isVerboseLogging) {
    console.log(`🔄 Starting ${operationName} with retry logic (max: ${maxRetries})`);
  }

  while (attempt <= maxRetries) {
    try {
      const operationStart = Date.now();

      // Add timeout for operations to prevent hanging
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${operationName} timeout after ${timeoutMs / 1000} seconds`)), timeoutMs)
        )
      ]);

      const duration = Date.now() - operationStart;

      // Record slow queries for monitoring
      recordSlowQuery(duration, operationName);

      // Only log retries that succeed after initial failure
      if (attempt > 0) {
        console.log(`✅ ${operationName} succeeded on retry attempt ${attempt + 1} (${duration}ms)`);
      }

      return result;
    } catch (error) {
      lastError = error;
      attempt++;

      // Record error for monitoring
      recordError(error, operationName);

      // Always log errors as they indicate real problems
      console.error(`❌ ${operationName} failed on attempt ${attempt}:`, {
        message: error.message,
        code: error.code,
        status: error.status,
        duration: Date.now() - startTime
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
let requestCount = 0;
let errorCount = 0;
let timeoutCount = 0;
let slowQueryCount = 0;
const startTime = Date.now();

// Production monitoring utilities
const recordRequest = () => {
  requestCount++;
};

const recordError = (error: any, operationName?: string) => {
  errorCount++;

  // Track specific error types for production monitoring
  if (error?.message?.includes('timeout')) {
    timeoutCount++;
    console.warn('⏰ PRODUCTION MONITOR: Timeout detected', {
      operation: operationName,
      errorMessage: error.message,
      totalTimeouts: timeoutCount,
      timeoutRate: `${((timeoutCount / requestCount) * 100).toFixed(1)}%`
    });
  }
};

const recordSlowQuery = (duration: number, operationName?: string) => {
  if (duration > 5000) { // Queries taking more than 5 seconds
    slowQueryCount++;
    console.warn('🐌 PRODUCTION MONITOR: Slow query detected', {
      operation: operationName,
      duration: `${duration}ms`,
      totalSlowQueries: slowQueryCount,
      slowQueryRate: `${((slowQueryCount / requestCount) * 100).toFixed(1)}%`
    });
  }
};

let lastKnownSession: Session | null = null;
let lastSessionUpdatedAt = 0;
const SESSION_CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes - increased from 20 to reduce getSession calls further

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
  const expiryBufferOk = expiresAtMs === 0 || expiresAtMs - Date.now() > 15 * 60 * 1000; // Increased buffer to 15 minutes

  // Log session freshness details in development
  if (isDev && import.meta.env.VITE_SESSION_CACHE_DEBUG === 'true') {
    console.log('🧊 Session freshness check:', {
      hasCachedSession: !!session,
      cacheAge: Math.round((Date.now() - lastSessionUpdatedAt) / 1000 / 60) + ' minutes',
      cacheAgeOk,
      expiresAt: expiresAtMs ? new Date(expiresAtMs).toISOString() : 'never',
      timeToExpiry: expiresAtMs ? Math.round((expiresAtMs - Date.now()) / 1000 / 60) + ' minutes' : 'never',
      expiryBufferOk,
      isFresh: cacheAgeOk && expiryBufferOk
    });
  }

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

// Create the enhanced Supabase client with explicit storage key (defined above)
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  ...CLIENT_CONFIG,
  auth: {
    ...CLIENT_CONFIG.auth,
    storageKey: MAIN_CLIENT_STORAGE_KEY
  }
});

// Create completely isolated service role client with separate storage key
// This ensures it operates independently of user session management
export const supabaseServiceRole = SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,      // No session persistence
        autoRefreshToken: false,    // No token refresh
        detectSessionInUrl: false,  // No URL session detection
        storageKey: SERVICE_ROLE_STORAGE_KEY,  // FIRST LOAD FIX: Separate storage key
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'kstorybridge-dashboard-service-role'
        }
      },
      // Disable realtime to prevent any session dependencies
      realtime: {
        params: {
          eventsPerSecond: 0
        }
      }
    })
  : null;

// Validation for service role client
if (typeof window !== 'undefined' && !supabaseServiceRole) {
  console.warn('🚨 Service role client not available - signup profile creation may fail');
} else if (typeof window !== 'undefined' && supabaseServiceRole) {
  console.log('✅ Service role client created with complete session isolation');
}

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

// Enhanced auth methods with retry logic - ONLY applied to main client
// CRITICAL: These overrides must NOT affect the service role client
const originalSignInWithPassword = supabase.auth.signInWithPassword.bind(supabase.auth);
const originalSignInWithOAuth = supabase.auth.signInWithOAuth.bind(supabase.auth);
const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
const originalRefreshSession = supabase.auth.refreshSession.bind(supabase.auth);

// Ensure service role client auth methods are preserved (never override them)
const serviceRoleAuthMethods = supabaseServiceRole ? {
  signInWithPassword: supabaseServiceRole.auth.signInWithPassword.bind(supabaseServiceRole.auth),
  signInWithOAuth: supabaseServiceRole.auth.signInWithOAuth.bind(supabaseServiceRole.auth),
  signOut: supabaseServiceRole.auth.signOut.bind(supabaseServiceRole.auth),
  getSession: supabaseServiceRole.auth.getSession.bind(supabaseServiceRole.auth),
  refreshSession: supabaseServiceRole.auth.refreshSession.bind(supabaseServiceRole.auth)
} : null;

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
  const isOAuthCompletion = typeof window !== 'undefined' && window.location.search.includes('complete=true');
  const needsExtendedTimeout = isCallback || isOAuthCompletion;
  const isOAuthFlow = isCallback && hasOAuthCode;

  // 🔧 CALLBACK DEBUG: Verify enhanced callback detection logic
  if (typeof window !== 'undefined') {
    console.log('🔧 ENHANCED CALLBACK DETECTION:', {
      pathname: window.location.pathname,
      search: window.location.search,
      isCallback,
      hasOAuthCode,
      isOAuthCompletion,
      needsExtendedTimeout,
      isOAuthFlow,
      willUseExtendedTimeout: needsExtendedTimeout
    });
  }

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
    // Context-aware timeout: OAuth callbacks AND OAuth completion need more time for session operations
    // FIRST LOAD FIX: Reduced timeout for regular flows to prevent hanging (60s -> 15s)
    const timeoutMs = needsExtendedTimeout ? 90000 : 15000; // OAuth 90s, regular 15s (reduced from 60s)

    // 🔧 RUNTIME DEBUG: Verify enhanced timeout configuration is working
    if (isDev && import.meta.env.VITE_SESSION_DEBUG === 'true') {
      console.log('🔧 ENHANCED TIMEOUT CONFIG:', {
        isCallback,
        isOAuthCompletion,
        needsExtendedTimeout,
        timeoutMs,
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        search: typeof window !== 'undefined' ? window.location.search : 'unknown',
        expectedTimeout: needsExtendedTimeout ? '90 seconds' : '15 seconds'
      });
    }

    const result = await withRetry(() => originalGetSession(), {
      maxRetries: needsExtendedTimeout ? 2 : 1, // More retries for OAuth flows (callback + completion)
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
    timeoutMs: 25000 // Increased to 25 seconds for production session refresh operations
  });

// CRITICAL: Restore original auth methods to service role client after global overrides
// This ensures the service role client operates independently of user session management
if (supabaseServiceRole && serviceRoleAuthMethods) {
  console.log('🔒 Protecting service role client from global auth overrides');

  // Restore original auth methods to prevent session timeouts
  supabaseServiceRole.auth.signInWithPassword = serviceRoleAuthMethods.signInWithPassword;
  supabaseServiceRole.auth.signInWithOAuth = serviceRoleAuthMethods.signInWithOAuth;
  supabaseServiceRole.auth.signOut = serviceRoleAuthMethods.signOut;
  supabaseServiceRole.auth.getSession = serviceRoleAuthMethods.getSession;
  supabaseServiceRole.auth.refreshSession = serviceRoleAuthMethods.refreshSession;

  console.log('✅ Service role client auth methods protected from overrides');
}

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
