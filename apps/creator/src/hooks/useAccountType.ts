/**
 * Unified Account Type Detection Hook - Database-First Approach
 *
 * This hook uses the database as the single source of truth for account type detection:
 * - Queries user_buyers and user_creators tables
 * - Eliminates metadata race conditions
 * - No default fallback to 'buyer' (prevents wrong redirects)
 * - URL context used only for routing hints during auth flows
 */

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type AccountType = 'buyer' | 'creator';

export interface AccountTypeResult {
  accountType: AccountType | null;
  loading: boolean;
  source: 'database_buyer' | 'database_creator' | 'url_context' | 'unknown';
  confidence: 'high' | 'low';
}

export interface UseAccountTypeOptions {
  user?: User | null;
  urlContext?: 'buyer' | 'creator' | null; // Hint from URL path, not authoritative
  debug?: boolean;
}

/**
 * Detect account type from database tables (single source of truth)
 */
async function detectAccountTypeFromDatabase(
  userId: string
): Promise<Omit<AccountTypeResult, 'loading'>> {
  try {
    // Check user_buyers table
    const { data: buyerProfile, error: buyerError } = await supabase
      .from('user_buyers')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (buyerError) {
      console.error('[useAccountType] Error querying user_buyers:', buyerError);
    }

    if (buyerProfile) {
      return {
        accountType: 'buyer',
        source: 'database_buyer',
        confidence: 'high'
      };
    }

    // Check user_creators table
    const { data: creatorProfile, error: creatorError} = await supabase
      .from('user_creators')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (creatorError) {
      console.error('[useAccountType] Error querying user_creators:', creatorError);
    }

    if (creatorProfile) {
      return {
        accountType: 'creator',
        source: 'database_creator',
        confidence: 'high'
      };
    }

    // No profile found in either table
    return {
      accountType: null,
      source: 'unknown',
      confidence: 'low'
    };
  } catch (error) {
    console.error('[useAccountType] Database query failed:', error);
    return {
      accountType: null,
      source: 'unknown',
      confidence: 'low'
    };
  }
}

/**
 * Main hook for account type detection
 */
export function useAccountType(options: UseAccountTypeOptions = {}): AccountTypeResult {
  const { user: authUser } = useAuth();
  const {
    user = authUser,
    urlContext = null,
    debug = false
  } = options;

  const [result, setResult] = useState<AccountTypeResult>({
    accountType: urlContext, // Optimistic value from URL context while loading
    loading: true,
    source: 'url_context',
    confidence: 'low'
  });

  useEffect(() => {
    if (!user?.id) {
      setResult({
        accountType: null,
        loading: false,
        source: 'unknown',
        confidence: 'low'
      });
      return;
    }

    if (debug) {
      console.log('[useAccountType] Starting detection', {
        hasUser: !!user,
        userId: user.id,
        userEmail: user?.email,
        urlContext
      });
    }

    // Query database for actual account type
    detectAccountTypeFromDatabase(user.id).then((detection) => {
      if (debug) {
        console.log('[useAccountType] Detection result:', detection);
      }

      setResult({
        ...detection,
        loading: false
      });
    });
  }, [user?.id, debug, urlContext]);

  return result;
}

/**
 * Utility function for one-off account type detection (async)
 */
export async function getAccountType(userId: string): Promise<AccountType | null> {
  const result = await detectAccountTypeFromDatabase(userId);
  return result.accountType;
}

/**
 * Get dashboard path for account type
 */
export function getDashboardPath(accountType: AccountType | null): string {
  switch (accountType) {
    case 'buyer':
      return '/buyers/chat';
    case 'creator':
      return '/home';
    default:
      return '/signin';
  }
}

/**
 * Get signup path for account type
 */
export function getSignupPath(accountType: AccountType): string {
  return `/signup/${accountType}`;
}

/**
 * Validate account type string
 */
export function isValidAccountType(value: any): value is AccountType {
  return value === 'buyer' || value === 'creator';
}

/**
 * Get display information for account type
 */
export function getAccountTypeDisplayInfo(accountType: AccountType | null) {
  switch (accountType) {
    case 'buyer':
      return {
        label: 'Buyer',
        description: 'Content buyer and media professional',
        dashboardPath: '/buyers/chat',
        color: 'blue'
      };
    case 'creator':
      return {
        label: 'Creator',
        description: 'Content creator and IP owner',
        dashboardPath: '/home',
        color: 'green'
      };
    default:
      return {
        label: 'Unknown',
        description: 'Account type not determined',
        dashboardPath: '/signin',
        color: 'gray'
      };
  }
}

/**
 * Get URL context from current route
 * Helper to extract buyer/creator hint from URL path
 */
export function getUrlContext(): AccountType | null {
  if (typeof window === 'undefined') return null;

  const path = window.location.pathname;
  if (path.startsWith('/buyers/') || path.startsWith('/signin/buyer') || path.startsWith('/signup/buyer')) {
    return 'buyer';
  }
  if (path.startsWith('/creators/') || path.startsWith('/signin/creator') || path.startsWith('/signup/creator') || path.startsWith('/home')) {
    return 'creator';
  }
  return null;
}
