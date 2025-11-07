/**
 * CORS Handling Utilities
 * Implements origin whitelisting for security
 */

// Allowed origins for CORS requests
const ALLOWED_ORIGINS = [
  // Production
  'https://dashboard.kstorybridge.com',

  // Staging
  'https://dashboard-v2.kstorybridge.com',

  // Development (only in non-production)
  ...(Deno.env.get('ENVIRONMENT') !== 'production' ? [
    'http://localhost:8081',
    'http://localhost:3000',
    'http://127.0.0.1:8081',
  ] : []),
];

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get CORS headers with origin validation
 */
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  // Determine allowed origin
  const allowedOrigin = requestOrigin && isOriginAllowed(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0]; // Default to production

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPrelight(request: Request): Response {
  const origin = request.headers.get('origin');

  // Check if origin is allowed
  if (origin && !isOriginAllowed(origin)) {
    console.warn('[CORS] Blocked request from unauthorized origin:', origin);
    return new Response('Forbidden', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  return new Response('ok', {
    status: 200,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Validate origin for actual requests
 */
export function validateOrigin(request: Request): { valid: boolean; error?: string } {
  const origin = request.headers.get('origin');

  // Allow requests without origin (same-origin or server-to-server)
  if (!origin) {
    return { valid: true };
  }

  // Check if origin is in whitelist
  if (!isOriginAllowed(origin)) {
    console.warn('[CORS] Rejected request from unauthorized origin:', origin);
    return {
      valid: false,
      error: `Origin '${origin}' is not allowed to access this resource`,
    };
  }

  return { valid: true };
}

/**
 * Create an error response with CORS headers
 */
export function corsErrorResponse(
  request: Request,
  message: string,
  status: number = 403
): Response {
  const origin = request.headers.get('origin');

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message,
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
      },
    }
  );
}

/**
 * Log CORS configuration at startup
 */
export function logCorsConfig(): void {
  console.log('[CORS] Allowed origins:', ALLOWED_ORIGINS);
  console.log('[CORS] Environment:', Deno.env.get('ENVIRONMENT') || 'development');
}
