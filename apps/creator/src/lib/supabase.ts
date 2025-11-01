import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Storage key for Supabase auth - CRITICAL for PKCE flow
// Must be explicit to ensure code_verifier persists across OAuth redirect
const STORAGE_KEY = 'sb-dlrnrgcoguxlkkcitlpd-auth-token-creator'

// Enable debug mode in development
const isDev = import.meta.env.DEV

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    storageKey: STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: isDev, // Enhanced logging in development
  },
})

// Enhanced OAuth callback logging
if (typeof window !== 'undefined') {
  const isCallback = window.location.pathname === '/auth/callback'
  const hasCode = window.location.search.includes('code=')

  if (isCallback && hasCode) {
    console.log('🔐 OAuth Callback Debug Info:', {
      pathname: window.location.pathname,
      hasCode: hasCode,
      storageKey: STORAGE_KEY,
      storageContents: localStorage.getItem(STORAGE_KEY) ? 'Present' : 'Missing',
      timestamp: new Date().toISOString()
    })
  }
}
