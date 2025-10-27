/**
 * Enhanced Account Type Detection Utility
 * 
 * This module provides a robust, production-ready account type detection system with:
 * - Circuit breaker pattern for database operations
 * - Intelligent caching with TTL
 * - Comprehensive error handling and recovery
 * - Network-aware retry logic
 * - Session integrity validation
 * - Circular dependency prevention
 */

import { User } from '@supabase/supabase-js';
import { supabase, withRetry, isNetworkError } from '@/integrations/supabase/client';
import { getCurrentSession, validateSessionIntegrity } from './sessionManager';
import { pageReloadOptimizer } from './pageReloadOptimizer';

export type AccountType = 'buyer' | 'creator';
export type ExtendedAccountType = AccountType | null;

export interface AccountTypeResult {
  accountType: ExtendedAccountType;
  source: 'metadata' | 'database_buyer' | 'database_creator' | 'url_params' | 'default' | 'error' | 'cache';
  confidence: 'high' | 'medium' | 'low';
  profileExists: boolean;
}

export interface AccountTypeOptions {
  urlParams?: URLSearchParams;
  includeDatabaseLookup?: boolean;
  defaultAccountType?: AccountType;
  debug?: boolean;
  bypassCache?: boolean;
}

// Circuit breaker for database queries
class DatabaseCircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number = 2; // More aggressive
  private readonly recoveryTimeout: number = 15000; // 15 seconds (shorter recovery)
  private readonly timeoutDuration: number = 5000; // 5 seconds (faster timeout)
  
  isOpen(): boolean {
    if (this.failures >= this.failureThreshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      return timeSinceLastFailure < this.recoveryTimeout;
    }
    return false;
  }
  
  recordSuccess(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
  }
  
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    console.warn(`🚫 Circuit Breaker: Database failure ${this.failures}/${this.failureThreshold}`);
  }
  
  async execute<T>(operation: () => Promise<T>, fallbackValue: T): Promise<T> {
    if (this.isOpen()) {
      console.warn('🚫 Circuit Breaker: Database queries blocked, using fallback');
      return fallbackValue;
    }
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), this.timeoutDuration);
      });
      
      const result = await Promise.race([operation(), timeoutPromise]);
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      console.error('🚫 Circuit Breaker: Database operation failed:', error);
      throw error;
    }
  }
}

// Account type detection cache with TTL
class AccountTypeCache {
  private cache = new Map<string, { result: AccountTypeResult; expiry: number }>();
  private readonly ttl = 900000; // 15 minutes (extended for page reloads)
  
  get(userId: string): AccountTypeResult | null {
    const cached = this.cache.get(userId);
    if (cached && Date.now() < cached.expiry) {
      console.log(`💾 Account Type Cache: Hit for user ${userId.substring(0, 8)}...`);
      return { ...cached.result, source: 'cache' as const };
    }
    if (cached) {
      this.cache.delete(userId);
    }
    return null;
  }
  
  set(userId: string, result: AccountTypeResult): void {
    this.cache.set(userId, {
      result,
      expiry: Date.now() + this.ttl
    });
    console.log(`💾 Account Type Cache: Stored result for user ${userId.substring(0, 8)}...`);
  }
  
