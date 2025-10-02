import { createClient } from '@supabase/supabase-js';
import type {
  AuthClient,
  AuthUser,
  AuthSession,
  SignUpParams,
  SignInParams,
  RequestLike,
  ResponseLike
} from './types.js';
import { AUTH_CONFIG } from './config.js';

/**
 * Supabase Authentication Adapter
 *
 * This class encapsulates ALL Supabase-specific logic.
 * The rest of the application only interacts with the AuthClient interface.
 */
class SupabaseAuthAdapter implements AuthClient {
  private client;

  constructor() {
    this.client = createClient(
      AUTH_CONFIG.supabase.url,
      AUTH_CONFIG.supabase.anonKey
    );
  }

  /**
   * Convert Supabase user to our AuthUser type
   */
  private mapUser(supabaseUser: any): AuthUser {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      roles: supabaseUser.role ? [supabaseUser.role] : [],
      metadata: supabaseUser.user_metadata || {},
      accountType: supabaseUser.user_metadata?.account_type
    };
  }

  /**
   * Convert Supabase session to our AuthSession type
   */
  private mapSession(supabaseSession: any): AuthSession | null {
    // Check if session has a valid user
    if (!supabaseSession.user) {
      return null;
    }

    const expiresAt = supabaseSession.expires_at
      ? supabaseSession.expires_at * 1000
      : Date.now() + AUTH_CONFIG.session.expiryMs;

    return {
      user: this.mapUser(supabaseSession.user),
      accessToken: supabaseSession.access_token,
      expiresAt
    };
  }

  /**
   * Sign up a new user
   */
  async signUp(params: SignUpParams): Promise<AuthUser> {
    try {
      if (params.provider) {
        // OAuth state parameter - compact format for Google OAuth compatibility
        // Format: "s-buyer" (signup-buyer) or "s-creator" (signup-creator)
        const accountType = params.metadata?.account_type || 'buyer';
        const stateParam = `s-${accountType}`;

        const { data, error } = await this.client.auth.signInWithOAuth({
          provider: params.provider as any,
          options: {
            // Clean callback URL without query parameters
            redirectTo: params.redirectTo || `${AUTH_CONFIG.site.url}${AUTH_CONFIG.oauth.redirectPath}`,
            // Pass flow and account type via OAuth state parameter
            queryParams: {
              state: stateParam
            },
            ...(params.metadata && { data: params.metadata })
          }
        });

        if (error) throw error;

        // For OAuth, we don't get user immediately - redirect happens
        // Return a placeholder that will be replaced after callback
        return {
          id: 'oauth_pending',
          email: params.email,
          metadata: params.metadata
        };
      } else {
        // Email/password signup
        const { data, error } = await this.client.auth.signUp({
          email: params.email,
          password: params.password!,
          options: {
            data: params.metadata || {}
          }
        });

        if (error) throw error;
        if (!data.user) throw new Error('No user returned from signup');

        return this.mapUser(data.user);
      }
    } catch (error: any) {
      throw new Error(`Signup failed: ${error.message}`);
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(params: SignInParams): Promise<AuthUser> {
    try {
      if (params.provider) {
        // OAuth state parameter - compact format for Google OAuth compatibility
        // Format: "i-buyer" (signin-buyer) or "i-creator" (signin-creator)
        const accountType = params.metadata?.account_type || 'buyer';
        const stateParam = `i-${accountType}`;

        const { data, error } = await this.client.auth.signInWithOAuth({
          provider: params.provider as any,
          options: {
            // Clean callback URL without query parameters
            redirectTo: params.redirectTo || `${AUTH_CONFIG.site.url}${AUTH_CONFIG.oauth.redirectPath}`,
            // Pass flow and account type via OAuth state parameter
            queryParams: {
              state: stateParam
            }
          }
        });

        if (error) throw error;

        // For OAuth, redirect happens - return placeholder
        return {
          id: 'oauth_pending',
          email: params.email
        };
      } else {
        // Email/password signin
        const { data, error } = await this.client.auth.signInWithPassword({
          email: params.email,
          password: params.password!
        });

        if (error) throw error;
        if (!data.user) throw new Error('No user returned from signin');

        return this.mapUser(data.user);
      }
    } catch (error: any) {
      throw new Error(`Signin failed: ${error.message}`);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Signout failed: ${error.message}`);
    }
  }

  /**
   * Get current session
   */
  async getSession(req?: RequestLike, res?: ResponseLike): Promise<AuthSession | null> {
    try {
      const { data, error } = await this.client.auth.getSession();

      if (error) throw error;
      if (!data.session) return null;

      const mappedSession = this.mapSession(data.session);
      return mappedSession;
    } catch (error: any) {
      console.warn('Failed to get session:', error.message);
      return null;
    }
  }

  /**
   * Require authenticated user - throws if not authenticated
   */
  async requireUser(req?: RequestLike, res?: ResponseLike): Promise<AuthUser> {
    const session = await this.getSession(req, res);

    if (!session) {
      throw new Error('Authentication required');
    }

    return session.user;
  }

  /**
   * Exchange OAuth code for session
   */
  async exchangeCodeForSession(code: string): Promise<AuthSession> {
    try {
      const { data, error } = await this.client.auth.exchangeCodeForSession(code);

      if (error) throw error;
      if (!data.session) throw new Error('No session returned from code exchange');

      const mappedSession = this.mapSession(data.session);
      if (!mappedSession) throw new Error('Invalid session data from code exchange');

      return mappedSession;
    } catch (error: any) {
      throw new Error(`OAuth code exchange failed: ${error.message}`);
    }
  }

  /**
   * Update user metadata
   */
  async updateUser(updateData: { metadata?: Record<string, any> }): Promise<AuthUser> {
    try {
      const { data, error } = await this.client.auth.updateUser({
        data: updateData.metadata || {}
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from update');

      return this.mapUser(data.user);
    } catch (error: any) {
      throw new Error(`User update failed: ${error.message}`);
    }
  }

  /**
   * Get current user (without session info)
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data, error } = await this.client.auth.getUser();

      if (error) throw error;
      if (!data.user) return null;

      return this.mapUser(data.user);
    } catch (error: any) {
      console.warn('Failed to get current user:', error.message);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    return this.client.auth.onAuthStateChange((event, supabaseSession) => {
      let session: AuthSession | null = null;
      if (supabaseSession) {
        session = this.mapSession(supabaseSession);
      }
      callback(event, session);
    });
  }
}

// Export a singleton instance
export const auth = new SupabaseAuthAdapter();