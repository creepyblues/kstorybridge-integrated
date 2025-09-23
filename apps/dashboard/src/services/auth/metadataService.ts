import { supabase } from '@/integrations/supabase/client';
import { authService } from './AuthService';
import type { User } from '@supabase/supabase-js';

export type AccountType = 'buyer' | 'creator';

/**
 * Service for managing user metadata, specifically account_type
 * Ensures all users have proper account_type metadata for routing and access control
 */
export class MetadataService {
  private static instance: MetadataService;

  private constructor() {}

  static getInstance(): MetadataService {
    if (!MetadataService.instance) {
      MetadataService.instance = new MetadataService();
    }
    return MetadataService.instance;
  }

  /**
   * Detects account type from database tables by user ID
   * Checks user_buyers first, then user_creators
   */
  async detectAccountTypeFromDatabase(userId: string): Promise<AccountType | null> {
    try {
      console.log('🔍 MetadataService: Detecting account type for user:', userId);

      // Check user_buyers table first
      const { data: buyerData, error: buyerError } = await supabase
        .from('user_buyers')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (buyerError) {
        console.warn('⚠️ MetadataService: Error checking user_buyers:', buyerError.message);
      }

      if (buyerData) {
        console.log('✅ MetadataService: User found in user_buyers table');
        return 'buyer';
      }

      // Check user_creators table
      const { data: creatorData, error: creatorError } = await supabase
        .from('user_creators')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (creatorError) {
        console.warn('⚠️ MetadataService: Error checking user_creators:', creatorError.message);
      }

      if (creatorData) {
        console.log('✅ MetadataService: User found in user_creators table');
        return 'creator';
      }

      console.log('ℹ️ MetadataService: User not found in either table');
      return null;

    } catch (error) {
      console.error('❌ MetadataService: Exception during account type detection:', error);
      return null;
    }
  }

  /**
   * Detects account type from database tables by email
   * Fallback method when user ID is not available
   */
  async detectAccountTypeFromDatabaseByEmail(email: string): Promise<AccountType | null> {
    try {
      console.log('🔍 MetadataService: Detecting account type by email:', email);

      // Check user_buyers table first
      const { data: buyerData, error: buyerError } = await supabase
        .from('user_buyers')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (buyerError) {
        console.warn('⚠️ MetadataService: Error checking user_buyers by email:', buyerError.message);
      }

      if (buyerData) {
        console.log('✅ MetadataService: User found in user_buyers table by email');
        return 'buyer';
      }

      // Check user_creators table
      const { data: creatorData, error: creatorError } = await supabase
        .from('user_creators')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (creatorError) {
        console.warn('⚠️ MetadataService: Error checking user_creators by email:', creatorError.message);
      }

      if (creatorData) {
        console.log('✅ MetadataService: User found in user_creators table by email');
        return 'creator';
      }

      console.log('ℹ️ MetadataService: User not found in either table by email');
      return null;

    } catch (error) {
      console.error('❌ MetadataService: Exception during account type detection by email:', error);
      return null;
    }
  }

