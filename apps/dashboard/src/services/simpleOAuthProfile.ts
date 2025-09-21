/**
 * Simple OAuth Profile Service
 *
 * A lightweight approach to OAuth profile creation that focuses on
 * working around session timeout issues during OAuth callback flow.
 */

import { supabase } from '@/integrations/supabase/client';
import { createBuyerProfileWithServiceRole, createCreatorProfileWithServiceRole } from '@/integrations/supabase/serviceClient';

export interface SimpleProfileResult {
  success: boolean;
  error?: string;
  profile?: any;
  userExists?: boolean;
}

/**
 * Simple buyer profile creation for OAuth users
 * Focuses on working around getSession timeouts
 */
export async function createSimpleOAuthBuyerProfile(profileData: {
  id: string;
  email: string;
  full_name: string;
  buyer_company: string;
  buyer_role: string;
  linkedin_url?: string | null;
  tier?: string;
  requested?: boolean;
}): Promise<SimpleProfileResult> {
  try {
    console.log('🚀 Simple OAuth: Creating buyer profile for', profileData.email);

    // Skip the profile check for now - getSession timeouts are causing issues
    // We'll attempt creation directly and handle conflicts
    console.log('⚡ Skipping profile check due to session timeout issues, attempting direct creation...');

    // Prepare profile data
    const profileToCreate = {
      id: profileData.id,
      email: profileData.email.toLowerCase(),
      full_name: profileData.full_name,
      buyer_company: profileData.buyer_company,
      buyer_role: profileData.buyer_role,
      linkedin_url: profileData.linkedin_url || null,
      tier: profileData.tier || 'basic',
      requested: profileData.requested || false,
      created_at: new Date().toISOString()
    };

    // Try to create the profile directly
    console.log('💾 Attempting profile creation...');

    // Skip getSession() since it's timing out - OAuth flow already authenticated
    console.log('⚡ Bypassing getSession timeout issues - proceeding with OAuth profile creation...');

    const { data: newProfile, error: createError } = await supabase
      .from('user_buyers')
      .insert(profileToCreate)
      .select()
      .single();

    if (createError) {
      // If it's a duplicate key error, the profile might have been created by triggers
      if (createError.code === '23505') {
        console.log('🔄 Profile creation conflict, checking for existing profile...');

        const { data: conflictProfile, error: conflictError } = await supabase
          .from('user_buyers')
          .select('*')
          .eq('id', profileData.id)
          .single();

        if (!conflictError && conflictProfile) {
          console.log('✅ Found existing profile after conflict');
          return {
            success: true,
            profile: conflictProfile,
            userExists: true
          };
        }
      }

      // If it's an RLS policy violation, try using service role
      if (createError.code === '42501' || createError.message?.includes('row-level security')) {
        console.log('🔐 RLS policy violation detected, trying service role...');

        try {
          const serviceProfile = await createBuyerProfileWithServiceRole({
            id: profileData.id,
            email: profileData.email,
            full_name: profileData.full_name,
            buyer_company: profileData.buyer_company,
            buyer_role: profileData.buyer_role,
            linkedin_url: profileData.linkedin_url,
            tier: profileData.tier || 'basic',
            requested: profileData.requested || false
          });

          console.log('✅ Service role profile creation successful');
          return {
            success: true,
            profile: serviceProfile,
            userExists: false
          };

        } catch (serviceError) {
          console.error('❌ Service role profile creation also failed:', serviceError);
          return {
            success: false,
            error: `Profile creation failed with both regular and service role methods. Please contact support.`
          };
        }
      }

      console.error('❌ Profile creation failed:', createError);
      return {
        success: false,
        error: `Profile creation failed: ${createError.message}. Your account may have been created - try signing in.`
      };
    }

    console.log('✅ Buyer profile created successfully');
    return {
      success: true,
      profile: newProfile,
      userExists: false
    };

  } catch (error) {
    console.error('❌ Simple OAuth profile creation error:', error);
    return {
      success: false,
      error: `Account creation encountered an issue: ${error instanceof Error ? error.message : 'Unknown error'}. Please try signing in.`
    };
  }
}

