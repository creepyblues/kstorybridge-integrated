// Environment-aware Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Default to production values, but allow override with environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

// Log the configuration in development
if (import.meta.env.DEV) {
  console.log('🗄️ Supabase Client Configuration:', {
    url: SUPABASE_URL,
    isLocal: SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('127.0.0.1'),
    keyPrefix: SUPABASE_PUBLISHABLE_KEY.substring(0, 20) + '...',
    mode: import.meta.env.MODE
  });
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});