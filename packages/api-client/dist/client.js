import { createClient } from '@supabase/supabase-js';
// Shared Supabase client configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";
// Create the shared Supabase client
export const createSupabaseClient = () => {
    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
            storage: typeof window !== 'undefined' ? localStorage : undefined,
            persistSession: true,
            autoRefreshToken: true,
        }
    });
};
// Default client instance (can be typed by individual apps)
export const supabase = createSupabaseClient();
