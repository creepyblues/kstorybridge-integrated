/**
 * Atomic Profile Creation Utility
 * 
 * This module provides race condition-safe profile creation with comprehensive
 * error handling, retry mechanisms, and conflict resolution for concurrent operations.
 * 
 * Key Features:
 * - Atomic profile creation with proper locking mechanisms
 * - Conflict resolution for simultaneous creation attempts
 * - Retry mechanisms for transient failures
 * - Comprehensive error handling and recovery
 * - Support for both buyer and creator profiles
 * - Integration with existing database triggers
 */

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface BuyerProfileData {
  id: string;
  email: string;
  full_name: string;
  buyer_company: string;
  buyer_role: string;
  linkedin_url?: string | null;
  tier?: 'basic' | 'invited' | 'pro' | 'suite';
  requested?: boolean;
  account_type?: 'buyer';
}

export interface CreatorProfileData {
  id: string;
  email: string;
  full_name: string;
  pen_name: string;
  ip_owner_role?: string | null;
  ip_owner_company?: string | null;
  website_url?: string | null;
  invitation_status?: string;
  account_type?: 'creator';
}

export interface ProfileCreationResult {
  success: boolean;
  profile?: BuyerProfileData | CreatorProfileData;
  existed?: boolean;
  created?: boolean;
  updated?: boolean;
  error?: string;
  retryCount?: number;
}

export interface ProfileCreationOptions {
  maxRetries?: number;
  retryDelay?: number;
  allowUpdate?: boolean;
  waitForTrigger?: boolean;
  lockTimeout?: number;
}

// In-memory lock to prevent concurrent operations for the same user
const profileCreationLocks = new Map<string, Promise<ProfileCreationResult>>();

/**
 * Determines if an error is retryable (transient network/database issues)
 */
function isRetryableError(error: unknown): boolean {
  const retryablePatterns = [
    'network',
    'timeout',
    'connection',
    'temporary',
    'rate limit',
    'deadlock',
    'lock',
    'busy',
    'unavailable',
    '500',
    '502',
    '503',
    '504'
  ];
  
  const errorObj = error as Record<string, unknown>;
  const errorMessage = (errorObj?.message as string)?.toLowerCase() || '';
  const errorCode = (errorObj?.code as string)?.toLowerCase() || '';
  
  return retryablePatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  );
}

/**
 * Safely waits for potential database trigger completion
 */
async function waitForTriggerCompletion(
  userId: string,
  accountType: 'buyer' | 'creator',
  maxWait: number = 3000
): Promise<{ found: boolean; profile?: BuyerProfileData | CreatorProfileData }> {
  const startTime = Date.now();
  const checkInterval = 200; // Check every 200ms
  
  console.log(`🕐 Atomic Profile: Waiting for database trigger completion for ${accountType} ${userId}`);
  
  while (Date.now() - startTime < maxWait) {
    try {
      const tableName = accountType === 'buyer' ? 'user_buyers' : 'user_creators';
      const { data: profile, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.warn(`⚠️ Atomic Profile: Error checking for trigger-created profile:`, error);
      }
      
      if (profile) {
        console.log(`✅ Atomic Profile: Found trigger-created ${accountType} profile for ${userId}`);
        return { found: true, profile };
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    } catch (error) {
      console.warn(`⚠️ Atomic Profile: Exception during trigger wait:`, error);
    }
  }
  
  console.log(`⏰ Atomic Profile: Trigger wait timeout for ${accountType} ${userId}`);
  return { found: false };
}

/**
 * Creates a buyer profile with atomic guarantees and conflict resolution
 */
export async function createBuyerProfileAtomic(
  profileData: BuyerProfileData,
  options: ProfileCreationOptions = {}
): Promise<ProfileCreationResult> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    allowUpdate = true,
    waitForTrigger = true,
    lockTimeout = 10000
  } = options;
  
  const lockKey = `buyer_${profileData.id}`;
  
  // Check if there's already an operation in progress for this user
  if (profileCreationLocks.has(lockKey)) {
    console.log(`🔒 Atomic Profile: Waiting for existing buyer profile operation for ${profileData.id}`);
    
    try {
      // Wait for existing operation with timeout
      const existingOperation = profileCreationLocks.get(lockKey)!;
      const timeoutPromise = new Promise<ProfileCreationResult>((_, reject) => {
        setTimeout(() => reject(new Error('Lock timeout')), lockTimeout);
      });
      
      return await Promise.race([existingOperation, timeoutPromise]);
    } catch (error) {
      console.warn(`⚠️ Atomic Profile: Lock timeout or error, proceeding with new operation:`, error);
      profileCreationLocks.delete(lockKey);
    }
  }
  
  // Create the atomic operation promise
  const operation = createBuyerProfileOperation(profileData, {
    maxRetries,
    retryDelay,
    allowUpdate,
    waitForTrigger
  });
  
  // Store the operation in the lock map
  profileCreationLocks.set(lockKey, operation);
  
  try {
    const result = await operation;
    return result;
  } finally {
    // Always clean up the lock
    profileCreationLocks.delete(lockKey);
  }
}