  clear(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
      console.log(`💾 Account Type Cache: Cleared for user ${userId.substring(0, 8)}...`);
    } else {
      this.cache.clear();
      console.log('💾 Account Type Cache: Cleared all entries');
    }
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Global instances
const dbCircuitBreaker = new DatabaseCircuitBreaker();
const accountTypeCache = new AccountTypeCache();

/**
 * Enhanced account type determination with circuit breaker and caching
 */
export async function determineAccountType(
  user: User | null,
  options: AccountTypeOptions = {}
): Promise<AccountTypeResult> {
  const startTime = Date.now();
  
  const {
    urlParams,
    includeDatabaseLookup = true,
    defaultAccountType = 'buyer',
    debug = false,
    bypassCache = false
  } = options;
  
  const log = (message: string, data?: any) => {
    if (debug) {
      console.log(`🔍 [AccountType] ${message}`, data || '');
    }
  };

  // Handle null user case early - DO NOT call getCurrentSession to avoid circular dependency
  if (!user) {
    log('No user provided - avoiding circular dependency with session manager');
    return {
      accountType: null,
      source: 'error',
      confidence: 'low',
      profileExists: false
    };
  }

  const safeUser = user;

  const userId = safeUser.id;
  log('Starting enhanced account type detection', { 
    email: safeUser.email,
    userId: userId.substring(0, 8) + '...',
    hasUrlParams: !!urlParams,
    bypassCache
  });

  // Check cache first (unless bypassed)
  if (!bypassCache) {
    const cached = accountTypeCache.get(userId);
    if (cached) {
      log('✅ Found cached account type', cached);
      
      // Optimize for page reloads to avoid database connection issues
      if (pageReloadOptimizer.shouldOptimizeForReload('accountType')) {
        pageReloadOptimizer.logOptimization('AccountType', 'Using cached result to avoid DB queries');
        return cached;
      }
      
      return cached;
    }
  }
  
  // Apply page reload optimizations
  const reloadStrategy = pageReloadOptimizer.getOptimalStrategy();
  if (reloadStrategy.reduceDatabaseQueries && !options.bypassCache) {
    log('⚡ Page reload optimization: Reducing database queries');
    // Return metadata-only result for page reloads to avoid database load
    if (safeUser.user_metadata?.account_type) {
      const result = {
        accountType: safeUser.user_metadata.account_type,
        source: 'metadata' as const,
        confidence: 'medium' as const,
        profileExists: true // Assume exists on reload
      };
      accountTypeCache.set(userId, result);
      return result;
    }
  }

  try {
    // 1. Check user metadata (highest priority - most reliable)
    const metadataAccountType = safeUser.user_metadata?.account_type;
    log('Checking metadata', { metadataAccountType });
    
    if (metadataAccountType === 'buyer' || metadataAccountType === 'creator') {
      log('✅ Found valid account type in metadata');
      
      // Skip database verification when metadata is available - trust metadata as authoritative
      // This prevents 5-second timeouts during OAuth flows and improves performance
      if (false && includeDatabaseLookup && safeUser.email) { // Disabled for performance
        const tableName = metadataAccountType === 'buyer' ? 'user_buyers' : 'user_creators';
        log('🔍 Verifying profile existence in database', { tableName });
        
        try {
          const profileExists = await dbCircuitBreaker.execute(async () => {
            const { data, error } = await withRetry(() =>
              supabase
                .from(tableName)
                .select('id')
                .eq('id', safeUser.id)
                .maybeSingle(),
              {
                maxRetries: 2,
                operationName: `profile-check-${tableName}`,
                retryCondition: (error) => isNetworkError(error)
              }
            );

            if (error) {
              log('Database query error', { error: error.message });
              throw error;
            }

            return !!data;
          }, false);
          
          log(`📋 Profile verification result: ${profileExists ? 'EXISTS' : 'NOT FOUND'}`);
          
          const result = {
            accountType: metadataAccountType,
            source: 'metadata' as const,
            confidence: 'high' as const,
            profileExists
          };
          
          accountTypeCache.set(userId, result);
          return result;
        } catch (error) {
          log('❌ Profile verification failed, using metadata without verification', error);
          const result = {
            accountType: metadataAccountType,
            source: 'metadata' as const,
            confidence: 'medium' as const,
            profileExists: false
          };
          
          accountTypeCache.set(userId, result);
          return result;
        }
      } else {
        log('⚠️ Database lookup disabled, assuming profile exists');
        const result = {
          accountType: metadataAccountType,
          source: 'metadata' as const,
          confidence: 'high' as const,
          profileExists: true
        };
        accountTypeCache.set(userId, result);
        return result;
      }
    }

    // 2. Check URL parameters (for OAuth flows)
    if (urlParams) {
      const urlAccountType = urlParams.get('account_type');
      log('Checking URL parameters', { urlAccountType });
      
      if (urlAccountType === 'buyer' || urlAccountType === 'creator') {
        log('✅ Found valid account type in URL parameters');
        const result = {
          accountType: urlAccountType,
          source: 'url_params' as const,
          confidence: 'medium' as const,
          profileExists: false
        };
        accountTypeCache.set(userId, result);
        return result;
      }
    }
    
    // 2b. Check sessionStorage as fallback for OAuth flows
    if (typeof window !== 'undefined') {
      const storedAccountType = sessionStorage.getItem('oauth_account_type');
      if (storedAccountType === 'buyer' || storedAccountType === 'creator') {
        log('✅ Found valid account type in sessionStorage');
        sessionStorage.removeItem('oauth_account_type');
        
        const result = {
          accountType: storedAccountType,
          source: 'url_params' as const,
          confidence: 'medium' as const,
          profileExists: false
        };
        accountTypeCache.set(userId, result);
        return result;
      }
    }

    // 3. Enhanced database lookup with circuit breaker
    if (includeDatabaseLookup && safeUser.email) {
      log('Performing enhanced database lookup with circuit breaker');
      
      try {
        const dbResults = await dbCircuitBreaker.execute(async () => {
          const [buyerResult, creatorResult] = await Promise.all([
            withRetry(() =>
              supabase
                .from('user_buyers')
                .select('id, tier')
                .eq('id', safeUser.id)
                .maybeSingle(),
              {
                maxRetries: 2,
                operationName: 'buyer-profile-lookup',
                retryCondition: (error) => isNetworkError(error)
              }
            ),
            withRetry(() =>
              supabase
                .from('user_creators')
                .select('id, pen_name')
                .eq('id', safeUser.id)
                .maybeSingle(),
              {
                maxRetries: 2,
                operationName: 'creator-profile-lookup',
                retryCondition: (error) => isNetworkError(error)
              }
            )
          ]);
          
          return { buyerResult, creatorResult };
        }, { buyerResult: { data: null, error: null }, creatorResult: { data: null, error: null } });
        
        const { buyerResult, creatorResult } = dbResults;
        log('Enhanced database query completed successfully');

        // Check buyer profile first
        if (buyerResult.data && !buyerResult.error) {
          log('✅ Found buyer profile in database');
          const result = {
            accountType: 'buyer' as const,
            source: 'database_buyer' as const,
            confidence: 'high' as const,
            profileExists: true
          };
          accountTypeCache.set(userId, result);
          return result;
        }

        // Check creator profile
        if (creatorResult.data && !creatorResult.error) {
          log('✅ Found creator profile in database');
          const result = {
            accountType: 'creator' as const,
            source: 'database_creator' as const,
            confidence: 'high' as const,
            profileExists: true
          };
          accountTypeCache.set(userId, result);
          return result;
        }

        // Log database results for debugging
        log('Enhanced database lookup results', {
          buyerError: buyerResult.error?.message,
          creatorError: creatorResult.error?.message,
          hasBuyerData: !!buyerResult.data,
          hasCreatorData: !!creatorResult.data
        });
        
        // Handle specific database errors
        if (creatorResult.error?.message?.includes('row-level security') || 
            buyerResult.error?.message?.includes('row-level security')) {
          log('⚠️ RLS blocking access - potential session corruption');
          return {
            accountType: null,
            source: 'error' as const,
            confidence: 'low' as const,
            profileExists: false
          };
        }
      } catch (error) {
        log('❌ Enhanced database lookup failed', error);
        
        // Handle circuit breaker open state
        if (error instanceof Error && error.message.includes('timeout')) {
          log('🚫 Database timeout, using metadata fallback');
          if (metadataAccountType) {
            const result = {
              accountType: metadataAccountType,
              source: 'metadata' as const,
              confidence: 'medium' as const,
              profileExists: false
            };
            accountTypeCache.set(userId, result);
            return result;
          }
        }
        
        log('⚠️ Database lookup failed, continuing with fallbacks');
      }
    }
    
    // 4. Final fallback - use metadata if available
    if (metadataAccountType && (metadataAccountType === 'buyer' || metadataAccountType === 'creator')) {
      log('⚠️ Using metadata as final fallback');
      const result = {
        accountType: metadataAccountType,
        source: 'metadata' as const,
        confidence: 'low' as const,
        profileExists: false
      };
      accountTypeCache.set(userId, result);
      return result;
    }
    
    // 5. Absolute final state - no account type determinable
    log('❌ No account type determinable for user - critical error');
    return {
      accountType: null,
      source: 'error' as const,
      confidence: 'low' as const,
      profileExists: false
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    log('❌ Critical error during account type detection', { 
      error: error instanceof Error ? error.message : error,
      duration: `${duration}ms`
    });
    
    return {
      accountType: null,
      source: 'error' as const,
      confidence: 'low' as const,
      profileExists: false
    };
  } finally {
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`⚠️ Account Type Detection: Slow operation completed in ${duration}ms`);
    }
  }
}

