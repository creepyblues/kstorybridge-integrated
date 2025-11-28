import { databaseClient } from '../database/DatabaseClient';
import type { AuthUser } from './AuthService';

export interface BuyerProfile {
  id: string;
  email: string;
  full_name: string;
  buyer_company: string;
  buyer_role: string;
  linkedin_url?: string;
  tier: 'basic' | 'invited' | 'pro' | 'suite';
  requested: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatorProfile {
  id: string;
  email: string;
  full_name: string;
  pen_name: string;
  ip_owner_role?: string;
  ip_owner_company?: string;
  website_url?: string;
  invitation_status: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service for managing user profiles
 */
export class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Get buyer profile by email
   */
  async getBuyerProfile(email: string): Promise<{ data: BuyerProfile | null; error?: string }> {
    return await databaseClient.select<BuyerProfile>('user_buyers', '*', {
      filters: { email },
      single: true
    });
  }

  /**
   * Get creator profile by email
   */
  async getCreatorProfile(email: string): Promise<{ data: CreatorProfile | null; error?: string }> {
    return await databaseClient.select<CreatorProfile>('user_creators', '*', {
      filters: { email },
      single: true
    });
  }

  /**
   * Update buyer profile
   */
  async updateBuyerProfile(
    email: string,
    updates: Partial<BuyerProfile>
  ): Promise<{ data: BuyerProfile | null; error?: string }> {
    return await databaseClient.update<BuyerProfile>('user_buyers', updates, { email });
  }

  /**
   * Update creator profile
   */
  async updateCreatorProfile(
    email: string,
    updates: Partial<CreatorProfile>
  ): Promise<{ data: CreatorProfile | null; error?: string }> {
    return await databaseClient.update<CreatorProfile>('user_creators', updates, { email });
  }

  /**
   * Check if buyer profile exists
   */
  async buyerProfileExists(email: string): Promise<boolean> {
    const { data } = await this.getBuyerProfile(email);
    return !!data;
  }

  /**
   * Check if creator profile exists
   */
  async creatorProfileExists(email: string): Promise<boolean> {
    const { data } = await this.getCreatorProfile(email);
    return !!data;
  }

  /**
   * Get user's account type by checking which profile exists
   */
  async getAccountType(email: string): Promise<'buyer' | 'creator' | null> {
    const [buyerExists, creatorExists] = await Promise.all([
      this.buyerProfileExists(email),
      this.creatorProfileExists(email)
    ]);

    if (buyerExists) return 'buyer';
    if (creatorExists) return 'creator';
    return null;
  }

  /**
   * Get user profile regardless of type
   */
  async getUserProfile(email: string): Promise<{
    data: (BuyerProfile | CreatorProfile) | null;
    accountType: 'buyer' | 'creator' | null;
    error?: string;
  }> {
    // Check buyer first
    const buyerResult = await this.getBuyerProfile(email);
    if (buyerResult.data) {
      return {
        data: buyerResult.data,
        accountType: 'buyer',
        error: buyerResult.error
      };
    }

    // Check creator
    const creatorResult = await this.getCreatorProfile(email);
    if (creatorResult.data) {
      return {
        data: creatorResult.data,
        accountType: 'creator',
        error: creatorResult.error
      };
    }

    return {
      data: null,
      accountType: null,
      error: 'No profile found'
    };
  }

  /**
   * Create buyer profile
   */
  async createBuyerProfile(profileData: Omit<BuyerProfile, 'created_at' | 'updated_at'>): Promise<{
    data: BuyerProfile | null;
    error?: string;
  }> {
    return await databaseClient.insert<BuyerProfile>('user_buyers', profileData);
  }

  /**
   * Create creator profile
   */
  async createCreatorProfile(profileData: Omit<CreatorProfile, 'created_at' | 'updated_at'>): Promise<{
    data: CreatorProfile | null;
    error?: string;
  }> {
    return await databaseClient.insert<CreatorProfile>('user_creators', profileData);
  }

  /**
   * Delete user profile
   */
  async deleteProfile(email: string, accountType: 'buyer' | 'creator'): Promise<{ error?: string }> {
    const table = accountType === 'buyer' ? 'user_buyers' : 'user_creators';
    return await databaseClient.delete(table, { email });
  }

  /**
   * Get all buyer profiles (admin function)
   */
  async getAllBuyerProfiles(): Promise<{ data: BuyerProfile[] | null; error?: string }> {
    return await databaseClient.select<BuyerProfile[]>('user_buyers', '*', {
      orderBy: 'created_at',
      ascending: false
    });
  }

  /**
   * Get all creator profiles (admin function)
   */
  async getAllCreatorProfiles(): Promise<{ data: CreatorProfile[] | null; error?: string }> {
    return await databaseClient.select<CreatorProfile[]>('user_creators', '*', {
      orderBy: 'created_at',
      ascending: false
    });
  }
}

// Export singleton instance
export const profileService = ProfileService.getInstance();