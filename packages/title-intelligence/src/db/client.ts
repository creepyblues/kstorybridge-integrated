/**
 * Database Client
 *
 * Supabase client wrapper for intelligence system
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

/**
 * Initialize Supabase client
 */
export function initializeDatabase(supabaseUrl?: string, supabaseKey?: string): SupabaseClient {
  const url = supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    )
  }

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,  // Server-side usage
      autoRefreshToken: false
    }
  })

  return supabaseClient
}

/**
 * Get Supabase client (initializes if needed)
 */
export function getDatabase(): SupabaseClient {
  if (!supabaseClient) {
    return initializeDatabase()
  }
  return supabaseClient
}

/**
 * Close database connection (cleanup)
 */
export function closeDatabase(): void {
  supabaseClient = null
}