/**
 * Lightweight version that only checks metadata and URL params
 */
export function getAccountTypeFromMetadata(
  user: User | null,
  urlParams?: URLSearchParams,
  defaultType: AccountType = 'buyer'
): AccountType {
  if (!user) return defaultType;
  
  // Check metadata first
  const metadataType = user.user_metadata?.account_type;
  if (metadataType === 'buyer' || metadataType === 'creator') {
    return metadataType;
  }
  
  // Check URL params
  if (urlParams) {
    const urlType = urlParams.get('account_type');
    if (urlType === 'buyer' || urlType === 'creator') {
      return urlType;
    }
  }
  
  // Check sessionStorage as fallback
  if (typeof window !== 'undefined') {
    const storedType = sessionStorage.getItem('oauth_account_type');
    if (storedType === 'buyer' || storedType === 'creator') {
      sessionStorage.removeItem('oauth_account_type');
      return storedType;
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
  if (!user?.id) return false;
  
  try {
    const tableName = accountType === 'buyer' ? 'user_buyers' : 'user_creators';
    
    const { data } = await withRetry(() =>
      supabase
        .from(tableName)
        .select('id')
        .eq('id', user.id)
        .maybeSingle(),
      {
        maxRetries: 2,
        operationName: `check-profile-${accountType}`,
        retryCondition: (error) => isNetworkError(error)
      }
    );
    
    return !!data;
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
        dashboardPath: '/buyers/home',
        signupPath: '/signup/buyer',
        homePath: '/buyers/home'
      };
    case 'creator':
      return {
        label: 'Creator',
        dashboardPath: '/creators/home',
        signupPath: '/signup/creator',
        homePath: '/creators/home'
      };
    default:
      return {
        label: 'User',
        dashboardPath: '/buyers/home',
        signupPath: '/signup/buyer',
        homePath: '/buyers/home'
      };
  }
}

/**
 * React hook for account type detection with enhanced error handling
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function useAccountType(options: AccountTypeOptions = {}) {
  const { user, signOut } = useAuth();
  const [result, setResult] = useState<AccountTypeResult | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    defaultAccountType = 'buyer',
    includeDatabaseLookup = true,
    debug = false
  } = options;

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const detectAccountType = async () => {
      // Don't run detection if user is not available yet
      if (!user) {
        console.log('🔍 [AccountType] Waiting for user to be available...');
        setResult({
          accountType: null,
          source: 'loading',
          confidence: 'low',
          profileExists: false
        });
        setLoading(true);
        return;
      }

      setLoading(true);
      
      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(async () => {
        if (isMounted) {
          console.warn('⏰ Account type detection timed out');

          // Don't force logout on timeout - instead use fallback detection
          if (user) {
          console.warn('⚠️ Account type detection timeout with logged in user - attempting metadata fallback');

          const metadataAccountType = user.user_metadata?.account_type;
          if (metadataAccountType === 'buyer' || metadataAccountType === 'creator') {
            console.log(`🔄 Using metadata account type fallback: ${metadataAccountType}`);
            setResult({
              accountType: metadataAccountType,
              source: 'metadata',
              confidence: 'medium',
              profileExists: false
            });
          } else {
            console.warn('⚠️ Metadata unavailable or invalid during timeout – treating account type as unknown');
            setResult({
              accountType: null,
              source: 'error',
              confidence: 'low',
              profileExists: false
            });
          }
          setLoading(false);
          return;
        }

          setResult({
            accountType: null,
            source: 'error',
            confidence: 'low',
            profileExists: false
          });
          setLoading(false);
        }
      }, 10000); // 10 second timeout

      try {
        const detection = await determineAccountType(user, {
          defaultAccountType,
          includeDatabaseLookup,
          debug
        });
        
        if (isMounted) {
          clearTimeout(timeoutId);
          setResult(detection);
        }
      } catch (error) {
        console.error('Error in useAccountType:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          setResult({
            accountType: null,
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
      clearTimeout(timeoutId);
    };
  }, [user, defaultAccountType, includeDatabaseLookup, debug, signOut]);

  return {
    accountType: result?.accountType || null,
    source: result?.source || 'error',
    confidence: result?.confidence || 'low',
    profileExists: result?.profileExists || false,
    loading,
    result
  };
}

/**
 * Clear account type cache for specific user or all users
 */
export function clearAccountTypeCache(userId?: string): void {
  accountTypeCache.clear(userId);
}

/**
 * Get account type cache statistics
 */
export function getAccountTypeCacheStats(): {
  size: number;
  circuitBreakerStatus: 'open' | 'closed';
} {
  return {
    size: accountTypeCache.size(),
    circuitBreakerStatus: dbCircuitBreaker.isOpen() ? 'open' : 'closed'
  };
}
