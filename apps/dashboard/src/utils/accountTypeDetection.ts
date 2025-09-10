/**
 * Centralized Account Type Detection Utility
 * 
 * This module provides a standardized way to detect user account types
 * across the entire application, ensuring consistency and reducing errors.
 * 
 * Priority Order:
 * 1. User metadata (most reliable for new users)
 * 2. Database profile lookup (fallback for existing users)
 * 3. URL parameters (for OAuth flows)
 * 4. Default to 'buyer' (backward compatibility)
 */

import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AccountType = 'buyer' | 'ip_owner';
export type ExtendedAccountType = AccountType | null;

export interface AccountTypeResult {
  accountType: ExtendedAccountType;
  source: 'metadata' | 'database_buyer' | 'database_creator' | 'url_params' | 'default' | 'error';
  confidence: 'high' | 'medium' | 'low';
  profileExists: boolean;
}

export interface AccountTypeOptions {
  /**
   * URL search parameters to check for account_type
   * Useful for OAuth flows where account type is passed via URL
   */
  urlParams?: URLSearchParams;
  
  /**
   * Whether to perform database lookup if metadata is not available
   * Set to false for performance-critical paths where you only need metadata
   */
  includeDatabaseLookup?: boolean;
  
  /**
   * Default account type if none can be determined
   * Defaults to 'buyer' for backward compatibility
   */
  defaultAccountType?: AccountType;
  
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
}

/**
 * Main function to determine user account type with comprehensive fallback logic
 */
export async function determineAccountType(
  user: User | null,
  options: AccountTypeOptions = {}
): Promise<AccountTypeResult> {
  const {
    urlParams,
    includeDatabaseLookup = true,
    defaultAccountType = 'buyer',
    debug = false
  } = options;
  
  const log = (message: string, data?: any) => {
    if (debug) {
      console.log(`🔍 [AccountType] ${message}`, data || '');
    }
  };

  // Handle null user
  if (!user) {
    log('No user provided');
    return {
      accountType: null,
      source: 'error',
      confidence: 'low',
      profileExists: false
    };
  }

  log('Starting account type detection', { email: user.email });

  try {
    // 1. Check user metadata (highest priority - most reliable)
    const metadataAccountType = user.user_metadata?.account_type;
    log('Checking metadata', { metadataAccountType });
    
    if (metadataAccountType === 'buyer' || metadataAccountType === 'ip_owner') {
      log('✅ Found valid account type in metadata');
      return {
        accountType: metadataAccountType,
        source: 'metadata',
        confidence: 'high',
        profileExists: true // Assume profile exists if metadata is set
      };
    }

    // 2. Check URL parameters (for OAuth flows)
    if (urlParams) {
      const urlAccountType = urlParams.get('account_type');
      log('Checking URL parameters', { urlAccountType });
      
      if (urlAccountType === 'buyer' || urlAccountType === 'ip_owner') {
        log('✅ Found valid account type in URL parameters');
        return {
          accountType: urlAccountType,
          source: 'url_params',
          confidence: 'medium',
          profileExists: false // URL params suggest profile completion needed
        };
      }
    }

    // 3. Database lookup (if enabled)
    if (includeDatabaseLookup && user.email) {
      log('Performing database lookup');
      
      // Check both tables in parallel for efficiency
      const [buyerResult, creatorResult] = await Promise.all([
        supabase
          .from('user_buyers')
          .select('id, tier')
          .eq('email', user.email.toLowerCase())
          .maybeSingle(),
        supabase
          .from('user_creators')
          .select('id, pen_name')
          .eq('email', user.email.toLowerCase())
          .maybeSingle()
      ]);

      // Check buyer profile first
      if (buyerResult.data && !buyerResult.error) {
        log('✅ Found buyer profile in database');
        return {
          accountType: 'buyer',
          source: 'database_buyer',
          confidence: 'high',
          profileExists: true
        };
      }

      // Check creator profile
      if (creatorResult.data && !creatorResult.error) {
        log('✅ Found creator profile in database');
        return {
          accountType: 'ip_owner',
          source: 'database_creator',
          confidence: 'high',
          profileExists: true
        };
      }

      // Log database query results for debugging
      log('Database lookup results', {
        buyerError: buyerResult.error?.message,
        creatorError: creatorResult.error?.message,
        hasBuyerData: !!buyerResult.data,
        hasCreatorData: !!creatorResult.data
      });
    }

    // 4. Default fallback
    log('⚠️ No account type found, using default', { defaultAccountType });
    return {
      accountType: defaultAccountType,
      source: 'default',
      confidence: 'low',
      profileExists: false
    };

  } catch (error) {
    log('❌ Error during account type detection', error);
    return {
      accountType: defaultAccountType,
      source: 'error',
      confidence: 'low',
      profileExists: false
    };
  }
}

/**
 * Lightweight version that only checks metadata and URL params
 * Useful for performance-critical paths or when database lookup is not needed
 */
export function getAccountTypeFromMetadata(
  user: User | null,
  urlParams?: URLSearchParams,
  defaultType: AccountType = 'buyer'
): AccountType {
  if (!user) return defaultType;
  
  // Check metadata first
  const metadataType = user.user_metadata?.account_type;
  if (metadataType === 'buyer' || metadataType === 'ip_owner') {
    return metadataType;
  }
  
  // Check URL params
  if (urlParams) {
    const urlType = urlParams.get('account_type');
    if (urlType === 'buyer' || urlType === 'ip_owner') {
      return urlType;
    }
  }
  
  return defaultType;
}

/**
 * Check if user has a profile in the database for their account type
 */
export async function checkProfileExists(
  user: User | null,
  accountType: AccountType
): Promise<boolean> {
  if (!user?.email) return false;
  
  try {
    if (accountType === 'buyer') {
      const { data } = await supabase
        .from('user_buyers')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();
      
      return !!data;
    } else {
      const { data } = await supabase
        .from('user_creators')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();
      
      return !!data;
    }
  } catch (error) {
    console.error('Error checking profile existence:', error);
    return false;
  }
}

/**
 * Get user type display information
 */
export function getAccountTypeDisplayInfo(accountType: ExtendedAccountType) {
  switch (accountType) {
    case 'buyer':
      return {
        label: 'Buyer',
        dashboardPath: '/buyers/titles',
        signupPath: '/signup/buyer',
        homePath: '/buyers/home'
      };
    case 'ip_owner':
      return {
        label: 'Creator',
        dashboardPath: '/creators/home/',
        signupPath: '/signup/creator',
        homePath: '/creators/home'
      };
    default:
      return {
        label: 'User',
        dashboardPath: '/buyers/titles',
        signupPath: '/signup/buyer',
        homePath: '/buyers/home'
      };
  }
}

/**
 * React hook for account type detection with caching
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function useAccountType(options: AccountTypeOptions = {}) {
  const { user } = useAuth();
  const [result, setResult] = useState<AccountTypeResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const detectAccountType = async () => {
      setLoading(true);
      try {
        const detection = await determineAccountType(user, options);
        if (isMounted) {
          setResult(detection);
        }
      } catch (error) {
        console.error('Error in useAccountType:', error);
        if (isMounted) {
          setResult({
            accountType: options.defaultAccountType || 'buyer',
            source: 'error',
            confidence: 'low',
            profileExists: false
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    detectAccountType();

    return () => {
      isMounted = false;
    };
  }, [user, options.defaultAccountType, options.includeDatabaseLookup]);

  return {
    accountType: result?.accountType || null,
    source: result?.source || 'error',
    confidence: result?.confidence || 'low',
    profileExists: result?.profileExists || false,
    loading,
    result
  };
}