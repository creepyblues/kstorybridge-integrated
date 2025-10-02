/**
 * Core authentication types for KStoryBridge
 *
 * These are our own types, not provider-specific types.
 * This allows us to switch auth providers without breaking app code.
 */

export interface AuthUser {
  id: string;
  email?: string | null;
  roles?: string[];
  metadata?: Record<string, any>;
  accountType?: 'buyer' | 'creator';
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

export interface SignUpParams {
  email: string;
  password?: string;
  provider?: 'google' | 'github' | 'apple';
  metadata?: Record<string, any>;
  redirectTo?: string;
}

export interface SignInParams {
  email: string;
  password?: string;
  provider?: 'google' | 'github' | 'apple';
  redirectTo?: string;
  metadata?: Record<string, any>;
}

// Request/Response interfaces for middleware usage
export interface RequestLike {
  headers: {
    get(name: string): string | null;
  };
  url?: string;
}

export interface ResponseLike {
  headers?: {
    set(name: string, value: string): void;
  };
}

/**
 * Core AuthClient interface - the sealed API for authentication
 *
 * This is the ONLY interface apps should use for authentication.
 * All provider-specific logic is hidden behind this interface.
 */
export interface AuthClient {
  /**
   * Sign up a new user
   */
  signUp(params: SignUpParams): Promise<AuthUser>;

  /**
   * Sign in an existing user
   */
  signIn(params: SignInParams): Promise<AuthUser>;

  /**
   * Sign out the current user
   */
  signOut(): Promise<void>;

  /**
   * Get current session (for middleware/BFF usage)
   */
  getSession(req?: RequestLike, res?: ResponseLike): Promise<AuthSession | null>;

  /**
   * Require authenticated user (throws if not authenticated)
   */
  requireUser(req?: RequestLike, res?: ResponseLike): Promise<AuthUser>;

  /**
   * Exchange OAuth code for session (internal method)
   */
  exchangeCodeForSession(code: string): Promise<AuthSession>;

  /**
   * Update user metadata
   */
  updateUser(data: { metadata?: Record<string, any> }): Promise<AuthUser>;
}