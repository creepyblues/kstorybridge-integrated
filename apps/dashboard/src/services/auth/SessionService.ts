import { authService } from './AuthService';
import type { Session, User } from '@supabase/supabase-js';

export interface SessionState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface SessionValidation {
  isValid: boolean;
  expiresAt?: number;
  timeRemaining?: number;
  needsRefresh: boolean;
}

/**
 * Service for managing user sessions
 */
export class SessionService {
  private static instance: SessionService;
  private sessionState: SessionState = {
    session: null,
    user: null,
    loading: true,
    isAuthenticated: false
  };
  private listeners: ((state: SessionState) => void)[] = [];

  private constructor() {
    this.initializeSession();
  }

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Initialize session on startup
   */
  private async initializeSession(): Promise<void> {
    try {
      const [session, user] = await Promise.all([
        authService.getCurrentSession(),
        authService.getCurrentUser()
      ]);

      this.updateSessionState({
        session,
        user,
        loading: false,
        isAuthenticated: !!user && !!session
      });

      // Set up auth state change listener
      authService.onAuthStateChange((event, session) => {
        this.handleAuthStateChange(event, session);
      });

    } catch (error) {
      console.error('Session initialization failed:', error);
      this.updateSessionState({
        session: null,
        user: null,
        loading: false,
        isAuthenticated: false
      });
    }
  }

  /**
   * Handle auth state changes
   */
  private handleAuthStateChange(event: string, session: Session | null): void {
    console.log('[SessionService] Auth state changed:', event, !!session);

    this.updateSessionState({
      session,
      user: session?.user || null,
      loading: false,
      isAuthenticated: !!session?.user
    });

    // Clear any cached data on sign out
    if (event === 'SIGNED_OUT') {
      this.clearSessionData();
    }
  }

  /**
   * Update session state and notify listeners
   */
  private updateSessionState(newState: Partial<SessionState>): void {
    this.sessionState = { ...this.sessionState, ...newState };
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.sessionState);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }

  /**
   * Clear session data on sign out
   */
  private clearSessionData(): void {
    // Clear any session-related caches or storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('oauth_account_type');
      // Clear other session-specific data as needed
    }
  }

  /**
   * Get current session state
   */
  getSessionState(): SessionState {
    return { ...this.sessionState };
  }

  /**
   * Subscribe to session state changes
   */
  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Validate current session
   */
  validateSession(): SessionValidation {
    const { session } = this.sessionState;

    if (!session) {
      return {
        isValid: false,
        needsRefresh: false
      };
    }

    const now = Date.now() / 1000; // Current time in seconds
    const expiresAt = session.expires_at;
    const timeRemaining = expiresAt ? expiresAt - now : 0;

    // Consider session invalid if it expires in less than 5 minutes
    const needsRefresh = timeRemaining < 300; // 5 minutes
    const isValid = timeRemaining > 0;

    return {
      isValid,
      expiresAt,
      timeRemaining,
      needsRefresh
    };
  }

  /**
   * Refresh session if needed
   */
  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validateSession();

      if (!validation.needsRefresh) {
        return { success: true };
      }

      // Force refresh by getting session again
      const session = await authService.getCurrentSession();
      const user = await authService.getCurrentUser();

      this.updateSessionState({
        session,
        user,
        isAuthenticated: !!user && !!session
      });

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session refresh failed'
      };
    }
  }

  /**
   * Sign out and clear session
   */
  async signOut(): Promise<{ error?: string }> {
    const result = await authService.signOut();

    // Update state immediately (auth state change will also trigger)
    this.updateSessionState({
      session: null,
      user: null,
      isAuthenticated: false
    });

    return result;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.sessionState.isAuthenticated;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.sessionState.user;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.sessionState.session;
  }

  /**
   * Check if session is loading
   */
  isLoading(): boolean {
    return this.sessionState.loading;
  }
}

// Export singleton instance
export const sessionService = SessionService.getInstance();