/**
 * @kstorybridge/auth - Sealed Authentication Package
 *
 * This package provides a clean, provider-agnostic authentication API.
 * All Supabase-specific logic is hidden behind this interface.
 *
 * Usage:
 *   import { auth, AuthUser, AuthSession } from '@kstorybridge/auth';
 *
 *   const user = await auth.signIn({ email, password });
 *   const session = await auth.getSession();
 */

// Export types (application can depend on these)
export type {
  AuthUser,
  AuthSession,
  AuthClient,
  AuthError,
  SignUpParams,
  SignInParams,
  RequestLike,
  ResponseLike
} from './types.js';

// Export configuration (read-only access)
export { AUTH_CONFIG } from './config.js';

// Export the singleton auth instance (main API)
export { auth } from './supabaseAdapter.js';

// Export auth instance as default for convenience
export { auth as default } from './supabaseAdapter.js';