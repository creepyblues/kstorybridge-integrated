import { User, Session } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

export interface UserProfile {
  account_type: 'buyer' | 'ip_owner';
  invitation_status: string;
  role?: string;
}

export interface AuthUser {
  user: User;
  profile: UserProfile;
}

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Fetch user profile from database
   */
  async fetchUserProfile(user: User): Promise<UserProfile | null> {
    try {
      const accountType = user.user_metadata?.account_type;
      
      if (!accountType || !['buyer', 'ip_owner'].includes(accountType)) {
        console.error('Invalid or missing account_type:', accountType);
        return null;
      }

      if (accountType === 'buyer') {
        const { data: profile, error } = await this.supabase
          .from('user_buyers')
          .select('invitation_status, buyer_role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching buyer profile:', error);
          return null;
        }

        return {
          account_type: 'buyer',
          invitation_status: profile?.invitation_status || 'invited',
          role: profile?.buyer_role
        };
      }

      if (accountType === 'ip_owner') {
        const { data: profile, error } = await this.supabase
          .from('user_ipowners')
          .select('invitation_status, ip_owner_role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching IP owner profile:', error);
          return null;
        }

        return {
          account_type: 'ip_owner',
          invitation_status: profile?.invitation_status || 'invited',
          role: profile?.ip_owner_role
        };
      }

      return null;
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get authenticated user with profile
   */
  async getAuthenticatedUser(): Promise<AuthUser | null> {
    const session = await this.getSession();
    if (!session?.user) {
      return null;
    }

    const profile = await this.fetchUserProfile(session.user);
    if (!profile) {
      return null;
    }

    return {
      user: session.user,
      profile
    };
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  /**
   * Set session from URL parameters (for cross-domain auth)
   */
  async setSessionFromUrl(urlParams: URLSearchParams): Promise<Session | null> {
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (!accessToken) {
      return null;
    }

    const sessionData = {
      access_token: accessToken,
      refresh_token: refreshToken || '',
      expires_at: urlParams.get('expires_at') ? parseInt(urlParams.get('expires_at')!) : undefined,
      token_type: urlParams.get('token_type') || 'bearer'
    };

    try {
      const { data: { session }, error } = await this.supabase.auth.setSession(sessionData);
      
      if (error) {
        console.error('Error setting session from URL parameters:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Exception during setSession:', error);
      return null;
    }
  }

  /**
   * Create session URL parameters for cross-domain auth
   */
  createSessionParams(session: Session): URLSearchParams {
    return new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token || '',
      expires_at: session.expires_at?.toString() || '',
      token_type: session.token_type || 'bearer'
    });
  }
}