  /**
   * Ensures user has account_type metadata
   * If missing, detects from database and updates metadata
   *
   * @param user - Supabase user object
   * @param options - Configuration options
   * @returns Promise<boolean> - true if metadata exists or was successfully added
   */
  async ensureAccountTypeMetadata(
    user: User,
    options: {
      force?: boolean; // Force update even if metadata exists
      skipSessionCheck?: boolean; // Skip session validation (useful during OAuth)
      debug?: boolean; // Enable debug logging
    } = {}
  ): Promise<{ success: boolean; accountType?: AccountType; error?: string }> {
    const { force = false, skipSessionCheck = false, debug = false } = options;

    console.log('🔧 MetadataService: ensureAccountTypeMetadata called with:', {
      userEmail: user.email,
      userId: user.id,
      existingMetadata: user.user_metadata?.account_type,
      force,
      skipSessionCheck,
      debug
    });

    try {
      // Check if metadata already exists and we're not forcing update
      const existingAccountType = user.user_metadata?.account_type;
      console.log('🔍 MetadataService: Checking existing metadata:', {
        existingAccountType,
        force,
        willSkip: existingAccountType && !force
      });

      if (existingAccountType && !force) {
        console.log('✅ MetadataService: account_type metadata already exists:', existingAccountType);
        return { success: true, accountType: existingAccountType };
      }

      if (force) {
        console.log('🔄 MetadataService: Forcing metadata update for user:', user.email);
      } else {
        console.log('🔄 MetadataService: No existing metadata found, proceeding with detection');
      }

      // Detect account type from database
      console.log('🔎 MetadataService: Starting database detection for user:', user.id);
      const detectedAccountType = await this.detectAccountTypeFromDatabase(user.id);

      console.log('📊 MetadataService: Database detection result:', {
        detectedAccountType,
        success: !!detectedAccountType
      });

      if (!detectedAccountType) {
        console.error('❌ MetadataService: Could not detect account type from database');
        return {
          success: false,
          error: 'Unable to detect account type from database tables'
        };
      }

      console.log('🎯 MetadataService: Detected account type:', detectedAccountType);

      // Update user metadata with retry mechanism
      console.log('🔄 MetadataService: Starting metadata update with authService...');

      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000; // 1 second base delay

      let lastError = '';

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`🔄 MetadataService: Metadata update attempt ${attempt}/${MAX_RETRIES}`);

        try {
          const updateResult = await authService.updateUserMetadata(
            { account_type: detectedAccountType },
            skipSessionCheck
          );

          console.log('📝 MetadataService: AuthService update result:', updateResult);

          if (!updateResult.error) {
            console.log('✅ MetadataService: Successfully updated account_type metadata to:', detectedAccountType);
            return { success: true, accountType: detectedAccountType };
          }

          lastError = updateResult.error;
          console.warn(`⚠️ MetadataService: Attempt ${attempt} failed:`, updateResult.error);

          // Check if this is a timeout error that we should retry
          const isRetryableError = updateResult.error.includes('timeout') ||
                                   updateResult.error.includes('network') ||
                                   updateResult.error.includes('temporarily');

          if (!isRetryableError && attempt < MAX_RETRIES) {
            console.log('❌ MetadataService: Non-retryable error, stopping retries');
            break;
          }

          // Wait before retry (with exponential backoff)
          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
            console.log(`⏳ MetadataService: Waiting ${delay}ms before retry ${attempt + 1}`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          lastError = errorMessage;
          console.error(`❌ MetadataService: Exception on attempt ${attempt}:`, error);

          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
            console.log(`⏳ MetadataService: Waiting ${delay}ms before retry after exception`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      console.error('❌ MetadataService: All retry attempts failed. Last error:', lastError);
      return {
        success: false,
        accountType: detectedAccountType,
        error: `Failed after ${MAX_RETRIES} attempts: ${lastError}`
      };

    } catch (error) {
      console.error('❌ MetadataService: Exception in ensureAccountTypeMetadata:', error);
      if (error instanceof Error) {
        console.error('❌ MetadataService: Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during metadata update'
      };
    }
  }

  /**
   * Batch update metadata for multiple users
   * Useful for backfilling existing users
   */
  async batchEnsureAccountTypeMetadata(
    users: User[],
    options: {
      skipSessionCheck?: boolean;
      debug?: boolean;
      maxConcurrent?: number;
    } = {}
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    const { skipSessionCheck = true, debug = false, maxConcurrent = 5 } = options;
    const results = { success: 0, failed: 0, errors: [] as Array<{ userId: string; error: string }> };

    if (debug) {
      console.log('🔄 MetadataService: Starting batch metadata update for', users.length, 'users');
    }

    // Process users in batches to avoid overwhelming the system
    for (let i = 0; i < users.length; i += maxConcurrent) {
      const batch = users.slice(i, i + maxConcurrent);

      const promises = batch.map(async (user) => {
        const result = await this.ensureAccountTypeMetadata(user, {
          skipSessionCheck,
          debug
        });

        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            userId: user.id,
            error: result.error || 'Unknown error'
          });
        }
      });

      await Promise.all(promises);

      if (debug) {
        console.log(`📊 MetadataService: Processed batch ${Math.floor(i / maxConcurrent) + 1}, Progress: ${i + batch.length}/${users.length}`);
      }
    }

    if (debug) {
      console.log('✅ MetadataService: Batch update complete:', results);
    }

    return results;
  }

  /**
   * Validates that a user has the correct account_type metadata
   * Cross-references with database tables
   */
  async validateAccountTypeMetadata(user: User): Promise<{
    isValid: boolean;
    metadataType?: AccountType;
    databaseType?: AccountType;
    mismatch?: boolean;
  }> {
    const metadataType = user.user_metadata?.account_type;
    const databaseType = await this.detectAccountTypeFromDatabase(user.id);

    const isValid = !!(metadataType && databaseType && metadataType === databaseType);
    const mismatch = !!(metadataType && databaseType && metadataType !== databaseType);

    return {
      isValid,
      metadataType,
      databaseType,
      mismatch
    };
  }
}

// Export singleton instance
export const metadataService = MetadataService.getInstance();

// Export utility functions for convenience
export const ensureAccountTypeMetadata = (user: User, options?: Parameters<MetadataService['ensureAccountTypeMetadata']>[1]) =>
  metadataService.ensureAccountTypeMetadata(user, options);

export const detectAccountTypeFromDatabase = (userId: string) =>
  metadataService.detectAccountTypeFromDatabase(userId);

export const validateAccountTypeMetadata = (user: User) =>
  metadataService.validateAccountTypeMetadata(user);