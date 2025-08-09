import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { adminStorage } from '../../lib/adminStorage'

const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

// Create admin-specific Supabase client with enhanced session persistence
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: adminStorage, // Use isolated admin storage instead of localStorage
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Prevent conflicts with other apps
    flowType: 'pkce', // Use PKCE flow for better security
    debug: process.env.NODE_ENV === 'development', // Enable debug logging in dev
    storageKey: 'admin-auth-token', // Custom storage key for admin app
  },
  global: {
    headers: {
      'X-Client-Info': 'admin-portal', // Identify admin app in logs
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // Reduce realtime load for admin app
    }
  }
})

// Expose client for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).supabaseAdmin = supabase
}