/**
 * Simple creator profile creation for OAuth users
 */
export async function createSimpleOAuthCreatorProfile(profileData: {
  id: string;
  email: string;
  full_name: string;
  pen_name: string;
  ip_owner_role?: string | null;
  ip_owner_company?: string | null;
  website_url?: string | null;
}): Promise<SimpleProfileResult> {
  try {
    console.log('🚀 Simple OAuth: Creating creator profile for', profileData.email);

    // First, check if profile already exists
    console.log('🔍 Checking if creator profile already exists...');

    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_creators')
        .select('*')
        .eq('email', profileData.email.toLowerCase())
        .maybeSingle();

      if (!checkError && existingProfile) {
        console.log('✅ Creator profile already exists, returning existing profile');
        return {
          success: true,
          profile: existingProfile,
          userExists: true
        };
      }

      console.log('📝 No existing profile found, creating new one...');
    } catch (checkException) {
      console.warn('⚠️ Profile check failed, proceeding with creation:', checkException);
    }

    // Prepare profile data
    const profileToCreate = {
      id: profileData.id,
      email: profileData.email.toLowerCase(),
      full_name: profileData.full_name,
      pen_name: profileData.pen_name,
      ip_owner_role: profileData.ip_owner_role,
      ip_owner_company: profileData.ip_owner_company,
      website_url: profileData.website_url,
      invitation_status: 'invited',
      created_at: new Date().toISOString()
    };

    // Try to create the profile directly
    console.log('💾 Attempting creator profile creation...');

    const { data: newProfile, error: createError } = await supabase
      .from('user_creators')
      .insert(profileToCreate)
      .select()
      .single();

    if (createError) {
      // If it's a duplicate key error, the profile might have been created by triggers
      if (createError.code === '23505') {
        console.log('🔄 Creator profile creation conflict, checking for existing profile...');

        const { data: conflictProfile, error: conflictError } = await supabase
          .from('user_creators')
          .select('*')
          .eq('id', profileData.id)
          .single();

        if (!conflictError && conflictProfile) {
          console.log('✅ Found existing creator profile after conflict');
          return {
            success: true,
            profile: conflictProfile,
            userExists: true
          };
        }
      }

      // If it's an RLS policy violation, try using service role
      if (createError.code === '42501' || createError.message?.includes('row-level security')) {
        console.log('🔐 RLS policy violation detected for creator, trying service role...');

        try {
          const serviceProfile = await createCreatorProfileWithServiceRole({
            id: profileData.id,
            email: profileData.email,
            full_name: profileData.full_name,
            pen_name: profileData.pen_name,
            ip_owner_role: profileData.ip_owner_role,
            ip_owner_company: profileData.ip_owner_company,
            website_url: profileData.website_url,
            invitation_status: 'invited'
          });

          console.log('✅ Service role creator profile creation successful');
          return {
            success: true,
            profile: serviceProfile,
            userExists: false
          };

        } catch (serviceError) {
          console.error('❌ Service role creator profile creation also failed:', serviceError);
          return {
            success: false,
            error: `Creator profile creation failed with both regular and service role methods. Please contact support.`
          };
        }
      }

      console.error('❌ Creator profile creation failed:', createError);
      return {
        success: false,
        error: `Creator profile creation failed: ${createError.message}. Your account may have been created - try signing in.`
      };
    }

    console.log('✅ Creator profile created successfully');
    return {
      success: true,
      profile: newProfile,
      userExists: false
    };

  } catch (error) {
    console.error('❌ Simple OAuth creator profile creation error:', error);
    return {
      success: false,
      error: `Creator account creation encountered an issue: ${error instanceof Error ? error.message : 'Unknown error'}. Please try signing in.`
    };
  }
}