/**
 * OAuth Security Utilities
 *
 * Implements proper OAuth 2.0 state parameter security to prevent CSRF attacks.
 * Uses cryptographically secure random state values with separate data storage.
 */

export interface OAuthFlowData {
  flow: 'signin' | 'signup';
  accountType: 'buyer' | 'creator';
  timestamp: number;
  provider: 'google' | 'discord';
}

/**
 * Generate a cryptographically secure random state parameter
 * @returns 32-character hexadecimal string
 */
export function generateSecureState(): string {
  // Use Web Crypto API for secure random generation
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store OAuth flow data securely in sessionStorage
 * @param state - Secure random state value
 * @param data - OAuth flow data to store
 */
export function storeOAuthData(state: string, data: OAuthFlowData): void {
  const key = `oauth_${state}`;
  const dataWithExpiry = {
    ...data,
    expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes expiry
  };

  try {
    sessionStorage.setItem(key, JSON.stringify(dataWithExpiry));
    console.log('🔐 OAuth data stored with state:', state.substring(0, 8) + '...');
  } catch (error) {
    console.error('❌ Failed to store OAuth data:', error);
    throw new Error('Failed to store OAuth session data');
  }
}

/**
 * Retrieve and validate OAuth flow data from sessionStorage
 * @param state - State parameter received from OAuth callback
 * @returns OAuth flow data or null if invalid/expired
 */
export function retrieveOAuthData(state: string): OAuthFlowData | null {
  if (!state) {
    console.warn('⚠️ No state parameter provided');
    return null;
  }

  const key = `oauth_${state}`;

  try {
    const storedData = sessionStorage.getItem(key);
    if (!storedData) {
      console.warn('⚠️ No OAuth data found for state:', state.substring(0, 8) + '...');
      return null;
    }

    const parsedData = JSON.parse(storedData);

    // Check expiry
    if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
      console.warn('⚠️ OAuth data expired for state:', state.substring(0, 8) + '...');
      sessionStorage.removeItem(key); // Cleanup expired data
      return null;
    }

    // Remove expiry field from returned data
    const { expiresAt, ...oauthData } = parsedData;

    console.log('✅ OAuth data retrieved for state:', state.substring(0, 8) + '...', oauthData);

    // Cleanup after successful retrieval
    sessionStorage.removeItem(key);

    return oauthData as OAuthFlowData;
  } catch (error) {
    console.error('❌ Failed to retrieve OAuth data:', error);
    return null;
  }
}

/**
 * Validate OAuth state parameter and return associated data
 * @param receivedState - State parameter from OAuth callback
 * @returns OAuth flow data if valid, null otherwise
 */
export function validateOAuthState(receivedState: string): OAuthFlowData | null {
  console.log('🔍 Validating OAuth state:', receivedState?.substring(0, 8) + '...');

  if (!receivedState) {
    console.error('❌ OAuth state validation failed: No state parameter received');
    return null;
  }

  // Validate state format (32 hex characters)
  if (!/^[a-f0-9]{32}$/.test(receivedState)) {
    console.error('❌ OAuth state validation failed: Invalid state format');
    return null;
  }

  const data = retrieveOAuthData(receivedState);
  if (!data) {
    console.error('❌ OAuth state validation failed: No matching data found');
    return null;
  }

  console.log('✅ OAuth state validation successful');
  return data;
}

/**
 * Initialize OAuth flow with secure state parameter
 * @param flow - Type of OAuth flow (signin/signup)
 * @param accountType - Account type (buyer/creator)
 * @param provider - OAuth provider (google/discord)
 * @returns Secure state parameter
 */
export function initializeOAuthFlow(
  flow: 'signin' | 'signup',
  accountType: 'buyer' | 'creator',
  provider: 'google' | 'discord'
): string {
  const state = generateSecureState();
  const data: OAuthFlowData = {
    flow,
    accountType,
    provider,
    timestamp: Date.now()
  };

  storeOAuthData(state, data);

  console.log('🚀 OAuth flow initialized:', {
    flow,
    accountType,
    provider,
    state: state.substring(0, 8) + '...'
  });

  return state;
}

/**
 * Cleanup expired OAuth data from sessionStorage
 * Called periodically to prevent storage buildup
 */
export function cleanupExpiredOAuthData(): void {
  const now = Date.now();
  let cleanedCount = 0;

  // Check all sessionStorage keys for OAuth data
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith('oauth_')) {
      try {
        const data = sessionStorage.getItem(key);
        if (data) {
          const parsedData = JSON.parse(data);
          if (parsedData.expiresAt && now > parsedData.expiresAt) {
            sessionStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        // Remove invalid data
        sessionStorage.removeItem(key!);
        cleanedCount++;
      }
    }
  }

  if (cleanedCount > 0) {
    console.log('🧹 Cleaned up', cleanedCount, 'expired OAuth entries');
  }
}

// Automatic cleanup on module load
cleanupExpiredOAuthData();