/**
 * Internal buyer profile creation operation
 */
async function createBuyerProfileOperation(
  profileData: BuyerProfileData,
  options: Required<Pick<ProfileCreationOptions, 'maxRetries' | 'retryDelay' | 'allowUpdate' | 'waitForTrigger'>>
): Promise<ProfileCreationResult> {
  const { maxRetries, retryDelay, allowUpdate, waitForTrigger } = options;
  
  console.log(`🏗️ Atomic Profile: Starting buyer profile creation for ${profileData.email}`);
  
  // First, wait for potential database trigger
  if (waitForTrigger) {
    const triggerResult = await waitForTriggerCompletion(profileData.id, 'buyer', 3000);
    if (triggerResult.found) {
      console.log(`✅ Atomic Profile: Buyer profile already exists from trigger`);
      return {
        success: true,
        profile: triggerResult.profile,
        existed: true,
        retryCount: 0
      };
    }
  }
  
  let lastError: string | undefined;
  let retryCount = 0;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    retryCount = attempt - 1;
    
    try {
      console.log(`🔄 Atomic Profile: Buyer creation attempt ${attempt}/${maxRetries}`);
      
      // Ensure required fields have default values
      const safeProfileData = {
        ...profileData,
        tier: profileData.tier || 'basic',
        linkedin_url: profileData.linkedin_url || null,
        account_type: 'buyer' as const,
        created_at: new Date().toISOString()
      };
      
      if (allowUpdate) {
        // Use upsert with proper conflict resolution
        console.log(`💾 Atomic Profile: Using upsert for buyer profile`);

        // Ensure we have a fresh session before attempting database operation
        await supabase.auth.getSession();

        const { data: profile, error } = await supabase
          .from('user_buyers')
          .upsert(safeProfileData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();
          
        if (error) {
          lastError = error.message;
          console.warn(`⚠️ Atomic Profile: Buyer upsert attempt ${attempt} failed:`, error.message);
          
          // Check if it's a conflict that we should handle specially
          if (error.code === '23505' && error.message.includes('duplicate key')) {
            // Handle unique constraint violation by checking existing profile
            console.log(`🔍 Atomic Profile: Checking existing buyer profile due to conflict`);
            const { data: existing, error: selectError } = await supabase
              .from('user_buyers')
              .select('*')
              .eq('id', profileData.id)
              .single();
              
            if (!selectError && existing) {
              console.log(`✅ Atomic Profile: Found existing buyer profile`);
              return {
                success: true,
                profile: existing,
                existed: true,
                retryCount
              };
            }
          }
          
          if (!isRetryableError(error) || attempt === maxRetries) {
            break;
          }
        } else {
          console.log(`✅ Atomic Profile: Buyer profile upserted successfully`);
          return {
            success: true,
            profile,
            created: true,
            retryCount
          };
        }
      } else {
        // Use insert-only approach
        console.log(`📝 Atomic Profile: Using insert-only for buyer profile`);

        // Ensure we have a fresh session before attempting database operation
        await supabase.auth.getSession();

        const { data: profile, error } = await supabase
          .from('user_buyers')
          .insert(safeProfileData)
          .select()
          .single();
          
        if (error) {
          lastError = error.message;
          console.warn(`⚠️ Atomic Profile: Buyer insert attempt ${attempt} failed:`, error.message);
          
          // Handle duplicate key specially
          if (error.code === '23505') {
            console.log(`🔍 Atomic Profile: Profile already exists, fetching it`);
            const { data: existing, error: selectError } = await supabase
              .from('user_buyers')
              .select('*')
              .eq('id', profileData.id)
              .single();
              
            if (!selectError && existing) {
              console.log(`✅ Atomic Profile: Found existing buyer profile`);
              return {
                success: true,
                profile: existing,
                existed: true,
                retryCount
              };
            }
          }
          
          if (!isRetryableError(error) || attempt === maxRetries) {
            break;
          }
        } else {
          console.log(`✅ Atomic Profile: Buyer profile inserted successfully`);
          return {
            success: true,
            profile,
            created: true,
            retryCount
          };
        }
      }
      
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ Atomic Profile: Buyer creation attempt ${attempt} threw exception:`, err);
    }
    
    // Wait before retry (except on last attempt)
    if (attempt < maxRetries) {
      const delay = retryDelay * Math.pow(1.5, attempt - 1); // Exponential backoff
      console.log(`⏳ Atomic Profile: Waiting ${delay}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`❌ Atomic Profile: Buyer profile creation failed after ${maxRetries} attempts:`, lastError);
  return {
    success: false,
    error: lastError || 'Unknown error',
    retryCount
  };
}

/**
 * Creates a creator profile with atomic guarantees and conflict resolution
 */
export async function createCreatorProfileAtomic(
  profileData: CreatorProfileData,
  options: ProfileCreationOptions = {}
): Promise<ProfileCreationResult> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    allowUpdate = true,
    waitForTrigger = true,
    lockTimeout = 10000
  } = options;
  
  const lockKey = `creator_${profileData.id}`;
  
  // Check if there's already an operation in progress for this user
  if (profileCreationLocks.has(lockKey)) {
    console.log(`🔒 Atomic Profile: Waiting for existing creator profile operation for ${profileData.id}`);
    
    try {
      const existingOperation = profileCreationLocks.get(lockKey)!;
      const timeoutPromise = new Promise<ProfileCreationResult>((_, reject) => {
        setTimeout(() => reject(new Error('Lock timeout')), lockTimeout);
      });
      
      return await Promise.race([existingOperation, timeoutPromise]);
    } catch (error) {
      console.warn(`⚠️ Atomic Profile: Lock timeout or error, proceeding with new operation:`, error);
      profileCreationLocks.delete(lockKey);
    }
  }
  
  // Create the atomic operation promise
  const operation = createCreatorProfileOperation(profileData, {
    maxRetries,
    retryDelay,
    allowUpdate,
    waitForTrigger
  });
  
  // Store the operation in the lock map
  profileCreationLocks.set(lockKey, operation);
  
  try {
    const result = await operation;
    return result;
  } finally {
    // Always clean up the lock
    profileCreationLocks.delete(lockKey);
  }
}

