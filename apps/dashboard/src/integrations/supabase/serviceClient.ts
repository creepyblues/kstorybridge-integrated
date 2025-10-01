/**
 * Supabase Service Role Client
 *
 * This client uses the service role key to bypass RLS policies
 * for administrative operations like profile creation.
 *
 * SECURITY NOTE: Only use for server-side operations or when
 * the regular client fails due to RLS policy issues.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';

// Service role key - only use when necessary for bypassing RLS
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export const getServiceClient = () => {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('🚨 PRODUCTION ISSUE: Service role key not configured');
    console.error('🔧 Add VITE_SUPABASE_SERVICE_ROLE_KEY to environment variables');
    console.error('📋 This will cause OAuth profile creation to fail in production');
    return null;
  }

  if (!serviceClient) {
    serviceClient = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return serviceClient;
};

/**
 * Create buyer profile with service role (bypasses RLS)
 */
export const createBuyerProfileWithServiceRole = async (profileData: {
  id: string;
  email: string;
  full_name: string;
  buyer_company: string;
  buyer_role: string;
  linkedin_url?: string | null;
  tier?: string;
  requested?: boolean;
}) => {
  const client = getServiceClient();

  if (!client) {
    throw new Error('Service role client not available. Missing VITE_SUPABASE_SERVICE_ROLE_KEY environment variable. This is required for OAuth profile creation in production.');
  }

  const safeProfileData = {
    ...profileData,
    linkedin_url: profileData.linkedin_url || null,
    tier: profileData.tier || 'basic',
    requested: profileData.requested || false,
    created_at: new Date().toISOString()
  };

  console.log('🔐 Creating buyer profile with service role:', profileData.email);

  const { data, error } = await client
    .from('user_buyers')
    .insert(safeProfileData)
    .select()
    .single();

  if (error) {
    console.error('❌ Service role profile creation failed:', error);
    throw error;
  }

  console.log('✅ Service role profile creation successful');
  return data;
};

/**
 * Create creator profile with service role (bypasses RLS)
 */
export const createCreatorProfileWithServiceRole = async (profileData: {
  id: string;
  email: string;
  full_name: string;
  pen_name: string;
  ip_owner_role?: string | null;
  ip_owner_company?: string | null;
  website_url?: string | null;
  invitation_status?: string;
}) => {
  const client = getServiceClient();

  if (!client) {
    throw new Error('Service role client not available. Missing VITE_SUPABASE_SERVICE_ROLE_KEY environment variable. This is required for OAuth profile creation in production.');
  }

  const safeProfileData = {
    ...profileData,
    ip_owner_role: profileData.ip_owner_role || null,
    ip_owner_company: profileData.ip_owner_company || null,
    website_url: profileData.website_url || null,
    invitation_status: profileData.invitation_status || 'invited',
    created_at: new Date().toISOString()
  };

  console.log('🔐 Creating creator profile with service role:', profileData.email);

  const { data, error } = await client
    .from('user_creators')
    .insert(safeProfileData)
    .select()
    .single();

  if (error) {
    console.error('❌ Service role profile creation failed:', error);
    throw error;
  }

  console.log('✅ Service role profile creation successful');
  return data;
};