/**
 * Internal creator profile creation operation
 */
async function createCreatorProfileOperation(
  profileData: CreatorProfileData,
  options: Required<Pick<ProfileCreationOptions, 'maxRetries' | 'retryDelay' | 'allowUpdate' | 'waitForTrigger'>>
): Promise<ProfileCreationResult> {
  const { maxRetries, retryDelay, allowUpdate, waitForTrigger } = options;
  
  console.log(`🏗️ Atomic Profile: Starting creator profile creation for ${profileData.email}`);
  
  // First, wait for potential database trigger
  if (waitForTrigger) {
    const triggerResult = await waitForTriggerCompletion(profileData.id, 'creator', 3000);
    if (triggerResult.found) {
      console.log(`✅ Atomic Profile: Creator profile already exists from trigger`);
      return {
        success: true,
        profile: triggerResult.profile,
        existed: true,
        retryCount: 0
      };
    }
  }
  
  let lastError: string | undefined;
  let retryCount = 0;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    retryCount = attempt - 1;
    
    try {
      console.log(`🔄 Atomic Profile: Creator creation attempt ${attempt}/${maxRetries}`);
      
      // Ensure required fields have default values
      const safeProfileData = {
        ...profileData,
        invitation_status: profileData.invitation_status || 'invited',
        account_type: 'creator' as const,
        created_at: new Date().toISOString()
      };
      
      if (allowUpdate) {
        // Use upsert with proper conflict resolution
        console.log(`💾 Atomic Profile: Using upsert for creator profile`);

        // Ensure we have a fresh session before attempting database operation
        await supabase.auth.getSession();

        const { data: profile, error } = await supabase
          .from('user_creators')
          .upsert(safeProfileData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();
          
        if (error) {
          lastError = error.message;
          console.warn(`⚠️ Atomic Profile: Creator upsert attempt ${attempt} failed:`, error.message);
          
          // Check if it's a conflict that we should handle specially
          if (error.code === '23505' && error.message.includes('duplicate key')) {
            console.log(`🔍 Atomic Profile: Checking existing creator profile due to conflict`);
            const { data: existing, error: selectError } = await supabase
              .from('user_creators')
              .select('*')
              .eq('id', profileData.id)
              .single();
              
            if (!selectError && existing) {
              console.log(`✅ Atomic Profile: Found existing creator profile`);
              return {
                success: true,
                profile: existing,
                existed: true,
                retryCount
              };
            }
          }
          
          if (!isRetryableError(error) || attempt === maxRetries) {
            break;
          }
        } else {
          console.log(`✅ Atomic Profile: Creator profile upserted successfully`);
          return {
            success: true,
            profile,
            created: true,
            retryCount
          };
        }
      } else {
        // Use insert-only approach
        console.log(`📝 Atomic Profile: Using insert-only for creator profile`);

        // Ensure we have a fresh session before attempting database operation
        await supabase.auth.getSession();

        const { data: profile, error } = await supabase
          .from('user_creators')
          .insert(safeProfileData)
          .select()
          .single();
          
        if (error) {
          lastError = error.message;
          console.warn(`⚠️ Atomic Profile: Creator insert attempt ${attempt} failed:`, error.message);
          
          // Handle duplicate key specially
          if (error.code === '23505') {
            console.log(`🔍 Atomic Profile: Profile already exists, fetching it`);
            const { data: existing, error: selectError } = await supabase
              .from('user_creators')
              .select('*')
              .eq('id', profileData.id)
              .single();
              
            if (!selectError && existing) {
              console.log(`✅ Atomic Profile: Found existing creator profile`);
              return {
                success: true,
                profile: existing,
                existed: true,
                retryCount
              };
            }
          }
          
          if (!isRetryableError(error) || attempt === maxRetries) {
            break;
          }
        } else {
          console.log(`✅ Atomic Profile: Creator profile inserted successfully`);
          return {
            success: true,
            profile,
            created: true,
            retryCount
          };
        }
      }
      
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ Atomic Profile: Creator creation attempt ${attempt} threw exception:`, err);
    }
    
    // Wait before retry (except on last attempt)
    if (attempt < maxRetries) {
      const delay = retryDelay * Math.pow(1.5, attempt - 1); // Exponential backoff
      console.log(`⏳ Atomic Profile: Waiting ${delay}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`❌ Atomic Profile: Creator profile creation failed after ${maxRetries} attempts:`, lastError);
  return {
    success: false,
    error: lastError || 'Unknown error',
    retryCount
  };
}

/**
 * Helper function to create profile based on user and account type
 */
export async function createProfileFromUser(
  user: User,
  accountType: 'buyer' | 'creator',
  additionalData: Record<string, unknown> = {},
  options: ProfileCreationOptions = {}
): Promise<ProfileCreationResult> {
  if (accountType === 'buyer') {
    const profileData: BuyerProfileData = {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || additionalData.full_name || '',
      buyer_company: user.user_metadata?.buyer_company || additionalData.buyer_company || '',
      buyer_role: user.user_metadata?.buyer_role || additionalData.buyer_role || '',
      linkedin_url: user.user_metadata?.linkedin_url || additionalData.linkedin_url || null,
      tier: user.user_metadata?.tier || additionalData.tier || 'basic'
    };
    
    return createBuyerProfileAtomic(profileData, options);
  } else {
    const profileData: CreatorProfileData = {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || additionalData.full_name || '',
      pen_name: user.user_metadata?.pen_name || additionalData.pen_name || '',
      ip_owner_role: user.user_metadata?.ip_owner_role || additionalData.ip_owner_role || null,
      ip_owner_company: user.user_metadata?.ip_owner_company || additionalData.ip_owner_company || null,
      website_url: user.user_metadata?.website_url || additionalData.website_url || null,
      invitation_status: user.user_metadata?.invitation_status || additionalData.invitation_status || 'invited'
    };
    
    return createCreatorProfileAtomic(profileData, options);
  }
}

/**
 * Health check for the atomic profile creation system
 */
export async function performAtomicProfileSystemHealthCheck(): Promise<{
  healthy: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check if there are any hanging locks
  const activeLocks = profileCreationLocks.size;
  if (activeLocks > 0) {
    issues.push(`${activeLocks} active profile creation locks detected`);
    recommendations.push('Monitor for hung operations or consider clearing locks');
  }
  
  // Test database connectivity
  try {
    await supabase.from('user_buyers').select('count').limit(1);
    await supabase.from('user_creators').select('count').limit(1);
  } catch (error) {
    issues.push('Database connectivity issues detected');
    recommendations.push('Check database connection and permissions');
  }
  
  const healthy = issues.length === 0;
  
  console.log(`🏥 Atomic Profile System Health Check: ${healthy ? 'HEALTHY' : 'ISSUES DETECTED'}`, {
    healthy,
    activeLocks,
    issues,
    recommendations
  });
  
  return { healthy, issues, recommendations };
}